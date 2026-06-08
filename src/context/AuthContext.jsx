import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DEV_SESSION_KEY,
  devAdminUser,
  isSupabaseConfigured,
} from '../config/auth'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem(DEV_SESSION_KEY)
      if (saved) {
        try {
          setUser(JSON.parse(saved))
        } catch {
          localStorage.removeItem(DEV_SESSION_KEY)
        }
      }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(devAdminUser))
        setUser(devAdminUser)
        return { user: devAdminUser }
      }
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(DEV_SESSION_KEY)
      setUser(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, isSupabaseConfigured }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
