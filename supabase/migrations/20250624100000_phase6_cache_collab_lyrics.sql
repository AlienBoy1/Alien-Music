-- Fase 6: Caché YouTube, playlists colaborativas, letras

-- ============================================================
-- Caché de búsquedas YouTube (protección de cuota API)
-- ============================================================
CREATE TABLE IF NOT EXISTS youtube_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_text TEXT NOT NULL,
  filter_type TEXT NOT NULL,
  page_token TEXT NOT NULL DEFAULT '',
  max_results INTEGER NOT NULL DEFAULT 25,
  response_json JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (query_text, filter_type, page_token, max_results)
);

CREATE INDEX IF NOT EXISTS idx_youtube_cache_lookup
  ON youtube_cache (query_text, filter_type, page_token, max_results);

CREATE INDEX IF NOT EXISTS idx_youtube_cache_expires
  ON youtube_cache (expires_at);

ALTER TABLE youtube_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Playlists colaborativas
-- ============================================================
ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS playlist_contributors (
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (playlist_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_contributors_user
  ON playlist_contributors (user_id);

ALTER TABLE playlist_contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlist_contributors_select_public" ON playlist_contributors
  FOR SELECT USING (true);

-- ============================================================
-- Letras (campo opcional en canciones indexadas)
-- ============================================================
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS lyrics TEXT;
