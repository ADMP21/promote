export const ADMIN_EMAIL = 'admin@cmfrozen.com'
export const ADMIN_PASSWORD = 'admin@123456'

export const DEV_SESSION_KEY = 'aot-dev-session'

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
)

export const devAdminUser = {
  id: 'dev-admin',
  email: ADMIN_EMAIL,
}
