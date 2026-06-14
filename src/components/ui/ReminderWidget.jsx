import { useState, useEffect } from 'react'
import {
  getActiveReminders,
  saveReminder,
  deleteReminder,
  toggleReminderStatus,
  toggleReminderPinned
} from '../../services/db'
import { useToast } from '../../contexts/ToastContext'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import { Plus, Pin, PinOff, Check, Trash2, X, StickyNote } from 'lucide-react'
import { generateId } from '../../utils/helpers'

export default function ReminderWidget() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newReminder, setNewReminder] = useState({ text: '', catatan: '' })
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadReminders()
  }, [])

  async function loadReminders() {
    try {
      const data = await getActiveReminders()
      setReminders(data)
    } catch (err) {
      console.error('Failed to load reminders:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddReminder(e) {
    e.preventDefault()
    if (!newReminder.text.trim()) {
      showError('Reminder tidak boleh kosong')
      return
    }

    try {
      await saveReminder({
        id: generateId(),
        text: newReminder.text.trim(),
        catatan: newReminder.catatan.trim(),
        status: 'active',
        pinned: false
      })
      setNewReminder({ text: '', catatan: '' })
      setShowForm(false)
      await loadReminders()
      success('Reminder ditambahkan')
    } catch (err) {
      showError('Gagal menyimpan reminder')
    }
  }

  async function handleToggle(id) {
    try {
      const reminder = await toggleReminderStatus(id)
      if (reminder?.status === 'done') {
        success('Reminder selesai')
      }
      await loadReminders()
    } catch (err) {
      showError('Gagal update reminder')
    }
  }

  async function handleTogglePin(id) {
    try {
      await toggleReminderPinned(id)
      await loadReminders()
    } catch (err) {
      showError('Gagal pin reminder')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus reminder ini?')) return
    try {
      await deleteReminder(id)
      await loadReminders()
      success('Reminder dihapus')
    } catch (err) {
      showError('Gagal hapus reminder')
    }
  }

  const pinnedReminders = reminders.filter(r => r.pinned)
  const unpinnedReminders = reminders.filter(r => !r.pinned)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Reminder
          </h3>
          <span className="badge-warning">{reminders.length}</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAddReminder} className="mb-4 p-3 bg-gray-50 dark:bg-slate-900 rounded-xl">
          <Input
            placeholder="Ketik reminder..."
            value={newReminder.text}
            onChange={e => setNewReminder(prev => ({ ...prev, text: e.target.value }))}
            className="mb-2"
            autoFocus
          />
          <Textarea
            placeholder="Catatan (opsional)"
            value={newReminder.catatan}
            onChange={e => setNewReminder(prev => ({ ...prev, catatan: e.target.value }))}
            rows={2}
            className="mb-2 text-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              Simpan
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      )}

      {/* Reminder List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Tidak ada reminder aktif
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {/* Pinned Reminders */}
          {pinnedReminders.map(reminder => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onToggle={() => handleToggle(reminder.id)}
              onTogglePin={() => handleTogglePin(reminder.id)}
              onDelete={() => handleDelete(reminder.id)}
            />
          ))}

          {/* Unpinned Reminders */}
          {unpinnedReminders.map(reminder => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onToggle={() => handleToggle(reminder.id)}
              onTogglePin={() => handleTogglePin(reminder.id)}
              onDelete={() => handleDelete(reminder.id)}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

function ReminderItem({ reminder, onToggle, onTogglePin, onDelete }) {
  const isDone = reminder.status === 'done'

  return (
    <div
      className={`
        flex items-start gap-2 p-2 rounded-lg group transition-colors
        ${isDone ? 'bg-gray-50 dark:bg-slate-900 opacity-60' : 'bg-amber-50 dark:bg-amber-900/10'}
      `}
    >
      <button
        onClick={onToggle}
        className={`
          mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${isDone
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary'
          }
        `}
      >
        {isDone && <Check className="w-3 h-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isDone ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
          {reminder.text}
        </p>
        {reminder.catatan && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
            {reminder.catatan}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onTogglePin}
          className={`p-1 rounded ${reminder.pinned ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
        >
          {reminder.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-500 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}