# Alien Music — Fase 2: Producción

## Configuración paso a paso

### 1. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable (anon) |
| `SUPABASE_SECRET_KEY` | Service role key (solo servidor) |
| `SUPABASE_JWKS_URL` | URL JWKS de Supabase Auth |
| `NEXT_PUBLIC_SUPABASE_URL` | Misma URL (cliente browser) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Misma clave publicable |
| `AUTH_SECRET` | Genera con `openssl rand -base64 32` |
| `AUTH_URL` | `http://localhost:3000` en dev |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth Google (opcional) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | OAuth GitHub (opcional) |

### 2. Base de datos Supabase

En el **SQL Editor** de Supabase, ejecuta en orden:

1. `supabase/migrations/20250623000000_initial_schema.sql`
2. `supabase/migrations/20250623000001_seed_songs.sql`

### 3. OAuth (opcional)

**Google:** [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth 2.0 → redirect URI: `http://localhost:3000/api/auth/callback/google`

**GitHub:** Settings → Developer settings → OAuth Apps → callback: `http://localhost:3000/api/auth/callback/github`

### 4. Ejecutar

```bash
npm install
npm run dev
```

## Arquitectura Fase 2

- **Auth.js (NextAuth v5):** Google, GitHub, email/password
- **Supabase:** songs, playlists, playlist_songs, liked_songs
- **Server Actions:** likes, playlists, búsqueda
- **Rutas protegidas:** `/your-library`, `/playlists/*`
- **Media Session API:** controles nativos del SO
- **Optimistic updates:** botón de corazón (like)

## Rutas

| Ruta | Acceso |
|------|--------|
| `/` | Público |
| `/search` | Público |
| `/your-library` | Autenticado |
| `/playlists` | Autenticado |
| `/playlists/[id]` | Autenticado |
| `/login`, `/register` | Público |
