import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Monitor, Mail, Lock, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ADMIN_EMAIL } from '../config/auth'
import { th } from '../i18n/th'

export default function Login() {
  const { user, loading, signIn, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="gradient-bg flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || th.login.errorInvalid)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="login-card relative w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="mb-8 text-center">
          <div className="login-logo mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl">
            <Monitor className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-gradient text-2xl font-bold sm:text-3xl">{th.appName}</h1>
          <p className="mt-2 text-sm text-slate-500">{th.login.subtitle}</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-5 flex items-start gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-800">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            {th.login.devMode}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
              {th.login.email}
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder={ADMIN_EMAIL}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
              {th.login.password}
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-base">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {th.login.submitting}
              </>
            ) : (
              th.login.submit
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">{th.login.footer}</p>
      </div>
    </div>
  )
}
