/**
 * Create admin user in Supabase Auth.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (never expose in frontend).
 *
 * Usage: npm run create-admin
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL || 'admin@cmfrozen.com'
const password = process.env.ADMIN_PASSWORD || 'admin@123456'

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  console.error('Get service role key from: Supabase Dashboard → Settings → API')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

if (error) {
  if (error.message?.includes('already been registered')) {
    console.log(`Admin user already exists: ${email}`)
    process.exit(0)
  }
  console.error('Failed to create admin:', error.message)
  process.exit(1)
}

console.log(`Admin user created: ${email}`)
console.log(`User ID: ${data.user.id}`)
