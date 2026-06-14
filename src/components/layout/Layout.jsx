import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useSync } from '../../contexts/SyncContext'
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react'

export default function Layout() {
  const { online, syncing, pendingCount, getSyncStatus } = useSync()
  const syncStatus = getSyncStatus()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
      {/* Status Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            {online ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs font-medium ${syncStatus.color}`}>
              {syncStatus.label}
            </span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1">
              <CloudOff className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-500">{pendingCount} pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-4">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}