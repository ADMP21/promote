# Supabase Configuration — AOT Digital Signage

## Overview

| Service | Purpose |
|---------|---------|
| **Auth** | Admin login for management console |
| **Database** | Image metadata and display settings |
| **Storage** | Image files (JPG, PNG, WEBP) |
| **Realtime** | Live updates on TV displays |

## Setup Order

1. Run `schema.sql` — creates tables, RLS, realtime
2. Run `storage.sql` — creates bucket and storage policies
3. Create admin user in Authentication dashboard
4. Copy API keys to `.env`

## Tables

### `images`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Display title (from filename) |
| filename | TEXT | Storage object name |
| image_url | TEXT | Public URL |
| active | BOOLEAN | Show on TV display |
| display_order | INTEGER | Slideshow sort order |
| created_at | TIMESTAMPTZ | Upload timestamp |

### `display_settings`

| Column | Type | Description |
|--------|------|-------------|
| slide_interval | INTEGER | 3–60 seconds |
| transition_effect | TEXT | fade, slide-left, slide-right, zoom |
| auto_refresh | BOOLEAN | Realtime updates |
| fullscreen_mode | BOOLEAN | Request fullscreen on TV |
| show_header_overlay | BOOLEAN | Date/time overlay |
| show_footer_ticker | BOOLEAN | Scrolling ticker |
| ticker_text | TEXT | Ticker message content |

## Storage Bucket

- **Name:** `signage-images`
- **Public:** Yes (TV needs to load images without auth)
- **Max size:** 10 MB per file
- **Allowed types:** image/jpeg, image/png, image/webp

## Security Model

- **Public read** on images and settings (TV display at `/display` has no login)
- **Authenticated write** for all management operations
- **Never** use `service_role` key in the frontend

## Auth Configuration

In Supabase Dashboard → Authentication → Settings:

- **Site URL:** Your production URL (e.g. `https://signage.company.com`)
- **Redirect URLs:** Add `http://localhost:5173/**` for development
- **Email provider:** Enabled (default)
- Disable sign-ups if you only want manually created admin users:
  - Authentication → Providers → Email → Disable "Enable Sign Ups"

## Realtime

Both tables are added to `supabase_realtime` publication. TV displays subscribe to changes and reload content automatically when admins upload, reorder, or toggle images.
