import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getAllStores, getVisitById, saveVisit } from '../services/db'
import { useSync } from '../contexts/SyncContext'
import { useToast } from '../contexts/ToastContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import { ArrowLeft, Plus, Trash2, Camera, X, Search, CheckSquare, ShoppingCart } from 'lucide-react'
import { generateId, compressImage, STATUS_KUNJUNGAN, STATUS_TAGIHAN } from '../utils/helpers'

export default function VisitForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updatePendingCount } = useSync()
  const { success, error: showError } = useToast()
  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState([])
  const [storeSearch, setStoreSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [form, setForm] = useState({
    storeId: '',
    storeName: '',
    statusKunjungan: 'dikunjungi',
    tagihan: '',
    nominalOrder: '',
    statusTagihan: 'belum_bayar',
    isEmos: false,
    retur: [],
    fotoFaktur: '',
    fotoRetur: '',
    catatan: '',
    tanggal: Date.now()
  })
  const [newRetur, setNewRetur] = useState({
    nama: '',
    jumlah: '',
    satuan: '',
    noFaktur: ''
  })
  const [errors, setErrors] = useState({})

  const isEditing = !!id

  // Load stores
  useEffect(() => {
    loadStores()
  }, [])

  // Load visit data when editing
  useEffect(() => {
    if (id) {
      loadVisitData(id)
    } else {
      // Check for preselected store from URL
      const preselectedId = searchParams.get('storeId')
      if (preselectedId && stores.length > 0) {
        const store = stores.find(s => s.id === preselectedId)
        if (store) {
          setForm(prev => ({
            ...prev,
            storeId: store.id,
            storeName: store.nama
          }))
          setStoreSearch(store.nama)
        }
      }
    }
  }, [id, stores.length])

  // Load stores from database
  async function loadStores() {
    try {
      const data = await getAllStores()
      setStores(data)
    } catch (err) {
      console.error('Failed to load stores:', err)
      showError('Gagal memuat daftar toko')
    }
  }

  // Load visit data for editing
  async function loadVisitData(visitId) {
    try {
      console.log('Loading visit:', visitId)
      const visit = await getVisitById(visitId)
      console.log('Visit data:', visit)

      if (visit) {
        setForm({
          storeId: visit.storeId || '',
          storeName: visit.storeName || '',
          statusKunjungan: visit.statusKunjungan || 'dikunjungi',
          tagihan: visit.tagihan || '',
          nominalOrder: visit.nominalOrder || '',
          statusTagihan: visit.statusTagihan || 'belum_bayar',
          isEmos: visit.isEmos || false,
          retur: Array.isArray(visit.retur) ? visit.retur : [],
          fotoFaktur: visit.fotoFaktur || '',
          fotoRetur: visit.fotoRetur || '',
          catatan: visit.catatan || '',
          tanggal: visit.tanggal || Date.now()
        })
        setStoreSearch(visit.storeName || '')
        console.log('Form updated with catatan:', visit.catatan)
      } else {
        showError('Data kunjungan tidak ditemukan')
        navigate('/visits')
      }
    } catch (err) {
      console.error('Failed to load visit:', err)
      showError('Gagal memuat data kunjungan')
    }
  }

  // Filter stores based on search
  const filteredStores = useMemo(() => {
    if (!storeSearch) return stores
    const search = storeSearch.toLowerCase()
    return stores.filter(s =>
      s.nama?.toLowerCase().includes(search) ||
      s.alamat?.toLowerCase().includes(search) ||
      s.area?.toLowerCase().includes(search)
    )
  }, [stores, storeSearch])

  function handleStoreSearchChange(e) {
    const value = e.target.value
    setStoreSearch(value)
    setForm(prev => ({ ...prev, storeId: '', storeName: '' }))
    setShowDropdown(true)
  }

  function handleStoreSelect(store) {
    setForm(prev => ({
      ...prev,
      storeId: store.id,
      storeName: store.nama
    }))
    setStoreSearch(store.nama)
    setShowDropdown(false)
    if (errors.storeId) {
      setErrors(prev => ({ ...prev, storeId: '' }))
    }
  }

  function handleStoreInputFocus() {
    setShowDropdown(true)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  function toggleEmos() {
    setForm(prev => ({ ...prev, isEmos: !prev.isEmos }))
  }

  function addRetur() {
    if (!newRetur.nama || !newRetur.jumlah) {
      showError('Nama barang dan jumlah wajib diisi')
      return
    }

    setForm(prev => ({
      ...prev,
      retur: [...prev.retur, { ...newRetur }]
    }))
    setNewRetur({ nama: '', jumlah: '', satuan: '', noFaktur: '' })
  }

  function removeRetur(index) {
    setForm(prev => ({
      ...prev,
      retur: prev.retur.filter((_, i) => i !== index)
    }))
  }

  async function handlePhotoChange(e, field) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressed = await compressImage(file)
      setForm(prev => ({ ...prev, [field]: compressed }))
    } catch (err) {
      showError('Gagal memproses foto')
    }
  }

  function removePhoto(field) {
    setForm(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const newErrors = {}
    if (!form.storeId) {
      newErrors.storeId = 'Pilih toko wajib'
    }
    if (!form.statusKunjungan) {
      newErrors.statusKunjungan = 'Status kunjungan wajib'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      console.log('Submitting form with catatan:', form.catatan)

      const visitData = {
        ...form,
        id: id || generateId(),
        tagihan: form.statusKunjungan === 'dikunjungi' ? parseInt(form.tagihan) || 0 : 0,
        nominalOrder: form.nominalOrder ? parseInt(form.nominalOrder) : 0
      }

      console.log('Visit data to save:', visitData)

      await saveVisit(visitData)
      await updatePendingCount()
      success(isEditing ? 'Kunjungan berhasil diperbarui' : 'Kunjungan berhasil disimpan')
      navigate('/visits')
    } catch (err) {
      console.error('Failed to save visit:', err)
      showError('Gagal menyimpan kunjungan')
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = Object.entries(STATUS_KUNJUNGAN).map(([value, label]) => ({
    value,
    label
  }))

  const tagihanStatusOptions = Object.entries(STATUS_TAGIHAN).map(([value, label]) => ({
    value,
    label
  }))

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/visits')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {isEditing ? 'Edit Kunjungan' : 'Catat Kunjungan'}
      </h1>

      {/* Store Selection with Search */}
      <Card className="p-4">
        <label className="label">Pilih Toko *</label>
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={storeSearch}
              onChange={handleStoreSearchChange}
              onFocus={handleStoreInputFocus}
              placeholder="Ketik untuk mencari toko..."
              className="input pl-12"
              autoComplete="off"
            />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 max-h-60 overflow-y-auto">
              {filteredStores.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Toko tidak ditemukan
                </div>
              ) : (
                filteredStores.map(store => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => handleStoreSelect(store)}
                    className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                      form.storeId === store.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{store.nama}</p>
                    {store.alamat && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{store.alamat}</p>
                    )}
                    {store.area && (
                      <span className="text-xs text-primary">{store.area}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {errors.storeId && (
            <p className="text-sm text-red-500 mt-1">{errors.storeId}</p>
          )}
        </div>
      </Card>

      {/* Visit Status */}
      <Card className="p-4">
        <label className="label">Status Kunjungan *</label>
        <div className="grid grid-cols-3 gap-2">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, statusKunjungan: opt.value }))}
              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                form.statusKunjungan === opt.value
                  ? opt.value === 'dikunjungi'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : opt.value === 'tutup'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Bill Section - only show if visited */}
      {form.statusKunjungan === 'dikunjungi' && (
        <>
          {/* Order Info */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Informasi Order
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nominal Tagihan"
                name="tagihan"
                type="number"
                value={form.tagihan}
                onChange={handleChange}
                placeholder="0"
              />
              <Input
                label="Nominal Order"
                name="nominalOrder"
                type="number"
                value={form.nominalOrder}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <Select
              label="Status Tagihan"
              name="statusTagihan"
              value={form.statusTagihan}
              onChange={handleChange}
              options={tagihanStatusOptions}
            />
          </Card>

          {/* EMOS Checkbox */}
          <Card className="p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isEmos}
                onChange={toggleEmos}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                form.isEmos
                  ? 'bg-primary border-primary text-white'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {form.isEmos && <CheckSquare className="w-4 h-4" />}
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className={`w-5 h-5 ${form.isEmos ? 'text-primary' : 'text-gray-400'}`} />
                <span className="font-medium text-gray-900 dark:text-white">
                  Melakukan EMOS
                </span>
              </div>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-9">
              Centang jika Anda melakukan kunjungan untuk monitoring stok dan order ke toko
            </p>
          </Card>

          {/* Return Section */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Retur Barang
              </h3>
              <span className="text-sm text-gray-500">{form.retur.length} item</span>
            </div>

            {/* Retur List */}
            {form.retur.length > 0 && (
              <div className="space-y-2">
                {form.retur.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.nama}</p>
                      <p className="text-sm text-gray-500">
                        {item.jumlah} {item.satuan}
                        {item.noFaktur && ` • Faktur: ${item.noFaktur}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRetur(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Retur Form */}
            <div className="space-y-3 p-3 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl">
              <Input
                placeholder="Nama Barang"
                value={newRetur.nama}
                onChange={e => setNewRetur(prev => ({ ...prev, nama: e.target.value }))}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Jumlah"
                  type="number"
                  value={newRetur.jumlah}
                  onChange={e => setNewRetur(prev => ({ ...prev, jumlah: e.target.value }))}
                  className="w-24 text-sm"
                />
                <Input
                  placeholder="Satuan"
                  value={newRetur.satuan}
                  onChange={e => setNewRetur(prev => ({ ...prev, satuan: e.target.value }))}
                  className="flex-1 text-sm"
                />
              </div>
              <Input
                placeholder="No. Faktur Retur (opsional)"
                value={newRetur.noFaktur}
                onChange={e => setNewRetur(prev => ({ ...prev, noFaktur: e.target.value }))}
                className="text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addRetur}
                className="w-full"
              >
                <Plus className="w-4 h-4" />
                Tambah Retur
              </Button>
            </div>
          </Card>

          {/* Photo Section */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Lampiran Foto
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Faktur Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Foto Faktur
                </label>
                {form.fotoFaktur ? (
                  <div className="relative h-32 rounded-xl overflow-hidden">
                    <img src={form.fotoFaktur} alt="Faktur" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto('fotoFaktur')}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer text-gray-400 hover:border-primary">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-xs">Ambil Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => handlePhotoChange(e, 'fotoFaktur')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Retur Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Foto Retur
                </label>
                {form.fotoRetur ? (
                  <div className="relative h-32 rounded-xl overflow-hidden">
                    <img src={form.fotoRetur} alt="Retur" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto('fotoRetur')}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer text-gray-400 hover:border-primary">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-xs">Ambil Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => handlePhotoChange(e, 'fotoRetur')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Notes - This is always shown */}
      <Card className="p-4">
        <Textarea
          label="Catatan Kunjungan"
          name="catatan"
          value={form.catatan}
          onChange={handleChange}
          placeholder="Catatan tambahan tentang kunjungan ini..."
          rows={4}
        />
        {form.catatan && (
          <p className="text-xs text-gray-500 mt-1">
            {form.catatan.length} karakter
          </p>
        )}
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        loading={loading}
        className="w-full"
        size="lg"
      >
        {isEditing ? 'Simpan Perubahan' : 'Simpan Kunjungan'}
      </Button>
    </form>
  )
}