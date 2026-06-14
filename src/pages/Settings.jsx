import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useSync } from '../contexts/SyncContext'
import { useToast } from '../contexts/ToastContext'
import { downloadBackup, restoreBackup, validateBackupFile } from '../services/backup'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { User, Moon, Sun, Download, Upload, LogOut, RefreshCw, HardDrive, Shield, CloudOff, Zap } from 'lucide-react'

export default function Settings() {
  const { user, logout, isDemo } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const { online, syncing, triggerSync, getSyncStatus, syncEnabled, autoSync, toggleSyncEnabled, toggleAutoSync } = useSync()
  const { success, error: showError, info } = useToast()
  const fileInputRef = useRef(null)
  const [importing, setImporting] = useState(false)

  const syncStatus = getSyncStatus()

  async function handleExport() {
    try {
      const result = await downloadBackup()
      if (result.success) {
        success(`Backup berhasil diunduh: ${result.fileName}`)
      } else {
        showError('Gagal mengekspor backup')
      }
    } catch (err) {
      showError('Gagal mengekspor backup')
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const validation = await validateBackupFile(file)
      if (!validation.valid) {
        showError(validation.error)
        return
      }

      const confirmed = confirm(
        `Import backup?\n\n` +
        `Toko: ${validation.info.stores}\n` +
        `Kunjungan: ${validation.info.visits}\n` +
        `Agenda: ${validation.info.agendas}\n\n` +
        `Data saat ini akan digantikan. Lanjutkan?`
      )

      if (confirmed) {
        setImporting(true)
        const result = await restoreBackup(file)
        if (result.success) {
          success('Backup berhasil dipulihkan')
          window.location.reload()
        } else {
          showError(result.error)
        }
      }
    } catch (err) {
      showError('Gagal mengimpor backup')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  function handleLogout() {
    if (confirm('Logout dari aplikasi?')) {
      logout()
    }
  }

  function handleToggleSync() {
    toggleSyncEnabled(!syncEnabled)
  }

  function handleToggleAutoSync() {
    toggleAutoSync(!autoSync)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Pengaturan
      </h1>

      {/* Profile */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {user?.name || 'User'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email || 'demo@sales-tracker.app'}
            </p>
            {isDemo && (
              <span className="badge-warning mt-1">Demo Mode</span>
            )}
          </div>
        </div>
      </Card>

      {/* Sync Settings */}
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary" />
          Sinkronisasi
        </h3>

        {/* Sync Enable Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              syncEnabled ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-gray-100 dark:bg-slate-700'
            }`}>
              {syncEnabled ? (
                <HardDrive className="w-5 h-5 text-emerald-500" />
              ) : (
                <CloudOff className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Sinkronisasi
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {syncEnabled ? 'Aktif' : 'Nonaktif'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleSync}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              syncEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                syncEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Auto Sync Toggle */}
        {syncEnabled && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                autoSync ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-slate-700'
              }`}>
                <Zap className={`w-5 h-5 ${autoSync ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Sinkronisasi Otomatis
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {autoSync ? 'Setiap 5 menit' : 'Manual saja'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleAutoSync}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                autoSync ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  autoSync ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* Sync Status & Manual Sync */}
        {syncEnabled && (
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className={`text-sm font-medium ${syncStatus.color}`}>
                {syncStatus.label}
              </p>
              {syncing && (
                <p className="text-xs text-gray-500">Mohon tunggu...</p>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={triggerSync}
              disabled={!online || syncing || !syncEnabled}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sinkronkan
            </Button>
          </div>
        )}
      </Card>

      {/* Appearance */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Sun className="w-5 h-5 text-amber-500" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Dark Mode
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {darkMode ? 'Tema gelap aktif' : 'Tema terang aktif'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              darkMode ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                darkMode ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Backup */}
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Backup & Restore
        </h3>

        <Button
          variant="secondary"
          onClick={handleExport}
          className="w-full justify-start"
        >
          <Download className="w-5 h-5" />
          Export Backup (JSON)
        </Button>

        <Button
          variant="secondary"
          onClick={handleImportClick}
          loading={importing}
          className="w-full justify-start"
        >
          <Upload className="w-5 h-5" />
          Import Backup
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </Card>

      {/* About */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Sales Tracker Personal
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Versi 1.0.0
            </p>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <Button
        variant="danger"
        onClick={handleLogout}
        className="w-full"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </Button>
    </div>
  )
}