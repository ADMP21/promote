import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

const img = await sb.from('images').select('id', { count: 'exact', head: true })
console.log('images:', img.error?.message || `OK (${img.count ?? 0} rows)`)

const settings = await sb.from('display_settings').select('id').limit(1)
console.log('settings:', settings.error?.message || `OK (${settings.data?.length ?? 0} row)`)

const storage = await sb.storage.from('signage-images').list('', { limit: 1 })
console.log('storage:', storage.error?.message || 'OK')

const auth = await sb.auth.signInWithPassword({
  email: process.env.ADMIN_EMAIL || 'admin@cmfrozen.com',
  password: process.env.ADMIN_PASSWORD || 'admin@123456',
})
console.log('login:', auth.error?.message || `OK (${auth.data.user?.email})`)
if (auth.data.session) await sb.auth.signOut()
