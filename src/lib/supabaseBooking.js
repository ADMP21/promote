import { createClient } from '@supabase/supabase-js'

// Supabase ของระบบจองห้องประชุม (แยกจาก Supabase Display)
const BOOKING_URL = 'https://ldkyeieocixtbykpwkxr.supabase.co'
const BOOKING_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka3llaWVvY2l4dGJ5a3B3a3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MzAzNDksImV4cCI6MjA5NzQwNjM0OX0.SiT9tehfBaOf_giwBK1SZDLmcG9nyx6d2zEewN5C1Ws'

export const supabaseBooking = createClient(BOOKING_URL, BOOKING_KEY)