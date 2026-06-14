import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getPendingSyncItems, markAsSynced, getSetting, setSetting, STORES_STORE, VISITS_STORE, AGENDAS_STORE } from '../services/db'
import { syncAllPending } from '../services/sync'
import { isDemoMode } from '../services/auth'
import { useToast } from './ToastContext'

const SyncContext = createContext(null)

export function SyncProvider({ children }) {
  const [online, setOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [autoSync, setAutoSync] = useState(true)
  const [syncEnabled, setSyncEnabled] = useState(true)
  const { success, error: showError, info } = useToast()

  // Load settings
  useEffect(() => {
    loadSyncSettings()
  }, [])

  async function loadSyncSettings() {
    try {
      const autoSyncSetting = await getSetting('autoSync')
      const syncEnabledSetting = await getSetting('syncEnabled')

      if (autoSyncSetting !== undefined) {
        setAutoSync(autoSyncSetting)
      }
      if (syncEnabledSetting !== undefined) {
        setSyncEnabled(syncEnabledSetting)
      }
    } catch (err) {
      console.error('Failed to load sync settings:', err)
    }
  }

  // Toggle auto sync
  const toggleAutoSync = useCallback(async (value) => {
    try {
      setAutoSync(value)
      await setSetting('autoSync', value)
      if (value) {
        info('Sinkronisasi otomatis aktif')
        triggerSync()
      } else {
        info('Sinkronisasi otomatis nonaktif')
      }
    } catch (err) {
      console.error('Failed to toggle auto sync:', err)
    }
  }, [])

  // Toggle sync enabled
  const toggleSyncEnabled = useCallback(async (value) => {
    try {
      setSyncEnabled(value)
      await setSetting('syncEnabled', value)
      if (value) {
        info('Sinkronisasi diaktifkan')
        triggerSync()
      } else {
        info('Sinkronisasi dinonaktifkan')
      }
    } catch (err) {
      console.error('Failed to toggle sync:', err)
    }
  }, [])

  // Check online status
  useEffect(() => {
    function handleOnline() {
      setOnline(true)
      // Auto sync when coming online (only if enabled)
      if (syncEnabled && autoSync) {
        triggerSync()
      }
    }

    function handleOffline() {
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncEnabled, autoSync])

  // Count pending items
  const updatePendingCount = useCallback(async () => {
    try {
      const pending = await getPendingSyncItems()
      const count = pending.stores.length + pending.visits.length + pending.agendas.length
      setPendingCount(count)
    } catch (err) {
      console.error('Failed to count pending items:', err)
    }
  }, [])

  useEffect(() => {
    updatePendingCount()
  }, [updatePendingCount])

  // Periodic sync check (every 5 minutes if auto sync is enabled)
  useEffect(() => {
    if (!syncEnabled || !autoSync || !online) return

    const interval = setInterval(() => {
      triggerSync()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [syncEnabled, autoSync, online])

  // Initial sync on mount (only if enabled)
  useEffect(() => {
    if (syncEnabled && autoSync && online) {
      // Small delay to let the app initialize
      const timer = setTimeout(() => {
        triggerSync()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [syncEnabled, autoSync])

  // Trigger sync
  const triggerSync = useCallback(async () => {
    // Don't sync if disabled, offline, or already syncing
    if (!syncEnabled) {
      console.log('Sync disabled, skipping...')
      return
    }

    if (!online) {
      console.log('Offline, skipping sync...')
      return
    }

    if (syncing) {
      console.log('Already syncing, skipping...')
      return
    }

    // Skip if in demo mode (no real Google account)
    if (isDemoMode()) {
      console.log('Demo mode, skipping sync...')
      return
    }

    try {
      setSyncing(true)
      const pending = await getPendingSyncItems()

      if (pending.stores.length === 0 && pending.visits.length === 0 && pending.agendas.length === 0) {
        setPendingCount(0)
        return
      }

      console.log('Starting sync with pending items:', pending)

      const results = await syncAllPending(pending.stores, pending.visits, pending.agendas)

      console.log('Sync results:', results)

      // Mark items as synced
      for (const item of results.items) {
        if (item.status === 'synced') {
          const storeName = item.type === 'store' ? STORES_STORE :
                           item.type === 'visit' ? VISITS_STORE : AGENDAS_STORE
          await markAsSynced(storeName, item.id)
        }
      }

      await updatePendingCount()
      setLastSyncTime(Date.now())

      if (results.failed > 0) {
        // Only show error if there are actual failures, not expected ones
        const errorItems = results.items.filter(i => i.status === 'failed')
        if (errorItems.length > 0) {
          showError(`Sinkronisasi selesai, ${errorItems.length} item gagal`)
        }
      } else {
        success('Data berhasil disinkronkan')
      }
    } catch (err) {
      console.error('Sync error:', err)
      // Don't show error toast for network/permission errors
      if (err.message.includes('permission') || err.message.includes('Not authenticated')) {
        // Silently fail - user might not have Google account connected
      } else {
        showError('Gagal sinkronisasi data')
      }
    } finally {
      setSyncing(false)
    }
  }, [online, syncing, syncEnabled, autoSync, updatePendingCount, success, showError])

  // Get sync status
  const getSyncStatus = useCallback(() => {
    if (!syncEnabled) return { status: 'disabled', label: 'Sinkronisasi Off', color: 'text-gray-500' }
    if (!online) return { status: 'offline', label: 'Offline', color: 'text-red-500' }
    if (syncing) return { status: 'syncing', label: 'Menyinkronkan...', color: 'text-amber-500' }
    if (pendingCount > 0) return { status: 'pending', label: `Menunggu (${pendingCount})`, color: 'text-amber-500' }
    return { status: 'synced', label: 'Online & Sinkron', color: 'text-emerald-500' }
  }, [online, syncing, pendingCount, syncEnabled])

  const value = {
    online,
    pendingCount,
    syncing,
    lastSyncTime,
    autoSync,
    syncEnabled,
    triggerSync,
    updatePendingCount,
    getSyncStatus,
    toggleAutoSync,
    toggleSyncEnabled
  }

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSync must be used within SyncProvider')
  }
  return context
}