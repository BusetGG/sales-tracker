import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getVisitsByDateRange, getAllStores, deleteVisit } from '../services/db'
import { useToast } from '../contexts/ToastContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { Calendar, Copy, Share2, Footprints, DollarSign, Package, FileText, Filter, Store, Edit2, Trash2, Image, X, ShoppingCart, Camera } from 'lucide-react'
import { formatDate, formatCurrency, copyToClipboard, shareText, STATUS_KUNJUNGAN, STATUS_TAGIHAN } from '../utils/helpers'

export default function Reports() {
  const navigate = useNavigate()
  const [visits, setVisits] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('daily')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedStore, setSelectedStore] = useState('')
  const [groupByStore, setGroupByStore] = useState(false)
  const [expandedVisit, setExpandedVisit] = useState(null)
  const [showPhotoModal, setShowPhotoModal] = useState(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadVisits()
  }, [period, startDate, endDate, selectedStore])

  async function loadData() {
    try {
      const storeData = await getAllStores()
      setStores(storeData)
      await loadVisits()
    } catch (err) {
      showError('Gagal memuat data')
    }
  }

  async function loadVisits() {
    setLoading(true)
    try {
      let start, end

      const today = new Date()
      today.setHours(23, 59, 59, 999)

      switch (period) {
        case 'daily':
          start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          end = new Date(startDate)
          end.setHours(23, 59, 59, 999)
          break
        case 'weekly':
          const dayOfWeek = today.getDay()
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
          start = new Date(today)
          start.setDate(today.getDate() + mondayOffset)
          start.setHours(0, 0, 0, 0)
          end = new Date(today)
          end.setHours(23, 59, 59, 999)
          setStartDate(start.toISOString().split('T')[0])
          setEndDate(end.toISOString().split('T')[0])
          break
        case 'monthly':
          start = new Date(today.getFullYear(), today.getMonth(), 1)
          start.setHours(0, 0, 0, 0)
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          end.setHours(23, 59, 59, 999)
          setStartDate(start.toISOString().split('T')[0])
          setEndDate(end.toISOString().split('T')[0])
          break
        case 'custom':
          start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          break
        default:
          start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          end = new Date(startDate)
          end.setHours(23, 59, 59, 999)
      }

      let data = await getVisitsByDateRange(start, end)

      if (selectedStore) {
        data = data.filter(v => v.storeId === selectedStore)
      }

      setVisits(data.sort((a, b) => a.tanggal - b.tanggal))
    } catch (err) {
      showError('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(visitId, storeName) {
    if (!confirm(`Hapus kunjungan ke "${storeName}"?`)) return
    try {
      await deleteVisit(visitId)
      await loadVisits()
      success('Kunjungan berhasil dihapus')
    } catch (err) {
      showError('Gagal menghapus kunjungan')
    }
  }

  function toggleExpand(visitId) {
    setExpandedVisit(expandedVisit === visitId ? null : visitId)
  }

  function generateReport() {
    if (visits.length === 0) {
      return `📊 LAPORAN ${period === 'daily' ? 'HARIAN' : period === 'weekly' ? 'MINGGUAN' : period === 'monthly' ? 'BULANAN' : 'CUSTOM'}\n📅 ${formatDate(startDate)} - ${formatDate(endDate)}\n\n━━━━━━━━━━━━━━━━━━\n\nTidak ada kunjungan dalam periode ini.`
    }

    const kunjunganCount = visits.length
    const totalTagihan = visits.reduce((sum, v) => sum + (v.tagihan || 0), 0)
    const totalOrder = visits.reduce((sum, v) => sum + (v.nominalOrder || 0), 0)
    const emosCount = visits.filter(v => v.isEmos).length

    const allReturns = []
    visits.forEach(v => {
      if (v.retur && Array.isArray(v.retur)) {
        v.retur.forEach(r => {
          allReturns.push({
            nama: r.nama,
            jumlah: r.jumlah,
            satuan: r.satuan
          })
        })
      }
    })

    const groupedReturns = allReturns.reduce((acc, item) => {
      const key = `${item.nama}|${item.satuan}`
      if (!acc[key]) {
        acc[key] = { nama: item.nama, jumlah: 0, satuan: item.satuan }
      }
      acc[key].jumlah += parseInt(item.jumlah) || 0
      return acc
    }, {})

    let report = `📊 LAPORAN ${period === 'daily' ? 'HARIAN' : period === 'weekly' ? 'MINGGUAN' : period === 'monthly' ? 'BULANAN' : 'CUSTOM'}\n`
    report += `📅 ${formatDate(startDate)} - ${formatDate(endDate)}\n\n━━━━━━━━━━━━━━━━━━\n📍 KUNJUNGAN\nJumlah Kunjungan: ${kunjunganCount}\nJumlah EMOS: ${emosCount}\n\n━━━━━━━━━━━━━━━━━━\n💰 TAGIHAN\nTotal Tagihan: ${formatCurrency(totalTagihan)}\nTotal Order: ${formatCurrency(totalOrder)}\n\n`

    if (groupByStore && !selectedStore) {
      const byStore = visits.reduce((acc, v) => {
        const storeName = v.storeName || 'Tanpa Nama'
        if (!acc[storeName]) {
          acc[storeName] = { count: 0, tagihan: 0, order: 0 }
        }
        acc[storeName].count++
        acc[storeName].tagihan += v.tagihan || 0
        acc[storeName].order += v.nominalOrder || 0
        return acc
      }, {})

      report += `📍 PER TOKO:\n`
      Object.entries(byStore).forEach(([storeName, data]) => {
        report += `• ${storeName}: ${data.count} kunjungan\n   Tagihan: ${formatCurrency(data.tagihan)}\n   Order: ${formatCurrency(data.order)}\n`
      })
      report += '\n'
    }

    report += `\n━━━━━━━━━━━━━━━━━━\n📦 RETUR\n`
    if (Object.keys(groupedReturns).length === 0) {
      report += 'Tidak ada retur\n'
    } else {
      Object.values(groupedReturns).forEach(item => {
        report += `• ${item.nama} ${item.jumlah} ${item.satuan}\n`
      })
    }

    const notes = visits.filter(v => v.catatan).map(v => `• ${v.storeName}: ${v.catatan}`)
    if (notes.length > 0) {
      report += `\n━━━━━━━━━━━━━━━━━━\n📝 CATATAN\n`
      notes.forEach(note => {
        report += note + '\n'
      })
    }

    report += '\n━━━━━━━━━━━━━━━━━━\n'
    report += '\nGenerated by Sales Tracker'

    return report
  }

  async function handleCopy() {
    const report = generateReport()
    try {
      await copyToClipboard(report)
      success('Laporan berhasil disalin')
    } catch (err) {
      showError('Gagal menyalin laporan')
    }
  }

  async function handleShare() {
    const report = generateReport()
    try {
      await shareText('Laporan Sales', report)
    } catch (err) {
      showError('Gagal membagikan laporan')
    }
  }

  const report = generateReport()
  const totalTagihan = visits.reduce((sum, v) => sum + (v.tagihan || 0), 0)
  const totalOrder = visits.reduce((sum, v) => sum + (v.nominalOrder || 0), 0)
  const totalRetur = visits.reduce((sum, v) => {
    if (v.retur && Array.isArray(v.retur)) {
      return sum + v.retur.reduce((s, r) => s + (r.jumlah || 0), 0)
    }
    return sum
  }, 0)
  const emosCount = visits.filter(v => v.isEmos).length

  const periodOptions = [
    { value: 'daily', label: 'Harian' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
    { value: 'custom', label: 'Custom' }
  ]

  const storeOptions = stores.map(s => ({
    value: s.id,
    label: s.nama
  }))

  return (
    <div className="space-y-4">
      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setShowPhotoModal(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:bg-white/20 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={showPhotoModal}
              alt="Photo"
              className="w-full rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Laporan
      </h1>

      {/* Period Selection */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Pilih Periode
          </h3>
        </div>

        <div className="flex gap-2 mb-4">
          {periodOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                period === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {(period === 'custom' || period === 'daily') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dari Tanggal</label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            {period === 'custom' && (
              <div>
                <label className="label">Sampai Tanggal</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {(period === 'weekly' || period === 'monthly') && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {period === 'weekly' ? 'Minggu ini' : 'Bulan ini'}: {formatDate(startDate)} - {formatDate(endDate)}
          </p>
        )}
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Filter & Sortir
          </h3>
        </div>

        <div className="space-y-3">
          <Select
            label="Filter Toko"
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
            options={storeOptions}
            placeholder="Semua Toko"
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={groupByStore}
              onChange={e => setGroupByStore(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Kelompokkan berdasarkan toko
            </span>
          </label>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <Footprints className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {visits.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Kunjungan</p>
        </Card>
        <Card className="p-3 text-center">
          <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {formatCurrency(totalTagihan)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tagihan</p>
        </Card>
        <Card className="p-3 text-center">
          <Package className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {totalRetur}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Retur</p>
        </Card>
        <Card className="p-3 text-center">
          <ShoppingCart className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {emosCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">EMOS</p>
        </Card>
      </div>

      {/* Report Preview */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Preview Laporan
          </h2>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 max-h-80 overflow-y-auto">
          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
            {loading ? 'Memuat...' : report}
          </pre>
        </div>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={handleCopy}
          className="flex items-center justify-center gap-2"
        >
          <Copy className="w-5 h-5" />
          Copy
        </Button>
        <Button
          variant="primary"
          onClick={handleShare}
          className="flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Share WhatsApp
        </Button>
      </div>

      {/* Visit Details */}
      {visits.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Detail Kunjungan ({visits.length})
          </h2>
          <div className="space-y-3">
            {visits.map(visit => (
              <Card key={visit.id} className="overflow-hidden">
                {/* Visit Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-primary" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {visit.storeName || 'Toko'}
                      </span>
                      {visit.isEmos && (
                        <span className="badge-warning flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          EMOS
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{formatDate(visit.tanggal)}</span>
                      <span className={`badge ${
                        visit.statusKunjungan === 'dikunjungi' ? 'badge-success' :
                        visit.statusKunjungan === 'tutup' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {STATUS_KUNJUNGAN[visit.statusKunjungan]}
                      </span>
                    </div>
                  </div>

                  {/* Financial Info */}
                  {visit.statusKunjungan === 'dikunjungi' && (
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg">
                        <p className="text-xs text-gray-500">Tagihan</p>
                        <p className="font-semibold text-emerald-600">{formatCurrency(visit.tagihan || 0)}</p>
                        <p className="text-xs text-gray-500">{STATUS_TAGIHAN[visit.statusTagihan]}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg">
                        <p className="text-xs text-gray-500">Order</p>
                        <p className="font-semibold text-blue-600">{formatCurrency(visit.nominalOrder || 0)}</p>
                      </div>
                    </div>
                  )}

                  {/* Retur Info */}
                  {visit.retur && visit.retur.length > 0 && (
                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Retur:</span> {visit.retur.length} item
                      <div className="flex flex-wrap gap-1 mt-1">
                        {visit.retur.map((r, i) => (
                          <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                            {r.nama} ({r.jumlah} {r.satuan})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Catatan */}
                  {visit.catatan && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 p-2 rounded-lg">
                      📝 {visit.catatan}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => toggleExpand(visit.id)}
                      className="flex-1 text-sm text-primary font-medium py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30"
                    >
                      {expandedVisit === visit.id ? 'Tutup Detail' : 'Lihat Detail'}
                    </button>
                    <button
                      onClick={() => navigate(`/visits/${visit.id}`)}
                      className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(visit.id, visit.storeName)}
                      className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedVisit === visit.id && (
                  <div className="border-t border-gray-100 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900">
                    {/* Photos */}
                    {(visit.fotoFaktur || visit.fotoRetur) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                          <Camera className="w-4 h-4" />
                          Foto
                        </h4>
                        <div className="flex gap-2">
                          {visit.fotoFaktur && (
                            <div className="relative">
                              <img
                                src={visit.fotoFaktur}
                                alt="Faktur"
                                className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                onClick={() => setShowPhotoModal(visit.fotoFaktur)}
                              />
                              <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1 rounded">
                                Faktur
                              </span>
                            </div>
                          )}
                          {visit.fotoRetur && (
                            <div className="relative">
                              <img
                                src={visit.fotoRetur}
                                alt="Retur"
                                className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                onClick={() => setShowPhotoModal(visit.fotoRetur)}
                              />
                              <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1 rounded">
                                Retur
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Full Retur List */}
                    {visit.retur && visit.retur.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Detail Retur
                        </h4>
                        <div className="bg-white dark:bg-slate-800 rounded-lg divide-y divide-gray-100 dark:divide-slate-700">
                          {visit.retur.map((r, i) => (
                            <div key={i} className="p-2 flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{r.nama}</p>
                                {r.noFaktur && (
                                  <p className="text-xs text-gray-500">Faktur: {r.noFaktur}</p>
                                )}
                              </div>
                              <span className="badge-warning">
                                {r.jumlah} {r.satuan}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}