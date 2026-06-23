-- Alien Music - Esquema inicial (Fase 2)
-- Ejecutar en Supabase SQL Editor o via: supabase db push

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Auth.js / NextAuth tables (@auth/supabase-adapter)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ============================================================
-- App tables
-- ============================================================
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album_title TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  audio_url TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Nueva playlist',
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (playlist_id, song_id)
);

CREATE TABLE IF NOT EXISTS liked_songs (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  liked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_songs_user_id ON liked_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_songs ENABLE ROW LEVEL SECURITY;

-- Songs: lectura pública
CREATE POLICY "songs_select_public" ON songs FOR SELECT USING (true);

-- Playlists: propietario o públicas
CREATE POLICY "playlists_select_own_or_public" ON playlists
  FOR SELECT USING (is_public = true OR user_id::text = auth.uid()::text);

CREATE POLICY "playlists_insert_own" ON playlists
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "playlists_update_own" ON playlists
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "playlists_delete_own" ON playlists
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Playlist songs: solo propietario de la playlist
CREATE POLICY "playlist_songs_select" ON playlist_songs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_id
      AND (p.is_public = true OR p.user_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "playlist_songs_insert" ON playlist_songs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_id AND p.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "playlist_songs_delete" ON playlist_songs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_id AND p.user_id::text = auth.uid()::text
    )
  );

-- Liked songs: solo el propio usuario
CREATE POLICY "liked_songs_select_own" ON liked_songs
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "liked_songs_insert_own" ON liked_songs
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "liked_songs_delete_own" ON liked_songs
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Nota: Server Actions usan SUPABASE_SECRET_KEY (bypass RLS).
-- Las políticas protegen acceso directo vía cliente con JWT de Supabase Auth.
