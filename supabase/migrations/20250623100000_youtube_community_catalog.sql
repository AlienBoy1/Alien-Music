-- YouTube + catálogo comunitario
-- Ejecutar en Supabase SQL Editor o via: supabase db push

-- Tipo de medio (audio / video)
DO $$ BEGIN
  CREATE TYPE song_type AS ENUM ('audio', 'video');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- songs: fuente YouTube
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS youtube_id TEXT,
  ADD COLUMN IF NOT EXISTS type song_type NOT NULL DEFAULT 'audio';

-- audio_url ya no es obligatorio: la reproducción usa youtube_id
ALTER TABLE songs ALTER COLUMN audio_url DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_songs_youtube_id ON songs (youtube_id)
  WHERE youtube_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_songs_type ON songs (type);

-- Catálogo indexado por la comunidad
CREATE TABLE IF NOT EXISTS community_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (song_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_catalog_song_id ON community_catalog(song_id);
CREATE INDEX IF NOT EXISTS idx_community_catalog_user_id ON community_catalog(user_id);

ALTER TABLE community_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_catalog_select_public" ON community_catalog
  FOR SELECT USING (true);

CREATE POLICY "community_catalog_insert_own" ON community_catalog
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
