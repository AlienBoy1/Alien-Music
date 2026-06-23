-- Tabla de historial de reproducción (Fase 3)
CREATE TABLE IF NOT EXISTS recently_played (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_played_user_played_at
  ON recently_played(user_id, played_at DESC);

ALTER TABLE recently_played ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recently_played_select_own" ON recently_played
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "recently_played_insert_own" ON recently_played
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "recently_played_update_own" ON recently_played
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Habilitar Realtime: Dashboard → Database → Replication → recently_played
