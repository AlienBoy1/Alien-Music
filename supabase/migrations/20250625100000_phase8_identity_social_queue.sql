-- Fase 8: Usernames, follows, mensajería y realtime

-- ============================================================
-- Username único
-- ============================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
  ON users (LOWER(username))
  WHERE username IS NOT NULL;

-- ============================================================
-- Red de seguidores asimétrica
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows (follower_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_public" ON follows
  FOR SELECT USING (true);

CREATE POLICY "follows_insert_own" ON follows
  FOR INSERT WITH CHECK (follower_id::text = auth.uid()::text);

CREATE POLICY "follows_delete_own" ON follows
  FOR DELETE USING (follower_id::text = auth.uid()::text);

-- ============================================================
-- Mensajería
-- ============================================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_participants (
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants (user_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  shared_song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (text IS NOT NULL OR shared_song_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages (chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participantes pueden leer su chat
CREATE POLICY "chat_participants_select" ON chat_participants
  FOR SELECT USING (true);

CREATE POLICY "messages_select_participants" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.chat_id = messages.chat_id
      AND cp.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "messages_insert_participants" ON messages
  FOR INSERT WITH CHECK (
    sender_id::text = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.chat_id = messages.chat_id
      AND cp.user_id::text = auth.uid()::text
    )
  );

-- Realtime: habilitar en Dashboard → Database → Replication → messages
