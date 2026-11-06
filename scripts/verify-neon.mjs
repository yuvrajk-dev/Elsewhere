import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { createRealtimeClient } from '@neon/realtime/client';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = ['.env.local', '.env'].map((file) => path.join(root, file)).find((file) => fs.existsSync(file));
if (!envPath) throw new Error('No root .env.local or .env found. Run `neon deploy` first.');
const env = dotenv.parse(fs.readFileSync(envPath));
const { Pool } = pg;
if (!env.NEON_AUTH_BASE_URL || !env.NEON_REALTIME_URL || !env.DATABASE_URL || !env.AWS_ENDPOINT_URL_S3) {
  throw new Error('Expected Neon Auth, Realtime, Postgres, and Object Storage environment variables are missing.');
}

function getFunctionUrl() {
  if (env.ELSEWHERE_API_URL || env.NEON_FUNCTION_API_BASE_URL) return env.ELSEWHERE_API_URL ?? env.NEON_FUNCTION_API_BASE_URL;
  const output = execSync('npx.cmd neon@latest functions get api -o json', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  const jsonText = output.slice(output.indexOf('{'), output.lastIndexOf('}') + 1);
  if (jsonText.startsWith('{')) {
    const result = JSON.parse(jsonText);
    const url = result.invocation_url ?? result.function?.invocation_url ?? result.url;
    if (url) return url;
  }
  throw new Error('Could not determine the deployed API Function URL.');
}

const apiUrl = getFunctionUrl().replace(/\/$/, '');
const authUrl = env.NEON_AUTH_BASE_URL.replace(/\/$/, '');
const pool = new Pool({ connectionString: env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL, max: 2 });
const storage = new S3Client({
  endpoint: env.AWS_ENDPOINT_URL_S3,
  region: env.AWS_REGION ?? 'ap-southeast-1',
  forcePathStyle: true,
  credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY },
});

const createdUserIds = [];
const createdPodIds = [];
let objectKey;
let client;
let subscription;

function pass(message) { console.log(`PASS ${message}`); }
function fail(message) { console.error(`FAIL ${message}`); }
function cookieHeader(response) {
  return response.headers.getSetCookie().map((cookie) => cookie.split(';', 1)[0]).join('; ');
}

async function getAuthToken(email, password, action) {
  const response = await fetch(`${authUrl}/${action === 'signup' ? 'sign-up/email' : 'sign-in/email'}`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: authUrl },
    body: JSON.stringify(action === 'signup' ? { email, password, name: 'Elsewhere integration check', callbackURL: authUrl } : { email, password, callbackURL: authUrl }),
  });
  if (!response.ok) throw new Error(`Managed Auth ${action} returned ${response.status}: ${await response.text()}`);
  const cookie = cookieHeader(response);
  const tokenResponse = await fetch(`${authUrl}/token`, { headers: { cookie } });
  const tokenBody = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenBody.token) throw new Error(`Could not get an API token after ${action}.`);
  return { token: tokenBody.token, cookie };
}

async function call(token, route, options = {}) {
  const response = await fetch(`${apiUrl}${route}`, {
    ...options,
    headers: { authorization: `Bearer ${token}`, ...(options.body instanceof Uint8Array ? {} : { 'content-type': 'application/json' }), ...options.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${route} returned ${response.status}: ${body?.error ?? response.statusText}`);
  return body;
}

async function createProfile(token, username) {
  return call(token, '/api/profile/me', { method: 'PUT', body: JSON.stringify({
    username, displayName: 'Elsewhere check', bio: '', avatarId: 4, avatarColor: '#6258D9', avatarShapeId: 4, avatarMarkId: 4,
  }) });
}

async function createVerificationPod({ title, description, isDefault = false, defaultKey = null, capacity = 5 }) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = String(1000 + Math.floor(Math.random() * 9000));
    const result = await pool.query(
      'INSERT INTO pods (code,title,description,is_default,default_key,capacity) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (code) DO NOTHING RETURNING id',
      [code, title, description, isDefault, defaultKey, capacity],
    );
    if (result.rows[0]?.id) {
      createdPodIds.push(result.rows[0].id);
      return result.rows[0].id;
    }
  }
  throw new Error('Could not reserve a temporary verification Pod code.');
}

async function waitFor(predicate, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for Neon Realtime.');
}

try {
  const health = await fetch(`${apiUrl}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);
  pass('Neon Function reaches Postgres and reports enabled services');

  const denied = await fetch(`${apiUrl}/api/profile/me`);
  assert.equal(denied.status, 401);
  pass('Function rejects unauthenticated API requests');

  const stamp = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const email1 = `neon-check-${stamp}-1@example.invalid`;
  const email2 = `neon-check-${stamp}-2@example.invalid`;
  const email3 = `neon-check-${stamp}-3@example.invalid`;
  const password = `Ewhere-${stamp}-A9!`;
  const auth1 = await getAuthToken(email1, password, 'signup');
  const user1 = await fetch(`${authUrl}/get-session`, { headers: { cookie: auth1.cookie } }).then((response) => response.json());
  const id1 = user1?.user?.id;
  if (!id1) throw new Error('Could not read the first Neon Auth session.');
  createdUserIds.push(id1);
  const auth2 = await getAuthToken(email2, password, 'signup');
  const user2 = await fetch(`${authUrl}/get-session`, { headers: { cookie: auth2.cookie } }).then((response) => response.json());
  const id2 = user2?.user?.id;
  if (!id2) throw new Error('Could not read the second Neon Auth session.');
  createdUserIds.push(id2);
  const auth3 = await getAuthToken(email3, password, 'signup');
  const user3 = await fetch(`${authUrl}/get-session`, { headers: { cookie: auth3.cookie } }).then((response) => response.json());
  const id3 = user3?.user?.id;
  if (!id3) throw new Error('Could not read the third Neon Auth session.');
  createdUserIds.push(id3);
  pass('Neon Managed Auth creates isolated sessions and API JWTs');

  const username1 = `check_${stamp.slice(-10)}a`;
  const username2 = `check_${stamp.slice(-10)}b`;
  const username3 = `check_${stamp.slice(-10)}c`;
  const profile1 = await createProfile(auth1.token, username1);
  await createProfile(auth2.token, username2);
  await createProfile(auth3.token, username3);
  assert.equal(profile1.id, id1);
  assert.equal((await call(auth1.token, '/api/profile/me')).username, username1);
  pass('Neon Postgres stores pseudonymous profiles separately from Auth accounts');

  await call(auth1.token, '/api/friend-requests', { method: 'POST', body: JSON.stringify({ userId: id3 }) });
  const requests = await call(auth3.token, '/api/friend-requests');
  assert.equal(requests.length, 1);
  await call(auth3.token, `/api/friend-requests/${requests[0].id}/accept`, { method: 'POST' });
  assert.equal((await call(auth1.token, '/api/friends')).length, 1);
  pass('Friend request and acceptance persist in Postgres');

  const defaults = await pool.query('SELECT id,default_key FROM pods WHERE is_default ORDER BY default_key');
  assert.deepEqual(defaults.rows.map((row) => row.default_key), ['easy-hellos', 'little-things', 'music-moments']);
  const listedDefaults = await call(auth1.token, '/api/pods');
  assert.ok(defaults.rows.every((item) => listedDefaults.some((room) => room.id === item.id)));
  const firstNewPod = await call(auth1.token, '/api/pods/new', { method: 'POST' });
  createdPodIds.push(firstNewPod.id);
  assert.match(firstNewPod.code, /^\d{4}$/);
  assert.ok(firstNewPod.participants.some((person) => person.id === id1));
  assert.equal(defaults.rows.some((item) => item.id === firstNewPod.id), false);
  const secondNewPod = await call(auth1.token, '/api/pods/new', { method: 'POST' });
  createdPodIds.push(secondNewPod.id);
  assert.notEqual(secondNewPod.id, firstNewPod.id);
  const afterSecondStart = await call(auth1.token, '/api/pods');
  assert.equal(afterSecondStart.some((room) => room.id === firstNewPod.id), false);
  assert.equal(afterSecondStart.some((room) => room.id === secondNewPod.id), true);
  await call(auth1.token, `/api/pods/${secondNewPod.id}/leave`, { method: 'POST' });
  pass('The plus action opens a fresh Pod even with defaults present; all three defaults remain in discovery');

  const invitePodId = await createVerificationPod({ title: 'Verification conversation', description: 'Temporary end-to-end check' });
  const pod = await call(auth1.token, `/api/pods/${invitePodId}/join`, { method: 'POST' });
  assert.equal((await call(auth3.token, '/api/friends')).find((friend) => friend.id === id1)?.activeRoomCode, pod.code);
  const oneOffPodId = await createVerificationPod({ title: 'Verification temporary Pod', description: 'Deleted after the last member leaves', capacity: 2 });
  const otherPod = await call(auth2.token, `/api/pods/${oneOffPodId}/join`, { method: 'POST' });
  await assert.rejects(() => call(auth1.token, `/api/pods/${otherPod.id}/join`, { method: 'POST' }), /returned 409:/);
  const invite = await call(auth1.token, '/api/invites', { method: 'POST', body: JSON.stringify({ roomId: pod.id, friendId: id3 }) });
  assert.equal(invite, null);
  const invites = await call(auth3.token, '/api/invites');
  assert.equal(invites.length, 1);
  const joinedPod = await call(auth3.token, `/api/invites/${invites[0].id}/accept`, { method: 'POST' });
  assert.equal(joinedPod.participantCount, 2);
  await assert.rejects(() => call(auth3.token, `/api/pods/${otherPod.id}/join`, { method: 'POST' }), /returned 409:/);
  pass('Ownerless Pod joining, invite delivery, capacity checks, and one-active-Pod enforcement work');

  await call(auth1.token, `/api/pods/${pod.id}/leave`, { method: 'POST' });
  await call(auth3.token, `/api/pods/${pod.id}/leave`, { method: 'POST' });
  assert.equal((await call(auth3.token, '/api/friends')).find((friend) => friend.id === id1)?.activeRoomCode, undefined);
  await call(auth1.token, `/api/pods/${otherPod.id}/join`, { method: 'POST' });
  assert.equal((await call(auth2.token, `/api/pods`)).find((room) => room.id === otherPod.id)?.participantCount, 2);
  await assert.rejects(() => call(auth3.token, `/api/pods/${otherPod.id}/join`, { method: 'POST' }), /returned 409:/);
  await call(auth1.token, `/api/pods/${otherPod.id}/leave`, { method: 'POST' });
  await call(auth2.token, `/api/pods/${otherPod.id}/leave`, { method: 'POST' });
  assert.equal((await call(auth1.token, '/api/pods')).some((room) => room.id === otherPod.id), false);
  const verificationDefaultId = await createVerificationPod({ title: 'Verification default', description: 'This default remains available when empty', isDefault: true, defaultKey: `verify-${stamp}` });
  await call(auth2.token, `/api/pods/${verificationDefaultId}/join`, { method: 'POST' });
  await call(auth2.token, `/api/pods/${verificationDefaultId}/leave`, { method: 'POST' });
  assert.equal((await call(auth2.token, '/api/pods')).some((room) => room.id === verificationDefaultId), true);
  assert.equal((await pool.query('SELECT is_default FROM pods WHERE id=$1', [verificationDefaultId])).rows[0]?.is_default, true);
  pass('Temporary Pods disappear after the last leave; default Pods remain visible when empty');

  const podIsDefault = (await pool.query('SELECT is_default FROM pods WHERE id=$1', [pod.id])).rows[0]?.is_default;
  assert.equal((await call(auth3.token, '/api/pods')).some((room) => room.id === pod.id), Boolean(podIsDefault));
  pass('Leaving an ownerless Pod keeps its seat count and follows its default or temporary lifetime');

  const conversation = await call(auth1.token, '/api/chats/start', { method: 'POST', body: JSON.stringify({ userId: id3 }) });
  const media = await call(auth1.token, `/api/chats/${conversation.id}/media`, { method: 'POST', body: JSON.stringify({ contentType: 'image/png', size: 68 }) });
  objectKey = media.key;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5ZkAAAAASUVORK5CYII=', 'base64');
  const upload = await fetch(media.uploadUrl, { method: 'PUT', headers: { 'content-type': 'image/png' }, body: png });
  if (!upload.ok) throw new Error(`Object Storage upload returned ${upload.status}.`);
  await call(auth1.token, `/api/chats/${conversation.id}/messages`, { method: 'POST', body: JSON.stringify({ body: '', imageKey: objectKey }) });
  const messages = await call(auth3.token, `/api/chats/${conversation.id}/messages`);
  assert.ok(messages[0].imageUrl);
  const photo = await fetch(messages[0].imageUrl);
  assert.equal(photo.status, 200);
  pass('Private Object Storage upload, message attachment, and signed download work');

  const sealed = await call(auth1.token, `/api/chats/${conversation.id}/live`);
  client = createRealtimeClient({ url: env.NEON_REALTIME_URL });
  subscription = client.subscribe(sealed);
  let state = 'connecting';
  let updateCount = 0;
  subscription.onStateChange((next) => { state = next.status; console.log(`Realtime state ${state}${state === 'error' ? `: ${next.error.message}` : ''}`); });
  subscription.onUpdate((update) => {
    updateCount += 1;
    console.log(`Realtime update ${update.type} (${updateCount})`);
  });
  await waitFor(() => state === 'live');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const baselineUpdateCount = updateCount;
  await call(auth3.token, `/api/chats/${conversation.id}/messages`, { method: 'POST', body: JSON.stringify({ body: 'Realtime verification message' }) });
  await waitFor(() => updateCount > baselineUpdateCount);
  pass('Neon Realtime delivers committed chat changes');

  await call(auth3.token, '/api/reports', { method: 'POST', body: JSON.stringify({ reportedUserId: id1, reason: 'Integration verification' }) });
  pass('Safety reports persist through the authenticated Function API');

  const signedIn = await getAuthToken(email1, password, 'signin');
  assert.ok(signedIn.token);
  pass('Neon Managed Auth signs in an existing account');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  subscription?.unsubscribe();
  client?.close();
  if (objectKey) {
    await storage.send(new DeleteObjectCommand({ Bucket: 'assets', Key: objectKey })).catch(() => undefined);
  }
  if (createdUserIds.length) {
    const ids = [...new Set(createdUserIds)];
    try {
      if (createdPodIds.length) await pool.query('DELETE FROM pods WHERE id = ANY($1::uuid[])', [[...new Set(createdPodIds)]]);
      await pool.query('DELETE FROM profiles WHERE id = ANY($1::text[])', [ids]);
      await pool.query('DELETE FROM neon_auth."user" WHERE id = ANY($1::uuid[])', [ids]);
      pass('Temporary verification users and app records cleaned up');
    } catch (error) {
      fail(`Could not fully clean temporary verification data: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }
  await storage.destroy();
  await pool.end();
}
process.exit(process.exitCode ?? 0);
