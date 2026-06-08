# AOT Digital Signage

A production-ready digital signage web application for organizations to upload announcement images and display them automatically on Smart TVs.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase)

## Features

- **Authentication** — Secure admin login via Supabase Auth
- **Dashboard** — Overview with total images, active images, and last upload date
- **Image Management** — Upload, preview, delete, enable/disable, reorder, and search images
- **Display Settings** — Configure slide interval, transitions, overlays, and ticker
- **TV Display Mode** — Full-screen slideshow at `/display` with real-time updates
- **Smart TV Compatible** — Works on Android TV, Samsung, and LG Smart TV browsers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Styling | TailwindCSS 4 (glassmorphism design) |
| Backend | Supabase (Auth, Database, Storage, Realtime) |
| Routing | React Router 7 |
| Drag & Drop | @dnd-kit |

## Quick Start

```bash
# Clone and install
cd aot-digital-signage
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

See [INSTALLATION.md](./INSTALLATION.md) for complete setup including Supabase configuration.

## Project Structure

```
aot-digital-signage/
├── public/
│   ├── favicon.svg
│   └── _redirects          # Netlify SPA routing
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── GlassCard.jsx
│   │   ├── ImageCard.jsx
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── StatCard.jsx
│   │   └── UploadZone.jsx
│   ├── context/
│   │   └── AuthContext.jsx # Supabase auth state
│   ├── lib/
│   │   └── supabase.js     # Supabase client
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Display.jsx     # TV display mode
│   │   ├── Images.jsx
│   │   ├── Login.jsx
│   │   └── Settings.jsx
│   ├── App.jsx             # Route definitions
│   ├── main.jsx
│   └── index.css           # Tailwind + custom styles
├── supabase/
│   ├── schema.sql          # Database tables & RLS
│   └── storage.sql         # Storage bucket & policies
├── .env.example
├── INSTALLATION.md
├── DEPLOYMENT.md
└── vercel.json             # Vercel SPA routing
```

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Admin login page |
| `/dashboard` | Auth required | Overview dashboard |
| `/images` | Auth required | Image management |
| `/settings` | Auth required | Display configuration |
| `/display` | Public | TV slideshow (no login) |

## Design

- **Primary Color:** `#005BAC`
- **Secondary Color:** `#00AEEF`
- **Background:** `#F5F8FA`
- **Style:** Glassmorphism with corporate professional aesthetic

## Scripts

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Documentation

- [Installation Guide](./INSTALLATION.md) — Full setup with Supabase
- [Deployment Guide](./DEPLOYMENT.md) — Deploy to Vercel, Netlify, or self-host

## License

Private — AOT Organization
