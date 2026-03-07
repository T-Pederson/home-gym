import { NavLink } from 'react-router'
import { Home, Dumbbell, Library, TrendingUp, UserCircle } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/planner', icon: Dumbbell, label: 'Planner' },
  { to: '/exercises', icon: Library, label: 'Exercises' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
