import { openDB } from 'idb'

const DB_NAME = 'sales_tracker_db'
const DB_VERSION = 2 // Bump version for new stores

const STORES_STORE = 'stores'
const VISITS_STORE = 'visits'
const AGENDAS_STORE = 'agendas'
const REMINDERS_STORE = 'reminders'
const SETTINGS_STORE = 'settings'

let dbInstance = null

async function getDB() {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Stores store
      if (!db.objectStoreNames.contains(STORES_STORE)) {
        const storeOS = db.createObjectStore(STORES_STORE, { keyPath: 'id' })
        storeOS.createIndex('syncStatus', 'syncStatus')
        storeOS.createIndex('nama', 'nama')
        storeOS.createIndex('area', 'area')
      }

      // Visits store
      if (!db.objectStoreNames.contains(VISITS_STORE)) {
        const visitsOS = db.createObjectStore(VISITS_STORE, { keyPath: 'id' })
        visitsOS.createIndex('storeId', 'storeId')
        visitsOS.createIndex('tanggal', 'tanggal')
        visitsOS.createIndex('syncStatus', 'syncStatus')
      }

      // Agendas store
      if (!db.objectStoreNames.contains(AGENDAS_STORE)) {
        const agendasOS = db.createObjectStore(AGENDAS_STORE, { keyPath: 'id' })
        agendasOS.createIndex('storeId', 'storeId')
        agendasOS.createIndex('tanggal', 'tanggal')
        agendasOS.createIndex('status', 'status')
        agendasOS.createIndex('syncStatus', 'syncStatus')
      }

      // Reminders store (new)
      if (!db.objectStoreNames.contains(REMINDERS_STORE)) {
        const remindersOS = db.createObjectStore(REMINDERS_STORE, { keyPath: 'id' })
        remindersOS.createIndex('tanggal', 'tanggal')
        remindersOS.createIndex('status', 'status')
      }

      // Settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' })
      }

      // Add productFocus setting if upgrading from v1
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' })
        }
      }
    }
  })

  return dbInstance
}

// ==================== STORES ====================

export async function getAllStores() {
  const db = await getDB()
  return db.getAll(STORES_STORE)
}

export async function getStoreById(id) {
  const db = await getDB()
  return db.get(STORES_STORE, id)
}

export async function saveStore(store) {
  const db = await getDB()
  const now = Date.now()
  const newStore = {
    ...store,
    createdAt: store.createdAt || now,
    updatedAt: now,
    syncStatus: store.syncStatus || 'pending'
  }
  await db.put(STORES_STORE, newStore)
  return newStore
}

export async function deleteStore(id) {
  const db = await getDB()
  await db.delete(STORES_STORE, id)
}

export async function getStoresByArea(area) {
  const db = await getDB()
  const index = db.transaction(STORES_STORE).store.index('area')
  return index.getAll(area)
}

export async function searchStores(query) {
  const stores = await getAllStores()
  const lowerQuery = query.toLowerCase()
  return stores.filter(
    store =>
      store.nama?.toLowerCase().includes(lowerQuery) ||
      store.alamat?.toLowerCase().includes(lowerQuery) ||
      store.area?.toLowerCase().includes(lowerQuery) ||
      store.hp?.includes(query)
  )
}

// ==================== VISITS ====================

export async function getAllVisits() {
  const db = await getDB()
  return db.getAll(VISITS_STORE)
}

export async function getVisitById(id) {
  const db = await getDB()
  return db.get(VISITS_STORE, id)
}

export async function saveVisit(visit) {
  const db = await getDB()
  const now = Date.now()
  const newVisit = {
    ...visit,
    createdAt: visit.createdAt || now,
    updatedAt: now,
    syncStatus: visit.syncStatus || 'pending'
  }
  await db.put(VISITS_STORE, newVisit)
  return newVisit
}

export async function deleteVisit(id) {
  const db = await getDB()
  await db.delete(VISITS_STORE, id)
}

export async function getVisitsByStore(storeId) {
  const db = await getDB()
  const index = db.transaction(VISITS_STORE).store.index('storeId')
  return index.getAll(storeId)
}

export async function getVisitsByDate(date) {
  const visits = await getAllVisits()
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return visits.filter(v => {
    const visitDate = new Date(v.tanggal)
    return visitDate >= startOfDay && visitDate <= endOfDay
  })
}

export async function getVisitsByDateRange(startDate, endDate) {
  const visits = await getAllVisits()
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  return visits.filter(v => {
    const visitDate = new Date(v.tanggal)
    return visitDate >= start && visitDate <= end
  }).sort((a, b) => a.tanggal - b.tanggal)
}

export async function getVisitsByStoreInRange(storeId, startDate, endDate) {
  const visits = await getVisitsByDateRange(startDate, endDate)
  return visits.filter(v => v.storeId === storeId)
}

export async function getTodayVisits() {
  return getVisitsByDate(new Date())
}

// ==================== AGENDAS ====================

export async function getAllAgendas() {
  const db = await getDB()
  return db.getAll(AGENDAS_STORE)
}

export async function getAgendaById(id) {
  const db = await getDB()
  return db.get(AGENDAS_STORE, id)
}

export async function saveAgenda(agenda) {
  const db = await getDB()
  const now = Date.now()
  const newAgenda = {
    ...agenda,
    createdAt: agenda.createdAt || now,
    updatedAt: now,
    syncStatus: agenda.syncStatus || 'pending'
  }
  await db.put(AGENDAS_STORE, newAgenda)
  return newAgenda
}

export async function deleteAgenda(id) {
  const db = await getDB()
  await db.delete(AGENDAS_STORE, id)
}

export async function getAgendasByStore(storeId) {
  const db = await getDB()
  const index = db.transaction(AGENDAS_STORE).store.index('storeId')
  return index.getAll(storeId)
}

export async function getTodayAgendas() {
  const agendas = await getAllAgendas()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return agendas.filter(a => {
    const agendaDate = new Date(a.tanggal)
    return agendaDate >= today && agendaDate < tomorrow
  })
}

export async function getUpcomingAgendas() {
  const agendas = await getAllAgendas()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return agendas
    .filter(a => {
      const agendaDate = new Date(a.tanggal)
      return agendaDate >= tomorrow
    })
    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
}

export async function toggleAgendaStatus(id) {
  const agenda = await getAgendaById(id)
  if (!agenda) return null

  const updatedAgenda = {
    ...agenda,
    status: agenda.status === 'pending' ? 'done' : 'pending',
    updatedAt: Date.now(),
    syncStatus: 'pending'
  }
  await saveAgenda(updatedAgenda)
  return updatedAgenda
}

// ==================== REMINDERS ====================

export async function getAllReminders() {
  const db = await getDB()
  return db.getAll(REMINDERS_STORE)
}

export async function getReminderById(id) {
  const db = await getDB()
  return db.get(REMINDERS_STORE, id)
}

export async function saveReminder(reminder) {
  const db = await getDB()
  const now = Date.now()
  const newReminder = {
    ...reminder,
    createdAt: reminder.createdAt || now,
    updatedAt: now
  }
  await db.put(REMINDERS_STORE, newReminder)
  return newReminder
}

export async function deleteReminder(id) {
  const db = await getDB()
  await db.delete(REMINDERS_STORE, id)
}

export async function getActiveReminders() {
  const reminders = await getAllReminders()
  return reminders
    .filter(r => r.status !== 'done')
    .sort((a, b) => {
      // Sort by pinned first, then by date
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.createdAt - a.createdAt
    })
}

export async function toggleReminderStatus(id) {
  const reminder = await getReminderById(id)
  if (!reminder) return null

  const updatedReminder = {
    ...reminder,
    status: reminder.status === 'active' ? 'done' : 'active',
    updatedAt: Date.now()
  }
  await saveReminder(updatedReminder)
  return updatedReminder
}

export async function toggleReminderPinned(id) {
  const reminder = await getReminderById(id)
  if (!reminder) return null

  const updatedReminder = {
    ...reminder,
    pinned: !reminder.pinned,
    updatedAt: Date.now()
  }
  await saveReminder(updatedReminder)
  return updatedReminder
}

// ==================== SETTINGS ====================

export async function getSetting(key) {
  const db = await getDB()
  const result = await db.get(SETTINGS_STORE, key)
  return result?.value
}

export async function setSetting(key, value) {
  const db = await getDB()
  await db.put(SETTINGS_STORE, { key, value })
}

export async function deleteSetting(key) {
  const db = await getDB()
  await db.delete(SETTINGS_STORE, key)
}

// Product Focus helpers
export async function getProductFocus() {
  const value = await getSetting('productFocus')
  return value || []
}

export async function setProductFocus(products) {
  await setSetting('productFocus', products)
}

// ==================== SYNC STATUS ====================

export async function getPendingSyncItems() {
  const db = await getDB()

  const stores = await db.getAllFromIndex(STORES_STORE, 'syncStatus', 'pending')
  const visits = await db.getAllFromIndex(VISITS_STORE, 'syncStatus', 'pending')
  const agendas = await db.getAllFromIndex(AGENDAS_STORE, 'syncStatus', 'pending')

  return { stores, visits, agendas }
}

export async function markAsSynced(storeName, id, remoteId) {
  const db = await getDB()
  const item = await db.get(storeName, id)
  if (item) {
    item.syncStatus = 'synced'
    if (remoteId) {
      item.remoteId = remoteId
    }
    item.updatedAt = Date.now()
    await db.put(storeName, item)
  }
}

// ==================== BACKUP ====================

export async function exportAllData() {
  const db = await getDB()

  const stores = await db.getAll(STORES_STORE)
  const visits = await db.getAll(VISITS_STORE)
  const agendas = await db.getAll(AGENDAS_STORE)
  const reminders = await db.getAll(REMINDERS_STORE)
  const settings = await db.getAll(SETTINGS_STORE)

  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      stores,
      visits,
      agendas,
      reminders,
      settings: settings.filter(s => !['accessToken', 'refreshToken'].includes(s.key))
    }
  }
}

export async function importAllData(backupData) {
  if (!backupData || !backupData.data) {
    throw new Error('Invalid backup data')
  }

  const db = await getDB()

  // Clear existing data
  const stores = await db.getAll(STORES_STORE)
  for (const store of stores) {
    await db.delete(STORES_STORE, store.id)
  }

  const visits = await db.getAll(VISITS_STORE)
  for (const visit of visits) {
    await db.delete(VISITS_STORE, visit.id)
  }

  const agendas = await db.getAll(AGENDAS_STORE)
  for (const agenda of agendas) {
    await db.delete(AGENDAS_STORE, agenda.id)
  }

  const reminders = await db.getAll(REMINDERS_STORE)
  for (const reminder of reminders) {
    await db.delete(REMINDERS_STORE, reminder.id)
  }

  // Import new data
  for (const store of backupData.data.stores || []) {
    await db.put(STORES_STORE, { ...store, syncStatus: 'pending' })
  }

  for (const visit of backupData.data.visits || []) {
    await db.put(VISITS_STORE, { ...visit, syncStatus: 'pending' })
  }

  for (const agenda of backupData.data.agendas || []) {
    await db.put(AGENDAS_STORE, { ...agenda, syncStatus: 'pending' })
  }

  for (const reminder of backupData.data.reminders || []) {
    await db.put(REMINDERS_STORE, reminder)
  }

  return true
}

// ==================== STATS ====================

export async function getTodayStats() {
  const visits = await getTodayVisits()
  const agendas = await getTodayAgendas()

  const totalTagihan = visits.reduce((sum, v) => sum + (v.tagihan || 0), 0)

  const totalRetur = visits.reduce((sum, v) => {
    if (v.retur && Array.isArray(v.retur)) {
      return sum + v.retur.reduce((s, r) => s + (r.jumlah || 0), 0)
    }
    return sum
  }, 0)

  return {
    kunjunganCount: visits.length,
    totalTagihan,
    totalRetur,
    agendaCount: agendas.length
  }
}

// ==================== EMOS STATS ====================

export async function getEmosCountByPeriod(period = 'daily') {
  const visits = await getAllVisits()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let startDate, endDate

  switch (period) {
    case 'weekly':
      // Get start of current week (Monday)
      const dayOfWeek = today.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      startDate = new Date(today)
      startDate.setDate(today.getDate() + mondayOffset)
      endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'monthly':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'daily':
    default:
      startDate = today
      endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)
  }

  const filteredVisits = visits.filter(v => {
    const visitDate = new Date(v.tanggal)
    return visitDate >= startDate && visitDate <= endDate && v.isEmos === true
  })

  return filteredVisits.length
}

export async function getEmosVisitsByPeriod(period = 'daily') {
  const visits = await getAllVisits()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let startDate, endDate

  switch (period) {
    case 'weekly':
      const dayOfWeek = today.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      startDate = new Date(today)
      startDate.setDate(today.getDate() + mondayOffset)
      endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'monthly':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'daily':
    default:
      startDate = today
      endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)
  }

  return visits
    .filter(v => {
      const visitDate = new Date(v.tanggal)
      return visitDate >= startDate && visitDate <= endDate && v.isEmos === true
    })
    .sort((a, b) => b.tanggal - a.tanggal)
}

export { STORES_STORE, VISITS_STORE, AGENDAS_STORE, REMINDERS_STORE, SETTINGS_STORE }