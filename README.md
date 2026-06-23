# Alien Music (Beta → Fase 2)

Aplicación web progresiva (PWA) de streaming de música inspirada en Spotify.

**Fase 2:** Auth.js + Supabase con likes, playlists y Media Session API.

## Inicio rápido

```bash
cp .env.example .env.local   # Completa tus credenciales
# Ejecuta las migraciones SQL en Supabase (ver docs/FASE2-SETUP.md)
npm install
npm run dev
```

Guía completa: **[docs/FASE2-SETUP.md](docs/FASE2-SETUP.md)**

## Características

- **Auth.js:** Google, GitHub, email/password
- **Supabase:** canciones, playlists, likes persistentes
- **Server Actions** con optimistic updates en likes
- **Media Session API** para controles del SO
- **Rutas protegidas:** `/your-library`, `/playlists`
- **PWA** con service worker

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con Turbopack |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |

## Estructura del proyecto

```
src/
├── app/                  # App Router (páginas)
├── components/
│   ├── content/          # Tarjetas, grillas, filas de pista
│   ├── layout/           # Sidebar, TopBar, AppLayout
│   └── player/           # Reproductor y motor de audio
├── lib/
│   ├── data/             # Datos estáticos de la beta
│   ├── services/         # API simulada
│   ├── stores/           # Estado global (Zustand)
│   └── utils/            # Utilidades
└── types/                # Tipos TypeScript
```

## Notas de la beta

- El audio usa muestras libres de [SoundHelix](https://www.soundhelix.com/) como demostración.
- Las portadas provienen de Wikimedia Commons.
- Los favoritos se guardan localmente en el navegador.

## Tecnologías

- [Next.js](https://nextjs.org/) 15 + App Router
- [Turbopack](https://turbo.build/pack)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Zustand](https://zustand.docs.pmnd.rs/)
- [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa)
