# Deployment Guide — AOT Digital Signage

Deploy the application to production for Smart TV access.

---

## Pre-Deployment Checklist

- [ ] Supabase project created and schema applied
- [ ] Admin user created in Supabase Auth
- [ ] Environment variables ready
- [ ] `npm run build` succeeds locally

---

## Option 1: Vercel (Recommended)

### Setup

1. Push code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Framework Preset: **Vite**
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**

`vercel.json` is included for SPA routing — all routes redirect to `index.html`.

### Custom Domain

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. Add your domain (e.g. `signage.company.com`)
3. Update DNS records as instructed

### TV Display URL

```
https://signage.company.com/display
```

---

## Option 2: Netlify

### Setup

1. Push code to Git repository
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import**
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add environment variables under **Site settings** → **Environment variables**
5. Deploy

`public/_redirects` handles SPA routing on Netlify.

---

## Option 3: Self-Hosted (Nginx)

### Build

```bash
npm run build
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name signage.company.com;
    root /var/www/aot-signage/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Environment Variables at Build Time

Vite embeds env vars at build time. Set them before building:

```bash
export VITE_SUPABASE_URL=https://your-project.supabase.co
export VITE_SUPABASE_ANON_KEY=your-anon-key
npm run build
```

---

## Supabase Production Configuration

### Auth Redirect URLs

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your production URL to **Site URL**
3. Add `https://your-domain.com/**` to **Redirect URLs**

### CORS (if needed)

Supabase handles CORS automatically for configured domains. If issues occur:

1. **Project Settings** → **API** → check allowed origins

---

## Smart TV Setup

### Android TV

1. Open **Chrome** or built-in browser
2. Navigate to `https://your-domain.com/display`
3. For kiosk mode, use a browser launcher app or set as homepage

### Samsung Smart TV

1. Open **Samsung Internet** browser
2. Navigate to display URL
3. Press **Full Screen** if browser UI is visible
4. Settings → Fullscreen Mode is enabled by default in app settings

### LG Smart TV (webOS)

1. Open **LG Content Store** → install a web browser if needed
2. Navigate to display URL
3. Fullscreen is requested automatically on load

### Tips for TV Displays

- Use a wired network connection for reliability
- Set TV to never sleep / disable screen saver
- Bookmark the `/display` URL
- Test transitions on actual hardware before going live
- Recommended slide interval: 10–15 seconds for announcements

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |

> Never expose the Supabase `service_role` key in frontend code.

---

## Monitoring

- **Supabase Dashboard** — Monitor database, storage usage, and auth
- **Vercel/Netlify Analytics** — Track page views and performance
- Check TV displays periodically for connectivity issues

---

## Updating

1. Push changes to your Git repository
2. Vercel/Netlify auto-deploys on push to main branch
3. TV displays auto-refresh via Supabase Realtime when content changes
4. For self-hosted: rebuild and redeploy `dist/` folder
