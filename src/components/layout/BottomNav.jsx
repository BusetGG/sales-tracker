import { Link } from 'react-router-dom'
import { Home, Store, Footprints, Calendar, FileText, Settings } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/stores', icon: Store, label: 'Toko' },
  { path: '/visits', icon: Footprints, label: 'Kunjungan' },
  { path: '/agenda', icon: Calendar, label: 'Agenda' },
  { path: '/reports', icon: FileText, label: 'Laporan' }
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 safe-bottom z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-colors
                ${isActive
                  ? 'text-primary dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                }
              `}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-primary/10' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
        <Link
          to="/settings"
          className={`
            flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-colors
            ${location.pathname === '/settings'
              ? 'text-primary dark:text-primary-400'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
            }
          `}
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs font-medium">Settings</span>
        </Link>
      </div>
    </nav>
  )
}