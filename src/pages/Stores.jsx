import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllStores, searchStores, deleteStore } from '../services/db'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { Search, Plus, MapPin, Phone, Trash2, Edit2, Store as StoreIcon } from 'lucide-react'
import { formatDate, debounce } from '../utils/helpers'
import { useToast } from '../contexts/ToastContext'

export default function Stores() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredStores, setFilteredStores] = useState([])
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadStores()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = stores.filter(s =>
        s.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.alamat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.area?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredStores(filtered)
    } else {
      setFilteredStores(stores)
    }
  }, [searchQuery, stores])

  async function loadStores() {
    try {
      const data = await getAllStores()
      setStores(data)
      setFilteredStores(data)
    } catch (err) {
      showError('Gagal memuat daftar toko')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Hapus toko "${name}"?`)) return

    try {
      await deleteStore(id)
      await loadStores()
      success('Toko berhasil dihapus')
    } catch (err) {
      showError('Gagal menghapus toko')
    }
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Toko
        </h1>
        <Link to="/stores/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Tambah
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari toko..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="input pl-12"
        />
      </div>

      {/* Store List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <div className="skeleton h-6 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : filteredStores.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <StoreIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Toko tidak ditemukan' : 'Belum ada toko'}
          </p>
          {!searchQuery && (
            <Link to="/stores/new">
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Tambah Toko
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStores.map(store => (
            <Link key={store.id} to={`/stores/${store.id}`}>
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {store.nama}
                    </h3>
                    {store.alamat && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{store.alamat}</span>
                      </div>
                    )}
                    {store.hp && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{store.hp}</span>
                      </div>
                    )}
                    {store.area && (
                      <span className="badge-info mt-2">{store.area}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/stores/${store.id}/edit`}
                      onClick={e => e.stopPropagation()}
                      className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleDelete(store.id, store.nama)
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {store.syncStatus === 'pending' && (
                  <span className="badge-warning mt-2">Belum sinkron</span>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* FAB */}
      <Link
        to="/stores/new"
        className="fab"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}