# Desplegar Alien Music en Vercel

Guía paso a paso para publicar la app en producción. La base de datos Supabase ya está integrada; la autenticación puede activarse más adelante.

## Requisitos previos

- Cuenta en [Vercel](https://vercel.com)
- Proyecto en [Supabase](https://supabase.com) con migraciones aplicadas
- Repositorio Git (GitHub, GitLab o Bitbucket)

## 1. Preparar el repositorio

```bash
git init
git add .
git commit -m "Alien Music - listo para deploy"
git remote add origin https://github.com/TU_USUARIO/alien-music.git
git push -u origin main
```

## 2. Importar en Vercel

1. Entra en [vercel.com/new](https://vercel.com/new)
2. Importa el repositorio de Alien Music
3. Vercel detectará Next.js automáticamente
4. **Framework Preset:** Next.js
5. **Build Command:** `npm run build` (por defecto)
6. **Output Directory:** `.next` (por defecto)
7. **Install Command:** `npm install`

No cambies el root directory salvo que el proyecto esté en un subfolder.

## 3. Variables de entorno en Vercel

En **Project → Settings → Environment Variables**, añade:

| Variable | Entorno | Descripción |
|----------|---------|-------------|
| `SUPABASE_URL` | Production, Preview, Development | URL del proyecto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | Clave publicable (anon) |
| `SUPABASE_SECRET_KEY` | Production, Preview, Development | Service role key (**secreto**) |
| `SUPABASE_JWKS_URL` | Production, Preview, Development | `https://TU_PROYECTO.supabase.co/auth/v1/.well-known/jwks.json` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Misma URL que `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | Misma clave publicable |
| `AUTH_SECRET` | Production, Preview, Development | `openssl rand -base64 32` |
| `AUTH_URL` | Production | `https://tu-dominio.vercel.app` |
| `AUTH_URL` | Preview | Dejar vacío o usar URL de preview |

### OAuth (cuando actives autenticación)

| Variable | Descripción |
|----------|-------------|
| `AUTH_GOOGLE_ID` | Client ID de Google |
| `AUTH_GOOGLE_SECRET` | Client Secret de Google |
| `AUTH_GITHUB_ID` | Client ID de GitHub |
| `AUTH_GITHUB_SECRET` | Client Secret de GitHub |

**Importante:** Actualiza los redirect URIs de OAuth:

- Google: `https://tu-dominio.vercel.app/api/auth/callback/google`
- GitHub: `https://tu-dominio.vercel.app/api/auth/callback/github`

## 4. Configurar Supabase para producción

### Migraciones pendientes

Ejecuta en el SQL Editor de Supabase (si no lo hiciste):

1. `supabase/migrations/20250623000000_initial_schema.sql`
2. `supabase/migrations/20250623000001_seed_songs.sql`
3. `supabase/migrations/20250623000002_recently_played.sql`

### Realtime (Escuchado recientemente)

1. Supabase Dashboard → **Database** → **Replication**
2. Activa la tabla `recently_played` para Realtime

### URLs permitidas (cuando uses Auth)

Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL:** `https://tu-dominio.vercel.app`
- **Redirect URLs:** `https://tu-dominio.vercel.app/**`

## 5. Deploy

1. Pulsa **Deploy** en Vercel
2. Espera a que el build termine (~2-3 min)
3. Visita la URL generada (`alien-music-xxx.vercel.app`)

### Verificar el deploy

- [ ] Home carga la grilla de álbumes
- [ ] El reproductor reproduce audio
- [ ] Atajos de teclado funcionan (Espacio, flechas, M)
- [ ] El volumen persiste al recargar
- [ ] (Con auth) Login y favoritos funcionan
- [ ] (Con auth) "Escuchado recientemente" se actualiza

## 6. Dominio personalizado (opcional)

1. Vercel → **Project → Settings → Domains**
2. Añade tu dominio (ej. `music.tudominio.com`)
3. Configura los registros DNS que indique Vercel
4. Actualiza `AUTH_URL` y los redirect URIs de OAuth

## 7. PWA en producción

El service worker se genera en `npm run build` vía `@ducanh2912/next-pwa`. En producción:

- El manifest está en `/manifest.json`
- El SW se registra en `/sw.js`
- Instala la app desde el navegador (Chrome → "Instalar aplicación")

## 8. Troubleshooting

| Problema | Solución |
|----------|----------|
| Build falla por env vars | Verifica que todas las variables estén en Vercel |
| "No hay canciones" | Ejecuta el seed SQL en Supabase |
| Imágenes no cargan | Revisa `next.config.ts` → `remotePatterns` |
| Auth redirect loop | `AUTH_URL` debe coincidir con el dominio de producción |
| Realtime no actualiza | Habilita `recently_played` en Replication |
| Audio no reproduce | SoundHelix requiere HTTPS (Vercel lo provee) |

## 9. CI/CD automático

Cada `git push` a `main` despliega automáticamente en producción. Los PRs generan **Preview Deployments** con URL única.

## 10. Próximos pasos (auth pendiente)

Cuando actives autenticación:

1. Configura OAuth en Google/GitHub con URLs de producción
2. Añade las variables `AUTH_*` en Vercel
3. Prueba login en la URL de producción
4. Verifica que `recently_played` y `liked_songs` registren datos por usuario

---

**Comando rápido con Vercel CLI:**

```bash
npm i -g vercel
vercel login
vercel --prod
```

Sigue las indicaciones y pega las variables de entorno cuando las solicite.
