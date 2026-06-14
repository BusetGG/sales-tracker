import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllAgendas, getTodayAgendas, getUpcomingAgendas, toggleAgendaStatus } from '../services/db'
import { useSync } from '../contexts/SyncContext'
import { useToast } from '../contexts/ToastContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Plus, Calendar, CheckCircle, Circle, Clock } from 'lucide-react'
import { formatDate, KATEGORI_AGENDA, STATUS_AGENDA } from '../utils/helpers'

export default function Agenda() {
  const [todayAgendas, setTodayAgendas] = useState([])
  const [upcomingAgendas, setUpcomingAgendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')
  const { updatePendingCount } = useSync()
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadAgendas()
  }, [])

  async function loadAgendas() {
    try {
      const today = await getTodayAgendas()
      const upcoming = await getUpcomingAgendas()
      setTodayAgendas(today)
      setUpcomingAgendas(upcoming)
    } catch (err) {
      showError('Gagal memuat agenda')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleStatus(id) {
    try {
      await toggleAgendaStatus(id)
      await loadAgendas()
      success('Status agenda diperbarui')
    } catch (err) {
      showError('Gagal memperbarui status')
    }
  }

  const displayedAgendas = activeTab === 'today' ? todayAgendas : upcomingAgendas

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Agenda
        </h1>
        <Link to="/agenda/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Baru
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'today'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Hari Ini ({todayAgendas.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Mendatang ({upcomingAgendas.length})
        </button>
      </div>

      {/* Agenda List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <div className="skeleton h-6 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : displayedAgendas.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {activeTab === 'today' ? 'Tidak ada agenda hari ini' : 'Tidak ada agenda mendatang'}
          </p>
          <Link to="/agenda/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Tambah Agenda
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedAgendas.map(agenda => (
            <Card key={agenda.id} className="p-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleStatus(agenda.id)}
                  className={`mt-1 flex-shrink-0 ${
                    agenda.status === 'done'
                      ? 'text-emerald-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  {agenda.status === 'done' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${
                      agenda.kategori === 'janji_bayar' ? 'badge-success' :
                      agenda.kategori === 'follow_up' ? 'badge-info' :
                      agenda.kategori === 'ambil_retur' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {KATEGORI_AGENDA[agenda.kategori] || agenda.kategori}
                    </span>
                    {agenda.status === 'done' && (
                      <span className="badge-success">Selesai</span>
                    )}
                  </div>
                  <h3 className={`font-semibold text-gray-900 dark:text-white ${
                    agenda.status === 'done' ? 'line-through opacity-60' : ''
                  }`}>
                    {agenda.judul}
                  </h3>
                  {agenda.storeName && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {agenda.storeName}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <Clock className="w-4 h-4" />
                    {formatDate(agenda.tanggal)}
                  </div>
                  {agenda.catatan && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {agenda.catatan}
                    </p>
                  )}
                </div>
                <Link
                  to={`/agenda/${agenda.id}/edit`}
                  className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* FAB */}
      <Link to="/agenda/new" className="fab">
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}