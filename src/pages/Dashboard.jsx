import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { getTodayStats, getEmosCountByPeriod } from '../services/db'
import Card from '../components/ui/Card'
import ReminderWidget from '../components/ui/ReminderWidget'
import ProductFocusWidget from '../components/ui/ProductFocusWidget'
import { Footprints, DollarSign, Package, Calendar, Plus, Store, ArrowRight, RefreshCw, ShoppingCart } from 'lucide-react'
import { formatCurrency, getGreeting } from '../utils/helpers'

export default function Dashboard() {
  const { user, isDemo } = useAuth()
  const { online, syncing, pendingCount, triggerSync, getSyncStatus } = useSync()
  const [stats, setStats] = useState({
    kunjunganCount: 0,
    totalTagihan: 0,
    totalRetur: 0,
    agendaCount: 0
  })
  const [emosStats, setEmosStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0
  })
  const [loading, setLoading] = useState(true)
  const [emosLoading, setEmosLoading] = useState(true)

  useEffect(() => {
    loadStats()
    loadEmosStats()
  }, [])

  async function loadStats() {
    try {
      const data = await getTodayStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadEmosStats() {
    try {
      const [daily, weekly, monthly] = await Promise.all([
        getEmosCountByPeriod('daily'),
        getEmosCountByPeriod('weekly'),
        getEmosCountByPeriod('monthly')
      ])
      setEmosStats({ daily, weekly, monthly })
    } catch (err) {
      console.error('Failed to load EMOS stats:', err)
    } finally {
      setEmosLoading(false)
    }
  }

  const syncStatus = getSyncStatus()

  const statCards = [
    {
      title: 'Kunjungan Hari Ini',
      value: stats.kunjunganCount,
      icon: Footprints,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Total Tagihan',
      value: formatCurrency(stats.totalTagihan),
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      title: 'Total Retur',
      value: stats.totalRetur,
      icon: Package,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      title: 'Agenda Hari Ini',
      value: stats.agendaCount,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {getGreeting()}, {isDemo ? 'Demo' : (user?.name?.split(' ')[0] || 'User')}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
        {isDemo && (
          <span className="badge-warning">Demo Mode</span>
        )}
      </div>

      {/* Sync Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {online ? (
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <RefreshCw className={`w-5 h-5 text-emerald-500 ${syncing ? 'animate-spin' : ''}`} />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <span className="text-red-500 text-xl">✕</span>
              </div>
            )}
            <div>
              <p className={`font-medium ${syncStatus.color}`}>
                {syncStatus.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pendingCount > 0 ? `${pendingCount} data menunggu` : 'Semua data tersinkron'}
              </p>
            </div>
          </div>
          {pendingCount > 0 && online && (
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="btn btn-sm btn-secondary"
            >
              Sinkronkan
            </button>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="p-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.title}
              </p>
            </Card>
          )
        })}
      </div>

      {/* EMOS Stats Widget */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              EMOS Stats
            </h3>
          </div>
          <Link
            to="/reports"
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            Detail
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {emosLoading ? '...' : emosStats.daily}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hari Ini</p>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {emosLoading ? '...' : emosStats.weekly}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Minggu Ini</p>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {emosLoading ? '...' : emosStats.monthly}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Bulan Ini</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          Jumlah kunjungan yang melakukan EMOS
        </p>
      </Card>

      {/* Reminder Widget */}
      <ReminderWidget />

      {/* Product Focus Widget */}
      <ProductFocusWidget />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Link
            to="/visits/new"
            className="flex flex-col items-center gap-2 p-4 bg-primary rounded-2xl text-white"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Kunjungan</span>
          </Link>
          <Link
            to="/stores/new"
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl text-primary border-2 border-primary"
          >
            <Store className="w-6 h-6" />
            <span className="text-sm font-medium">Toko</span>
          </Link>
          <Link
            to="/agenda"
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl text-primary border-2 border-primary"
          >
            <Calendar className="w-6 h-6" />
            <span className="text-sm font-medium">Agenda</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Aktivitas Terakhir
          </h2>
          <Link
            to="/visits"
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Card className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Footprints className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Belum ada kunjungan hari ini
          </p>
          <Link
            to="/visits/new"
            className="btn btn-primary btn-sm mt-4"
          >
            Catat Kunjungan
          </Link>
        </Card>
      </div>
    </div>
  )
}