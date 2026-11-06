import { attachDatabasePool } from '@neon/functions';
import { createRealtime, rawSql } from '@neon/realtime/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Pool } from 'pg';
import { profiles } from './db-schema.js';

const databaseUrl = process.env.DATABASE_URL;
const authUrl = process.env.NEON_AUTH_BASE_URL;
const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
if (!databaseUrl || !authUrl || !jwksUrl) throw new Error('Neon Postgres and Auth must be enabled before deploying the Elsewhere API.');

const pool = new Pool({ connectionString: databaseUrl, max: 5 });
pool.on('error', (error) => console.error('Postgres pool error', error));
attachDatabasePool(pool);
const db = drizzle(pool);
const jwks = createRemoteJWKSet(new URL(jwksUrl));
const authIssuer = new URL(authUrl).origin;
const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! },
});
const bucket = 'assets';
const realtime = process.env.REALTIME_SECRET
  ? createRealtime({ secret: process.env.REALTIME_SECRET, db: new URL(databaseUrl).pathname.slice(1) })
  : null;

type Principal = { id: string };
type ProfileRow = { id: string; username: string; display_name: string; bio: string; avatar_id: number; avatar_color: string; avatar_shape_id: number; avatar_mark_id: number; created_at: Date };
type MessageRow = { id: string; conversation_id: string; sender_id: string; body: string; image_key: string | null; created_at: Date };

const app = new Hono<{ Variables: { user: Principal } }>();
app.use('*', cors({ origin: '*', allowHeaders: ['Content-Type', 'Authorization'], allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
const forward = (response: Response) => new Response(response.body, { status: response.status, statusText: response.statusText, headers: response.headers });

app.use('/api/*', async (c, next) => {
  const authorization = c.req.header('authorization') ?? '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return c.json({ error: 'Sign in to continue.' }, 401);
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: authIssuer, algorithms: ['EdDSA'] });
    if (!payload.sub) return c.json({ error: 'Invalid session.' }, 401);
    c.set('user', { id: payload.sub });
  } catch {
    return c.json({ error: 'Your session expired. Sign in again.' }, 401);
  }
  await next();
});

app.get('/health', async (c) => {
  await db.execute(sql.raw('SELECT 1'));
  return c.json({ ok: true, services: ['postgres', 'auth', 'object-storage', 'functions', 'realtime'] });
});

function profile(row: ProfileRow) {
  return { id: row.id, username: row.username, displayName: row.display_name, bio: row.bio, avatarId: row.avatar_id, avatarColor: row.avatar_color, avatarShapeId: row.avatar_shape_id, avatarMarkId: row.avatar_mark_id, createdAt: row.created_at.toISOString() };
}

app.get('/api/profile/me', async (c) => {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, c.get('user').id)).limit(1);
  return c.json(row ? profile(row) : null);
});

app.put('/api/profile/me', async (c) => {
  const userId = c.get('user').id;
  const body = await c.req.json<{ username: string; displayName: string; bio?: string; avatarId: number; avatarColor: string; avatarShapeId: number; avatarMarkId: number }>();
  const username = body.username?.toLowerCase().replace(/^@/, '');
  if (!/^[a-z0-9_]{3,18}$/.test(username ?? '') || !body.displayName?.trim() || body.displayName.trim().length > 24) return c.json({ error: 'Choose a valid display name and username.' }, 400);
  try {
    const [row] = await db.insert(profiles).values({
      id: userId, username, display_name: body.displayName.trim(), bio: body.bio ?? '',
      avatar_id: body.avatarId ?? 4, avatar_color: body.avatarColor ?? '#6258D9',
      avatar_shape_id: body.avatarShapeId ?? body.avatarId ?? 4, avatar_mark_id: body.avatarMarkId ?? body.avatarId ?? 4,
    }).onConflictDoUpdate({
      target: profiles.id,
      set: { username, display_name: body.displayName.trim(), bio: body.bio ?? '', avatar_id: body.avatarId ?? 4, avatar_color: body.avatarColor ?? '#6258D9', avatar_shape_id: body.avatarShapeId ?? body.avatarId ?? 4, avatar_mark_id: body.avatarMarkId ?? body.avatarId ?? 4 },
    }).returning();
    return c.json(profile(row));
  } catch (error) {
    if ((error as { code?: string }).code === '23505') return c.json({ error: 'That username is already taken.' }, 409);
    throw error;
  }
});

async function requireProfile(userId: string) {
  const result = await pool.query<ProfileRow>('SELECT * FROM profiles WHERE id = $1', [userId]);
  if (!result.rows[0]) throw new Error('Complete your profile first.');
  return result.rows[0];
}

async function conversationForUser(conversationId: string, userId: string) {
  const result = await pool.query('SELECT * FROM conversations WHERE id = $1 AND (participant_a = $2 OR participant_b = $2)', [conversationId, userId]);
  if (!result.rowCount) throw new Error('Conversation not found.');
  return result.rows[0];
}

function messageDto(row: MessageRow, imageUrl: string | null = null) {
  return { id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, body: row.body, imageUrl, createdAt: row.created_at.toISOString(), createdAtLabel: new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(row.created_at) };
}

async function signedImage(key: string) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 300 });
}

app.get('/api/chats', async (c) => {
  const userId = c.get('user').id;
  const result = await pool.query(`SELECT c.id, p.id AS person_id, p.username, p.display_name, p.bio, p.avatar_id, p.avatar_color, p.avatar_shape_id, p.avatar_mark_id,
      m.body, m.created_at
    FROM conversations c JOIN profiles p ON p.id = CASE WHEN c.participant_a=$1 THEN c.participant_b ELSE c.participant_a END
    LEFT JOIN LATERAL (SELECT body, created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) m ON true
    WHERE (c.participant_a=$1 OR c.participant_b=$1) AND EXISTS (SELECT 1 FROM messages seen WHERE seen.conversation_id=c.id) ORDER BY m.created_at DESC NULLS LAST`, [userId]);
  return c.json(result.rows.map((row) => ({ id: row.id, person: { id: row.person_id, username: row.username, displayName: row.display_name, bio: row.bio, avatarId: row.avatar_id, avatarColor: row.avatar_color, avatarShapeId: row.avatar_shape_id, avatarMarkId: row.avatar_mark_id }, latestMessage: row.body ?? '', updatedAtLabel: row.created_at ? new Date(row.created_at).toISOString() : '', unreadCount: 0 })));
});

app.get('/api/chats/:id/messages', async (c) => {
  const userId = c.get('user').id;
  await conversationForUser(c.req.param('id'), userId);
  const result = await pool.query<MessageRow>('SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT 200', [c.req.param('id')]);
  return c.json(await Promise.all(result.rows.map(async (row) => messageDto(row, row.image_key ? await signedImage(row.image_key) : null))));
});

app.post('/api/chats/:id/messages', async (c) => {
  const userId = c.get('user').id;
  await conversationForUser(c.req.param('id'), userId);
  const body = await c.req.json<{ body?: string; imageKey?: string | null }>();
  const text = body.body?.trim() ?? '';
  const key = body.imageKey ?? null;
  if (!text && !key) return c.json({ error: 'Add a message or photo.' }, 400);
  if (key && !key.startsWith(`chat/${c.req.param('id')}/${userId}/`)) return c.json({ error: 'This upload does not belong to this conversation.' }, 403);
  if (key) {
    try {
      const object = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      if (!object.ContentLength || object.ContentLength > 8 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(object.ContentType ?? '')) return c.json({ error: 'The uploaded file is not a supported image.' }, 400);
    } catch {
      return c.json({ error: 'The photo upload could not be found. Try again.' }, 400);
    }
  }
  const result = await pool.query<MessageRow>('INSERT INTO messages (conversation_id, sender_id, body, image_key) VALUES ($1,$2,$3,$4) RETURNING *', [c.req.param('id'), userId, text, key]);
  const row = result.rows[0];
  return c.json(messageDto(row, key ? await signedImage(key) : null), 201);
});

app.post('/api/chats/:id/media', async (c) => {
  const userId = c.get('user').id;
  await conversationForUser(c.req.param('id'), userId);
  const body = await c.req.json<{ contentType: string; size: number }>();
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(body.contentType) || body.size > 8 * 1024 * 1024 || body.size < 1) return c.json({ error: 'Choose an image smaller than 8 MB.' }, 400);
  const extension = body.contentType.split('/')[1].replace('jpeg', 'jpg');
  const key = `chat/${c.req.param('id')}/${userId}/${crypto.randomUUID()}.${extension}`;
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: body.contentType, ContentLength: body.size }), { expiresIn: 300 });
  return c.json({ key, uploadUrl });
});

app.get('/api/chats/:id/live', async (c) => {
  if (!realtime) return c.json({ error: 'Neon Realtime is not available.' }, 503);
  const userId = c.get('user').id;
  const conversationId = c.req.param('id');
  await conversationForUser(conversationId, userId);
  const query = rawSql<MessageRow>(`SELECT m.id, m.conversation_id, m.sender_id, m.body, m.image_key, m.created_at FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE c.id=$2 AND (c.participant_a=$1 OR c.participant_b=$1) ORDER BY m.created_at ASC LIMIT 200`, [userId, conversationId]);
  return c.json(await realtime.seal({ query }));
});

app.post('/api/chats/start', async (c) => {
  const userId = c.get('user').id;
  const { userId: otherId } = await c.req.json<{ userId: string }>();
  if (otherId === userId) return c.json({ error: 'You cannot start a chat with yourself.' }, 400);
  const pair = [userId, otherId].sort();
  const friendship = await pool.query('SELECT 1 FROM friendships WHERE user_a=$1 AND user_b=$2', pair);
  if (!friendship.rowCount) return c.json({ error: 'Add this person as a friend before starting a chat.' }, 403);
  const result = await pool.query('INSERT INTO conversations (participant_a, participant_b) VALUES ($1,$2) ON CONFLICT (participant_a, participant_b) DO UPDATE SET participant_a=EXCLUDED.participant_a RETURNING id', pair);
  return c.json({ id: result.rows[0].id }, 201);
});

app.get('/api/friends', async (c) => {
  const userId = c.get('user').id;
  const result = await pool.query(`SELECT p.*,
      (SELECT active_pod.code FROM pod_members m JOIN pods active_pod ON active_pod.id=m.pod_id
        WHERE m.user_id=p.id AND m.left_at IS NULL AND active_pod.is_active LIMIT 1) AS active_room_code
    FROM friendships f JOIN profiles p ON p.id=CASE WHEN f.user_a=$1 THEN f.user_b ELSE f.user_a END
    WHERE f.user_a=$1 OR f.user_b=$1 ORDER BY p.display_name`, [userId]);
  return c.json(result.rows.map((row) => ({ id: row.id, username: row.username, displayName: row.display_name, bio: row.bio, avatarId: row.avatar_id, avatarColor: row.avatar_color, avatarShapeId: row.avatar_shape_id, avatarMarkId: row.avatar_mark_id, ...(row.active_room_code ? { activeRoomCode: row.active_room_code } : {}) })));
});

app.get('/api/friends/search', async (c) => {
  const userId = c.get('user').id;
  const query = (c.req.query('q') ?? '').replace(/^@/, '').trim();
  if (query.length < 2) return c.json([]);
  const result = await pool.query(`SELECT p.* FROM profiles p WHERE p.id<>$1 AND (p.username ILIKE $2 OR p.display_name ILIKE $2) AND NOT EXISTS (SELECT 1 FROM friendships f WHERE (f.user_a=$1 AND f.user_b=p.id) OR (f.user_b=$1 AND f.user_a=p.id)) ORDER BY p.username LIMIT 5`, [userId, `%${query}%`]);
  return c.json(result.rows.map((row) => ({ id: row.id, username: row.username, displayName: row.display_name, bio: row.bio, avatarId: row.avatar_id, avatarColor: row.avatar_color, avatarShapeId: row.avatar_shape_id, avatarMarkId: row.avatar_mark_id })));
});

app.get('/api/friend-requests', async (c) => {
  const result = await pool.query(`SELECT r.id AS request_id, p.id AS user_id, p.username,p.display_name,p.bio,p.avatar_id,p.avatar_color,p.avatar_shape_id,p.avatar_mark_id FROM friend_requests r JOIN profiles p ON p.id=r.sender_id WHERE r.recipient_id=$1 AND r.status='pending' ORDER BY r.created_at`, [c.get('user').id]);
  return c.json(result.rows.map((row) => ({ id: row.request_id, user: { id: row.user_id, username: row.username, displayName: row.display_name, bio: row.bio, avatarId: row.avatar_id, avatarColor: row.avatar_color, avatarShapeId: row.avatar_shape_id, avatarMarkId: row.avatar_mark_id } })));
});

app.post('/api/friend-requests', async (c) => {
  const senderId = c.get('user').id;
  const { userId: recipientId } = await c.req.json<{ userId: string }>();
  if (senderId === recipientId) return c.json({ error: 'You cannot add yourself.' }, 400);
  await requireProfile(recipientId);
  try {
    await pool.query('INSERT INTO friend_requests (sender_id, recipient_id) VALUES ($1,$2)', [senderId, recipientId]);
    return c.body(null, 204);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') return c.json({ error: 'A request already exists.' }, 409);
    throw error;
  }
});

app.post('/api/friend-requests/:id/:action', async (c) => {
  const userId = c.get('user').id;
  const action = c.req.param('action');
  if (!['accept', 'decline'].includes(action)) return c.json({ error: 'Unknown action.' }, 404);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const request = await client.query('SELECT * FROM friend_requests WHERE id=$1 AND recipient_id=$2 AND status=\'pending\' FOR UPDATE', [c.req.param('id'), userId]);
    if (!request.rowCount) { await client.query('ROLLBACK'); return c.json({ error: 'Request not found.' }, 404); }
    if (action === 'accept') {
      const [a, b] = [userId, request.rows[0].sender_id].sort();
      await client.query('INSERT INTO friendships (user_a,user_b) VALUES ($1,$2) ON CONFLICT DO NOTHING', [a, b]);
      await client.query('INSERT INTO friend_requests (sender_id,recipient_id,status) VALUES ($1,$2,\'accepted\') ON CONFLICT (sender_id,recipient_id) DO UPDATE SET status=\'accepted\'', [request.rows[0].sender_id, userId]);
    }
    await client.query('UPDATE friend_requests SET status=$1 WHERE id=$2', [action === 'accept' ? 'accepted' : 'declined', c.req.param('id')]);
    await client.query('COMMIT');
    return c.body(null, 204);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

async function roomDto(row: { id: string; code: string; title: string; description: string; capacity: number; participant_count: number; participants: unknown }) {
  return { id: row.id, code: row.code, title: row.title, description: row.description, capacity: row.capacity, participantCount: Number(row.participant_count), participants: row.participants ?? [] };
}
const roomSelect = `SELECT p.id,p.code,p.title,p.description,p.capacity,count(m.user_id)::int AS participant_count,
  COALESCE(jsonb_agg(jsonb_build_object('id',u.id,'username',u.username,'displayName',u.display_name,'bio',u.bio,'avatarId',u.avatar_id,'avatarColor',u.avatar_color,'avatarShapeId',u.avatar_shape_id,'avatarMarkId',u.avatar_mark_id,'status','listening')) FILTER (WHERE u.id IS NOT NULL), '[]'::jsonb) AS participants
  FROM pods p LEFT JOIN pod_members m ON m.pod_id=p.id AND m.left_at IS NULL LEFT JOIN profiles u ON u.id=m.user_id`;

app.get('/api/pods', async (c) => {
  const result = await pool.query(`${roomSelect} WHERE p.is_active GROUP BY p.id ORDER BY (count(m.user_id) < p.capacity) DESC, (count(m.user_id) > 0) DESC, count(m.user_id) DESC, p.is_default DESC, p.created_at DESC`);
  return c.json(await Promise.all(result.rows.map(roomDto)));
});

app.get('/api/pods/code/:code', async (c) => {
  const result = await pool.query(`${roomSelect} WHERE p.code=$1 AND p.is_active GROUP BY p.id`, [c.req.param('code')]);
  return c.json(result.rows[0] ? await roomDto(result.rows[0]) : null);
});

const automaticPodThemes = [
  ['Good Company', 'A welcoming place for open, easygoing conversation.'],
  ['Curious Minds', 'Bring a question, an idea, or something you have been wondering about.'],
  ['Today’s Little Wins', 'Share something that made today a little better.'],
  ['A Fresh Perspective', 'Trade thoughts and hear how other people see things.'],
  ['The Cozy Corner', 'Settle in for a friendly chat about whatever is on your mind.'],
  ['Small Discoveries', 'Talk about something interesting you found or learned.'],
  ['Open Conversation', 'No set topic. Start wherever feels comfortable.'],
  ['Stories & Side Notes', 'Bring a story, a tangent, or a fun detail from your day.'],
  ['Slow Sunday', 'Take a breath and enjoy some relaxed company.'],
  ['Bright Ideas', 'Share a thought, ask a question, or build on someone else’s idea.'],
  ['Around Here', 'Talk about places, routines, and the little things nearby.'],
  ['A Moment to Chat', 'Drop in for a light conversation and meet someone new.'],
  ['The Listening Room', 'A thoughtful space for stories and good questions.'],
  ['Tea Break', 'Pause for a friendly chat and a change of pace.'],
  ['Curiosity Club', 'Follow an interesting question wherever it leads.'],
  ['Good Questions', 'Ask something you have always wanted to ask.'],
  ['The Common Room', 'An easy place to meet and talk about anything.'],
  ['Passing Thoughts', 'Share what has been on your mind lately.'],
  ['Little Stories', 'Trade everyday stories, funny moments, and small surprises.'],
  ['Kind Company', 'A welcoming chat for anyone looking for a little company.'],
  ['New Angles', 'Explore a topic from a different point of view.'],
  ['The Open Seat', 'There is room for one more voice and a new conversation.'],
  ['A Good Pause', 'Take a break and enjoy a calm conversation.'],
  ['Common Ground', 'Find a shared interest or discover something new.'],
];

app.post('/api/pods/new', async (c) => {
  const userId = c.get('user').id;
  const client = await pool.connect();
  let podId: string | undefined;
  try {
    await client.query('BEGIN');
    const profile = await client.query('SELECT id FROM profiles WHERE id=$1 FOR UPDATE', [userId]);
    if (!profile.rowCount) { await client.query('ROLLBACK'); return c.json({ error: 'Complete your profile first.' }, 409); }
    const active = await client.query<{ pod_id: string; is_default: boolean }>(`SELECT m.pod_id,p.is_default FROM pod_members m JOIN pods p ON p.id=m.pod_id
      WHERE m.user_id=$1 AND m.left_at IS NULL FOR UPDATE OF p`, [userId]);
    if (active.rowCount) {
      const activePodId = active.rows[0].pod_id;
      await client.query('UPDATE pod_members SET left_at=now() WHERE pod_id=$1 AND user_id=$2 AND left_at IS NULL', [activePodId, userId]);
      const remaining = await client.query<{ count: number }>('SELECT count(*)::int AS count FROM pod_members WHERE pod_id=$1 AND left_at IS NULL', [activePodId]);
      if (Number(remaining.rows[0].count) === 0 && !active.rows[0].is_default) {
        await client.query('DELETE FROM pods WHERE id=$1', [activePodId]);
      }
    }
    const usedTitles = await client.query<{ title: string }>('SELECT title FROM pods WHERE is_active');
    const used = new Set(usedTitles.rows.map((row) => row.title));
    const availableThemes = automaticPodThemes.filter(([title]) => !used.has(title));
    const themePool = availableThemes.length ? availableThemes : automaticPodThemes;
    const theme = themePool[Math.floor(Math.random() * themePool.length)];
    for (let attempt = 0; attempt < 10 && !podId; attempt += 1) {
      const created = await client.query<{ id: string }>("INSERT INTO pods (code,title,description) VALUES ((1000+floor(random()*9000))::int::text,$1,$2) ON CONFLICT (code) DO NOTHING RETURNING id", theme);
      podId = created.rows[0]?.id;
    }
    if (!podId) { await client.query('ROLLBACK'); return c.json({ error: 'Could not open a new Pod right now. Try again.' }, 503); }
    await client.query('INSERT INTO pod_members (pod_id,user_id,left_at) VALUES ($1,$2,NULL) ON CONFLICT (pod_id,user_id) DO UPDATE SET joined_at=now(),left_at=NULL', [podId, userId]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  const result = await pool.query(`${roomSelect} WHERE p.id=$1 GROUP BY p.id`, [podId]);
  return c.json(await roomDto(result.rows[0]));
});

app.post('/api/pods/:id/join', async (c) => {
  const userId = c.get('user').id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const profile = await client.query('SELECT id FROM profiles WHERE id=$1 FOR UPDATE', [userId]);
    if (!profile.rowCount) { await client.query('ROLLBACK'); return c.json({ error: 'Complete your profile first.' }, 409); }
    const active = await client.query('SELECT pod_id FROM pod_members WHERE user_id=$1 AND left_at IS NULL', [userId]);
    if (active.rowCount && active.rows[0].pod_id !== c.req.param('id')) {
      await client.query('ROLLBACK');
      return c.json({ error: 'Leave your current Pod before joining another.' }, 409);
    }
    const pod = await client.query('SELECT * FROM pods WHERE id=$1 AND is_active FOR UPDATE', [c.req.param('id')]);
    if (!pod.rowCount) { await client.query('ROLLBACK'); return c.json({ error: 'Pod not found.' }, 404); }
    if (active.rowCount) {
      await client.query('COMMIT');
      const result = await pool.query(`${roomSelect} WHERE p.id=$1 GROUP BY p.id`, [c.req.param('id')]);
      return c.json(await roomDto(result.rows[0]));
    }
    const count = await client.query('SELECT count(*)::int AS count FROM pod_members WHERE pod_id=$1 AND left_at IS NULL', [c.req.param('id')]);
    if (Number(count.rows[0].count) >= pod.rows[0].capacity) { await client.query('ROLLBACK'); return c.json({ error: 'This Pod is full. Try another Pod.' }, 409); }
    await client.query('INSERT INTO pod_members (pod_id,user_id,left_at) VALUES ($1,$2,NULL) ON CONFLICT (pod_id,user_id) DO UPDATE SET joined_at=now(),left_at=NULL', [c.req.param('id'), userId]);
    await client.query('COMMIT');
    const result = await pool.query(`${roomSelect} WHERE p.id=$1 GROUP BY p.id`, [c.req.param('id')]);
    return c.json(await roomDto(result.rows[0]));
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

app.post('/api/pods/:id/leave', async (c) => {
  const userId = c.get('user').id;
  const podId = c.req.param('id');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM profiles WHERE id=$1 FOR UPDATE', [userId]);
    const pod = await client.query<{ is_default: boolean }>('SELECT is_default FROM pods WHERE id=$1 FOR UPDATE', [podId]);
    if (!pod.rowCount) { await client.query('ROLLBACK'); return c.body(null, 204); }
    await client.query('UPDATE pod_members SET left_at=now() WHERE pod_id=$1 AND user_id=$2 AND left_at IS NULL', [podId, userId]);
    const remaining = await client.query<{ count: number }>('SELECT count(*)::int AS count FROM pod_members WHERE pod_id=$1 AND left_at IS NULL', [podId]);
    if (Number(remaining.rows[0].count) === 0 && !pod.rows[0].is_default) {
      await client.query('DELETE FROM pods WHERE id=$1', [podId]);
    }
    await client.query('COMMIT');
    return c.body(null, 204);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

app.post('/api/pods/:id/shuffle', async (c) => {
  const userId = c.get('user').id;
  const currentId = c.req.param('id');
  const client = await pool.connect();
  let selectedId: string | null = null;
  try {
    await client.query('BEGIN');
    const profile = await client.query('SELECT id FROM profiles WHERE id=$1 FOR UPDATE', [userId]);
    if (!profile.rowCount) { await client.query('ROLLBACK'); return c.json({ error: 'Complete your profile first.' }, 409); }
    const current = await client.query('SELECT 1 FROM pod_members WHERE pod_id=$1 AND user_id=$2 AND left_at IS NULL', [currentId, userId]);
    if (!current.rowCount) { await client.query('ROLLBACK'); return c.json({ error: 'You are not in this Pod.' }, 404); }
    const currentPod = await client.query<{ is_default: boolean }>('SELECT is_default FROM pods WHERE id=$1 FOR UPDATE', [currentId]);
    const candidates = await client.query<{ id: string }>('SELECT id FROM pods WHERE is_active AND id<>$1 ORDER BY random()', [currentId]);
    for (const candidate of candidates.rows) {
      const locked = await client.query<{ id: string; capacity: number }>('SELECT id,capacity FROM pods WHERE id=$1 AND is_active FOR UPDATE SKIP LOCKED', [candidate.id]);
      if (!locked.rowCount) continue;
      const count = await client.query<{ count: number }>('SELECT count(*)::int AS count FROM pod_members WHERE pod_id=$1 AND left_at IS NULL', [candidate.id]);
      if (Number(count.rows[0].count) < locked.rows[0].capacity) { selectedId = candidate.id; break; }
    }
    if (!selectedId) { await client.query('ROLLBACK'); return c.json(null); }
    await client.query('UPDATE pod_members SET left_at=now() WHERE pod_id=$1 AND user_id=$2 AND left_at IS NULL', [currentId, userId]);
    const remainingOld = await client.query<{ user_id: string }>('SELECT user_id FROM pod_members WHERE pod_id=$1 AND left_at IS NULL ORDER BY joined_at,user_id LIMIT 1', [currentId]);
    if (!remainingOld.rowCount && !currentPod.rows[0].is_default) {
      await client.query('DELETE FROM pods WHERE id=$1', [currentId]);
    }
    await client.query('INSERT INTO pod_members (pod_id,user_id,left_at) VALUES ($1,$2,NULL) ON CONFLICT (pod_id,user_id) DO UPDATE SET joined_at=now(),left_at=NULL', [selectedId, userId]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  const result = await pool.query(`${roomSelect} WHERE p.id=$1 GROUP BY p.id`, [selectedId]);
  return c.json(await roomDto(result.rows[0]));
});

app.get('/api/invites', async (c) => {
  const result = await pool.query(`SELECT i.id,i.pod_id,p.code,p.title,p.description,u.id AS from_id,u.username,u.display_name,u.bio,u.avatar_id,u.avatar_color,u.avatar_shape_id,u.avatar_mark_id FROM pod_invites i JOIN pods p ON p.id=i.pod_id JOIN profiles u ON u.id=i.sender_id WHERE i.recipient_id=$1 AND i.status='pending' ORDER BY i.created_at`, [c.get('user').id]);
  return c.json(result.rows.map((row) => ({ id: row.id, from: { id: row.from_id, username: row.username, displayName: row.display_name, bio: row.bio, avatarId: row.avatar_id, avatarColor: row.avatar_color, avatarShapeId: row.avatar_shape_id, avatarMarkId: row.avatar_mark_id }, room: { id: row.pod_id, code: row.code, title: row.title, description: row.description } })));
});

app.post('/api/invites', async (c) => {
  const senderId = c.get('user').id;
  const { roomId, friendId } = await c.req.json<{ roomId: string; friendId: string }>();
  const member = await pool.query('SELECT 1 FROM pod_members WHERE pod_id=$1 AND user_id=$2 AND left_at IS NULL', [roomId, senderId]);
  if (!member.rowCount) return c.json({ error: 'Join this Pod before inviting someone.' }, 403);
  const pair = [senderId, friendId].sort();
  const friendship = await pool.query('SELECT 1 FROM friendships WHERE user_a=$1 AND user_b=$2', pair);
  if (!friendship.rowCount) return c.json({ error: 'You can invite friends only.' }, 403);
  await pool.query('INSERT INTO pod_invites (pod_id,sender_id,recipient_id) VALUES ($1,$2,$3)', [roomId, senderId, friendId]);
  return c.body(null, 204);
});

app.post('/api/invites/:id/:action', async (c) => {
  const userId = c.get('user').id;
  const action = c.req.param('action');
  if (action === 'decline') {
    await pool.query('UPDATE pod_invites SET status=\'declined\' WHERE id=$1 AND recipient_id=$2 AND status=\'pending\'', [c.req.param('id'), userId]);
    return c.body(null, 204);
  }
  if (action !== 'accept') return c.json({ error: 'Unknown action.' }, 404);
  const invite = await pool.query('SELECT pod_id FROM pod_invites WHERE id=$1 AND recipient_id=$2 AND status=\'pending\'', [c.req.param('id'), userId]);
  if (!invite.rowCount) return c.json({ error: 'Invite not found.' }, 404);
  const join = await app.request(`/api/pods/${invite.rows[0].pod_id}/join`, { method: 'POST', headers: { authorization: c.req.header('authorization') ?? '' } });
  if (!join.ok) return forward(join);
  await pool.query('UPDATE pod_invites SET status=\'accepted\' WHERE id=$1', [c.req.param('id')]);
  return forward(join);
});

app.post('/api/reports', async (c) => {
  const reporterId = c.get('user').id;
  const { reportedUserId, reason } = await c.req.json<{ reportedUserId: string; reason: string }>();
  if (!reason?.trim() || reason.length > 500 || reporterId === reportedUserId) return c.json({ error: 'Choose a valid report reason.' }, 400);
  await pool.query('INSERT INTO safety_reports (reporter_id,reported_id,reason) VALUES ($1,$2,$3)', [reporterId, reportedUserId, reason.trim()]);
  return c.body(null, 204);
});

export default app;
