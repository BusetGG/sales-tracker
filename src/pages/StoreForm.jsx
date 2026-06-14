import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStoreById, saveStore } from '../services/db'
import { useSync } from '../contexts/SyncContext'
import { useToast } from '../contexts/ToastContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import { ArrowLeft, MapPin, Camera, Image, X, Loader2 } from 'lucide-react'
import { generateId, getCurrentPosition, compressImage } from '../utils/helpers'

export default function StoreForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updatePendingCount } = useSync()
  const { success, error: showError } = useToast()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    alamat: '',
    hp: '',
    area: '',
    latitude: '',
    longitude: '',
    foto: '',
    catatan: ''
  })
  const [errors, setErrors] = useState({})

  const isEditing = !!id

  useEffect(() => {
    if (id) {
      loadStore()
    }
  }, [id])

  async function loadStore() {
    try {
      const store = await getStoreById(id)
      if (store) {
        setForm(store)
      }
    } catch (err) {
      showError('Gagal memuat data toko')
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  async function handleGetLocation() {
    setGettingLocation(true)
    try {
      const position = await getCurrentPosition()
      setForm(prev => ({
        ...prev,
        latitude: position.latitude,
        longitude: position.longitude
      }))
      success('Lokasi berhasil diambil')
    } catch (err) {
      showError('Gagal mendapatkan lokasi: ' + err.message)
    } finally {
      setGettingLocation(false)
    }
  }

  function handlePhotoClick() {
    fileInputRef.current?.click()
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressed = await compressImage(file)
      setForm(prev => ({ ...prev, foto: compressed }))
    } catch (err) {
      showError('Gagal memproses foto')
    }
  }

  function removePhoto() {
    setForm(prev => ({ ...prev, foto: '' }))
  }

  function validate() {
    const newErrors = {}
    if (!form.nama?.trim()) {
      newErrors.nama = 'Nama toko wajib diisi'
    }
    if (!form.alamat?.trim()) {
      newErrors.alamat = 'Alamat wajib diisi'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const storeData = {
        ...form,
        id: id || generateId()
      }
      await saveStore(storeData)
      await updatePendingCount()
      success(isEditing ? 'Toko berhasil diperbarui' : 'Toko berhasil ditambahkan')
      navigate('/stores')
    } catch (err) {
      showError('Gagal menyimpan toko')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/stores')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {isEditing ? 'Edit Toko' : 'Tambah Toko Baru'}
      </h1>

      {/* Photo */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Foto Toko
        </label>
        {form.foto ? (
          <div className="relative h-48 rounded-xl overflow-hidden">
            <img
              src={form.foto}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePhotoClick}
            className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors"
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm">Ambil Foto</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </Card>

      {/* Form Fields */}
      <Card className="p-4 space-y-4">
        <Input
          label="Nama Toko *"
          name="nama"
          value={form.nama}
          onChange={handleChange}
          placeholder="Masukkan nama toko"
          error={errors.nama}
        />

        <Textarea
          label="Alamat *"
          name="alamat"
          value={form.alamat}
          onChange={handleChange}
          placeholder="Masukkan alamat lengkap"
          rows={3}
          error={errors.alamat}
        />

        <Input
          label="Nomor HP"
          name="hp"
          type="tel"
          value={form.hp}
          onChange={handleChange}
          placeholder="08xxxxxxxxxx"
        />

        <Input
          label="Area"
          name="area"
          value={form.area}
          onChange={handleChange}
          placeholder="Contoh: Jakarta Selatan"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lokasi
          </label>
          <div className="flex gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                placeholder="Latitude"
                className="text-sm"
              />
              <Input
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                placeholder="Longitude"
                className="text-sm"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleGetLocation}
              disabled={gettingLocation}
              className="px-3"
            >
              {gettingLocation ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        <Textarea
          label="Catatan"
          name="catatan"
          value={form.catatan}
          onChange={handleChange}
          placeholder="Catatan tambahan..."
          rows={3}
        />
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        loading={loading}
        className="w-full"
        size="lg"
      >
        {isEditing ? 'Simpan Perubahan' : 'Tambah Toko'}
      </Button>
    </form>
  )
}