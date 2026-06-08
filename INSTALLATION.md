# Installation Guide — AOT Digital Signage

Complete step-by-step setup for local development and production.

## Prerequisites

- **Node.js** 20.19+ (or 22.12+)
- **npm** 10+
- **Supabase account** — [supabase.com](https://supabase.com) (free tier works)

---

## Step 1: Clone & Install

```bash
cd aot-digital-signage
npm install
```

---

## Step 2: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose organization, name (e.g. `aot-signage`), database password, and region
4. Wait for the project to finish provisioning

---

## Step 3: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run**
5. Create a new query and paste `supabase/storage.sql`
6. Click **Run**

This creates:
- `images` table with RLS policies
- `display_settings` table with default values
- `signage-images` storage bucket
- Realtime subscriptions for live TV updates

---

## Step 4: Create Admin User

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create New User**
3. Enter admin email and password
4. Check **Auto Confirm User**
5. Click **Create User**

Default admin account:

| Field | Value |
|-------|-------|
| Email | `admin@cmfrozen.com` |
| Password | `admin@123456` |

Or run `npm run create-admin` after adding `SUPABASE_SERVICE_ROLE_KEY` to `.env`.

Use these credentials to log in to the management console.

---

## Step 5: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project credentials:

1. Go to **Project Settings** → **API**
2. Copy **Project URL** → `VITE_SUPABASE_URL`
3. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 6: Enable Realtime (if not auto-enabled)

1. Go to **Database** → **Replication**
2. Ensure `images` and `display_settings` tables are enabled for realtime
3. If not listed, the `schema.sql` publication commands should have added them

---

## Step 7: Start Development Server

```bash
npm run dev
```

Open:
- **Management Console:** http://localhost:5173/login
- **TV Display:** http://localhost:5173/display

### Local dev without Supabase

If `.env` is not configured yet, you can still log in with the default admin account above (local dev mode only). Image upload and settings require Supabase to be connected.

---

## Step 8: Verify Setup

1. Log in with your admin credentials
2. Go to **Images** and upload a test image (JPG, PNG, or WEBP)
3. Open `/display` in a new tab — image should appear in slideshow
4. Go to **Settings** and adjust slide interval / transitions
5. Toggle image active/inactive and confirm display updates

---

## Troubleshooting

### "Invalid API key" or connection errors
- Verify `.env` values match Supabase Dashboard → Settings → API
- Restart the dev server after changing `.env`

### Upload fails
- Confirm `storage.sql` was run successfully
- Check bucket `signage-images` exists in **Storage**
- Verify you are logged in as an authenticated user

### Display shows "NO CONTENT AVAILABLE"
- Ensure at least one image is uploaded and marked **Active**
- Check browser console for CORS or network errors

### Realtime not updating on TV
- Confirm Realtime is enabled for both tables
- Check Supabase project is not paused (free tier pauses after inactivity)

### RLS policy errors
- Re-run `schema.sql` to recreate policies
- Ensure admin user is authenticated when managing images

---

## Production Build

```bash
npm run build
```

Output is in the `dist/` folder. See [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting instructions.
