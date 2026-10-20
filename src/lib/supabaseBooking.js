import { createClient } from '@supabase/supabase-js'

const BOOKING_URL = 'https://diaozjpyuvannwaherne.supabase.co'
const BOOKING_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYW96anB5dXZhbm53YWhlcm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MTAyNzgsImV4cCI6MjEwNzA4NjI3OH0.bbpCimeIZBPxIicH2R-LJRZiKB6UjpMKv3ooARMVFK4'

export const supabaseBooking = createClient(BOOKING_URL, BOOKING_KEY, {
  auth: {
    storageKey: 'booking-system-auth', // ← แยก storage key ไม่ให้ชนกับ Display
    persistSession: false,              // ← ไม่ต้องเก็บ session
    autoRefreshToken: false,            // ← ไม่ต้อง refresh token
  },
})