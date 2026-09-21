import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Image, Settings, LogOut, Monitor, Tv } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { th } from '../i18n/th'

const navItems = [
  { to: '/dashboard', label: th.nav.dashboard, icon: LayoutDashboard },
  { to: '/images', label: th.nav.images, icon: Image },
  { to: '/settings', label: th.nav.settings, icon: Settings },
]

export default function Navbar() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="glass sticky top-0 z-50 border-b border-white/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="login-logo flex h-11 w-11 items-center justify-center rounded-2xl">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-primary sm:text-lg">{th.appName}</h1>
            <p className="text-xs text-slate-500">{th.appSubtitle}</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-2xl bg-white/40 p-1 md:flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-pill ${isActive ? 'nav-pill--active' : 'nav-pill--inactive'}`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary hidden text-xs sm:inline-flex sm:text-sm"
          >
            <Tv className="h-4 w-4" />
            {th.nav.tvDisplay}
          </a>
          <button onClick={handleSignOut} className="btn-secondary text-xs sm:text-sm">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{th.nav.signOut}</span>
          </button>
        </div>
      </div>

      {user && (
        <div className="hidden border-t border-white/40 px-4 py-1.5 text-center text-xs text-slate-400 sm:block">
          {user.email}
        </div>
      )}

      <nav className="flex items-center justify-around gap-1 border-t border-white/40 px-2 py-2 md:hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
