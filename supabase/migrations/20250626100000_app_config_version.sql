-- Fase 10: Configuración global de versión mínima obligatoria

CREATE TABLE IF NOT EXISTS app_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  min_required_version TEXT NOT NULL DEFAULT '1.0.0',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_config (id, min_required_version)
VALUES ('default', '1.1.0')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_select_public" ON app_config
  FOR SELECT USING (true);

-- Solo service_role puede modificar (sin política INSERT/UPDATE para anon/authenticated) jsjsjs
