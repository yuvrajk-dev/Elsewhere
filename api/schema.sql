CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  avatar_id integer NOT NULL DEFAULT 4,
  avatar_color text NOT NULL DEFAULT '#6258D9',
  avatar_shape_id integer NOT NULL DEFAULT 4,
  avatar_mark_id integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (participant_a < participant_b),
  UNIQUE (participant_a, participant_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  image_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(body) > 0 OR image_key IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS friendships (
  user_a text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, recipient_id)
);

CREATE TABLE IF NOT EXISTS pods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code char(4) NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  capacity integer NOT NULL DEFAULT 5 CHECK (capacity BETWEEN 2 AND 5),
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  default_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Upgrade existing installations to ownerless Pods with persistent defaults.
ALTER TABLE pods ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;
ALTER TABLE pods ADD COLUMN IF NOT EXISTS default_key text;
ALTER TABLE pods DROP COLUMN IF EXISTS host_id;
CREATE UNIQUE INDEX IF NOT EXISTS pods_default_key_unique_idx
  ON pods (default_key) WHERE default_key IS NOT NULL;

DO $$
DECLARE
  pod_theme record;
  pod_code text;
  pod_id uuid;
BEGIN
  FOR pod_theme IN
    SELECT * FROM (VALUES
      ('easy-hellos', 'Easy Hellos', 'A relaxed place to meet someone new and see where the conversation goes.'),
      ('little-things', 'Little Things', 'Share one good thing, small discovery, or moment from your day.'),
      ('music-moments', 'Music & Moments', 'Talk favorite songs, stories, and sounds you keep coming back to.')
    ) AS defaults(default_key, title, description)
  LOOP
    UPDATE pods SET title=pod_theme.title, description=pod_theme.description, is_default=true, is_active=true
      WHERE default_key=pod_theme.default_key;
    IF NOT FOUND THEN
      LOOP
        pod_code := (1000 + floor(random() * 9000))::int::text;
        pod_id := NULL;
        INSERT INTO pods (code, title, description, is_default, default_key)
          VALUES (pod_code, pod_theme.title, pod_theme.description, true, pod_theme.default_key)
          ON CONFLICT (code) DO NOTHING
          RETURNING id INTO pod_id;
        EXIT WHEN pod_id IS NOT NULL;
      END LOOP;
    END IF;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS pod_members (
  pod_id uuid NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (pod_id, user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS pod_members_one_active_pod_per_user_idx
  ON pod_members (user_id)
  WHERE left_at IS NULL;

CREATE TABLE IF NOT EXISTS pod_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id uuid NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS safety_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
