import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllVisits } from '../services/db'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Plus, Footprints, Store, DollarSign, Package } from 'lucide-react'
import { formatDate, formatCurrency, STATUS_KUNJUNGAN, STATUS_TAGIHAN } from '../utils/helpers'

export default function Visits() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVisits()
  }, [])

  async function loadVisits() {
    try {
      const data = await getAllVisits()
      const sorted = data.sort((a, b) => b.tanggal - a.tanggal)
      setVisits(sorted)
    } catch (err) {
      console.error('Failed to load visits:', err)
    } finally {
      setLoading(false)
    }
  }

  // Group visits by date
  const groupedVisits = visits.reduce((groups, visit) => {
    const date = new Date(visit.tanggal).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(visit)
    return groups
  }, {})

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Kunjungan
        </h1>
        <Link to="/visits/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Baru
          </Button>
        </Link>
      </div>

      {/* Visit List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <div className="skeleton h-6 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : visits.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Footprints className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Belum ada kunjungan
          </p>
          <Link to="/visits/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Catat Kunjungan
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedVisits).map(([date, dateVisits]) => (
            <div key={date}>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {formatDate(date)}
              </h2>
              <div className="space-y-3">
                {dateVisits.map(visit => (
                  <Link key={visit.id} to={`/visits/${visit.id}`}>
                    <Card className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Store className="w-5 h-5 text-primary" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {visit.storeName || 'Toko tidak ditemukan'}
                          </span>
                        </div>
                        <span className={`badge ${
                          visit.statusKunjungan === 'dikunjungi' ? 'badge-success' :
                          visit.statusKunjungan === 'tutup' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {STATUS_KUNJUNGAN[visit.statusKunjungan] || visit.statusKunjungan}
                        </span>
                      </div>

                      {visit.statusKunjungan === 'dikunjungi' && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {formatCurrency(visit.tagihan)}
                            </span>
                            <span className={`text-xs ${
                              visit.statusTagihan === 'lunas' ? 'text-emerald-500' :
                              visit.statusTagihan === 'sebagian' ? 'text-amber-500' : 'text-red-500'
                            }`}>
                              ({STATUS_TAGIHAN[visit.statusTagihan] || '-'})
                            </span>
                          </div>
                          {visit.retur && visit.retur.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="w-4 h-4 text-amber-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {visit.retur.length} retur
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {visit.catatan && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                          {visit.catatan}
                        </p>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <Link to="/visits/new" className="fab">
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}