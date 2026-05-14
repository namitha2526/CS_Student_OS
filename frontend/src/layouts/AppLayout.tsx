import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  BookMarked,
  Briefcase,
  CalendarDays,
  CheckSquare,
  Cpu,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Target,
  Timer,
  User2,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/cn'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/dsa', label: 'DSA Tracker', icon: Cpu },
  { to: '/applications', label: 'Applications', icon: Briefcase },
  { to: '/projects', label: 'Projects', icon: Sparkles },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/habits', label: 'Habits', icon: Target },
  { to: '/learn', label: 'Learning Hub', icon: BookMarked },
  { to: '/review', label: 'Weekly Review', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/labs', label: 'Labs / AI', icon: FlaskConical },
  { to: '/settings', label: 'Settings', icon: User2 },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="mx-auto flex min-h-full max-w-[1600px] gap-4 p-4 lg:p-6">
      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-2xl border border-white/10 bg-zinc-950/40 p-4 backdrop-blur-xl lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 text-sm font-black text-white shadow-lg shadow-indigo-500/30">
            CS
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">Student OS</div>
            <div className="truncate text-xs text-zinc-400">Placement-grade workspace</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-auto pr-1">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-white/10 text-white ring-1 ring-white/15'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <Icon className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Activity className="h-4 w-4 text-emerald-400" />
            Signed in
          </div>
          <div className="mt-1 truncate text-sm font-medium text-zinc-100">{user?.username}</div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-black text-white">
              CS
            </div>
            <div className="text-sm font-semibold text-white">Student OS</div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10"
          >
            Log out
          </button>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {nav.map((item) => {
            const Icon = item.icon
            const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs ring-1',
                  active ? 'bg-white/10 text-white ring-white/15' : 'bg-white/5 text-zinc-300 ring-white/10',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
