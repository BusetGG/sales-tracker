import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAllStores, getAgendaById, saveAgenda, deleteAgenda } from '../services/db'
import { useSync } from '../contexts/SyncContext'
import { useToast } from '../contexts/ToastContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Select from '../components/ui/Select'
import { ArrowLeft, Trash2, Calendar } from 'lucide-react'
import { generateId, KATEGORI_AGENDA } from '../utils/helpers'

export default function AgendaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updatePendingCount } = useSync()
  const { success, error: showError } = useToast()

  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState([])
  const [form, setForm] = useState({
    storeId: '',
    storeName: '',
    judul: '',
    kategori: 'follow_up',
    tanggal: new Date().toISOString().split('T')[0],
    catatan: '',
    status: 'pending'
  })
  const [errors, setErrors] = useState({})

  const isEditing = !!id

  useEffect(() => {
    loadStores()
    if (id) {
      loadAgenda()
    }
  }, [id])

  async function loadStores() {
    try {
      const data = await getAllStores()
      setStores(data)
    } catch (err) {
      console.error('Failed to load stores:', err)
    }
  }

  async function loadAgenda() {
    try {
      const agenda = await getAgendaById(id)
      if (agenda) {
        setForm({
          ...agenda,
          tanggal: new Date(agenda.tanggal).toISOString().split('T')[0]
        })
      }
    } catch (err) {
      showError('Gagal memuat data agenda')
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  function handleStoreChange(e) {
    const storeId = e.target.value
    const store = stores.find(s => s.id === storeId)
    setForm(prev => ({
      ...prev,
      storeId,
      storeName: store?.nama || ''
    }))
  }

  function validate() {
    const newErrors = {}
    if (!form.judul?.trim()) {
      newErrors.judul = 'Judul wajib diisi'
    }
    if (!form.tanggal) {
      newErrors.tanggal = 'Tanggal wajib diisi'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const agendaData = {
        ...form,
        id: id || generateId(),
        tanggal: new Date(form.tanggal).getTime()
      }
      await saveAgenda(agendaData)
      await updatePendingCount()
      success(isEditing ? 'Agenda berhasil diperbarui' : 'Agenda berhasil ditambahkan')
      navigate('/agenda')
    } catch (err) {
      showError('Gagal menyimpan agenda')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Hapus agenda ini?')) return

    setLoading(true)
    try {
      await deleteAgenda(id)
      await updatePendingCount()
      success('Agenda berhasil dihapus')
      navigate('/agenda')
    } catch (err) {
      showError('Gagal menghapus agenda')
    } finally {
      setLoading(false)
    }
  }

  const kategoriOptions = Object.entries(KATEGORI_AGENDA).map(([value, label]) => ({
    value,
    label
  }))

  const storeOptions = stores.map(s => ({
    value: s.id,
    label: s.nama
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/agenda')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {isEditing ? 'Edit Agenda' : 'Agenda Baru'}
      </h1>

      {/* Form Fields */}
      <Card className="p-4 space-y-4">
        <Input
          label="Judul *"
          name="judul"
          value={form.judul}
          onChange={handleChange}
          placeholder="Contoh: Janji Bayar Tagihan"
          error={errors.judul}
        />

        <Select
          label="Kategori"
          name="kategori"
          value={form.kategori}
          onChange={handleChange}
          options={kategoriOptions}
        />

        <Select
          label="Toko"
          value={form.storeId}
          onChange={handleStoreChange}
          options={storeOptions}
          placeholder="Pilih toko (opsional)"
        />

        <Input
          label="Tanggal *"
          name="tanggal"
          type="date"
          value={form.tanggal}
          onChange={handleChange}
          error={errors.tanggal}
        />

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
        {isEditing ? 'Simpan Perubahan' : 'Tambah Agenda'}
      </Button>

      {/* Delete Button */}
      {isEditing && (
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          className="w-full"
        >
          <Trash2 className="w-4 h-4" />
          Hapus Agenda
        </Button>
      )}
    </form>
  )
}