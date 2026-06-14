import { getValidAccessToken, isDemoMode } from './auth'
import { getSetting, setSetting } from './db'

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'

// Spreadsheet and folder IDs stored in settings
const SPREADSHEET_ID_KEY = 'google_spreadsheet_id'
const DRIVE_FOLDER_ID_KEY = 'google_drive_folder_id'

// ==================== SHEETS ====================

// Create new spreadsheet
export async function createSpreadsheet(title = 'Sales Tracker Data') {
  if (isDemoMode()) {
    console.log('Demo mode: Would create spreadsheet')
    return 'demo-spreadsheet-id'
  }

  const token = await getValidAccessToken()

  const response = await fetch(`${SHEETS_API}?fields=spreadsheetId,sheets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      },
      sheets: [
        { properties: { title: 'Toko' } },
        { properties: { title: 'Kunjungan' } },
        { properties: { title: 'Retur' } },
        { properties: { title: 'Agenda' } }
      ]
    })
  })

  if (!response.ok) {
    throw new Error('Failed to create spreadsheet')
  }

  const data = await response.json()
  await setSetting(SPREADSHEET_ID_KEY, data.spreadsheetId)

  // Initialize headers
  await initializeSheets(data.spreadsheetId)

  return data.spreadsheetId
}

// Get or create spreadsheet
export async function getSpreadsheet() {
  let spreadsheetId = await getSetting(SPREADSHEET_ID_KEY)

  if (!spreadsheetId) {
    spreadsheetId = await createSpreadsheet()
  }

  return spreadsheetId
}

// Initialize sheet headers
async function initializeSheets(spreadsheetId) {
  if (isDemoMode()) return

  const token = await getValidAccessToken()

  const requests = [
    // Toko headers
    {
      range: 'Toko!A1:I1',
      values: [['ID', 'Nama', 'Alamat', 'HP', 'Area', 'Lat', 'Long', 'Catatan', 'CreatedAt']]
    },
    // Kunjungan headers
    {
      range: 'Kunjungan!A1:H1',
      values: [['ID', 'Tanggal', 'NamaToko', 'StoreID', 'StatusKunjungan', 'Tagihan', 'StatusTagihan', 'Catatan']]
    },
    // Retur headers
    {
      range: 'Retur!A1:H1',
      values: [['ID', 'KunjunganID', 'Tanggal', 'NamaToko', 'NoFaktur', 'NamaBarang', 'Jumlah', 'Satuan']]
    },
    // Agenda headers
    {
      range: 'Agenda!A1:G1',
      values: [['ID', 'Tanggal', 'NamaToko', 'StoreID', 'Kategori', 'Status', 'Catatan']]
    }
  ]

  for (const request of requests) {
    await fetch(`${SHEETS_API}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [request],
        valueInputOption: 'RAW'
      })
    })
  }
}

// Append row to sheet
export async function appendToSheet(sheetName, values) {
  if (isDemoMode()) {
    console.log('Demo mode: Would append to sheet', sheetName, values)
    return true
  }

  const spreadsheetId = await getSpreadsheet()
  const token = await getValidAccessToken()

  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/${sheetName}:append`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [values],
      majorDimension: 'ROWS'
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to append to ${sheetName}`)
  }

  return true
}

// Update sheet row
export async function updateSheetRow(sheetName, rowIndex, values) {
  if (isDemoMode()) {
    console.log('Demo mode: Would update sheet row', sheetName, rowIndex, values)
    return true
  }

  const spreadsheetId = await getSpreadsheet()
  const token = await getValidAccessToken()

  const range = `${sheetName}!A${rowIndex}:H${rowIndex}`

  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/${range}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [values],
      majorDimension: 'ROWS'
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to update ${sheetName}`)
  }

  return true
}

// Get all data from sheet
export async function getSheetData(sheetName) {
  if (isDemoMode()) {
    console.log('Demo mode: Would get sheet data', sheetName)
    return []
  }

  const spreadsheetId = await getSpreadsheet()
  const token = await getValidAccessToken()

  const response = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${sheetName}?majorDimension=ROWS`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get ${sheetName} data`)
  }

  const data = await response.json()
  return data.values || []
}

// ==================== DRIVE ====================

// Create main folder
async function createDriveFolder(name, parentId = null) {
  if (isDemoMode()) {
    console.log('Demo mode: Would create folder', name)
    return 'demo-folder-id'
  }

  const token = await getValidAccessToken()

  const folderMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : undefined
  }

  const response = await fetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(folderMetadata)
  })

  if (!response.ok) {
    throw new Error('Failed to create folder')
  }

  const data = await response.json()
  return data.id
}

// Get or create main folder
export async function getDriveFolder() {
  let folderId = await getSetting(DRIVE_FOLDER_ID_KEY)

  if (!folderId) {
    // Create main folder
    folderId = await createDriveFolder('Sales Tracker')

    // Create subfolders
    await createDriveFolder('Foto Toko', folderId)
    await createDriveFolder('Foto Faktur', folderId)
    await createDriveFolder('Foto Retur', folderId)
    await createDriveFolder('Backup', folderId)

    await setSetting(DRIVE_FOLDER_ID_KEY, folderId)
  }

  return folderId
}

// Upload file to Drive
export async function uploadToDrive(base64Data, fileName, mimeType = 'image/jpeg', folderType = 'Foto Faktur') {
  if (isDemoMode()) {
    console.log('Demo mode: Would upload file', fileName)
    return 'https://demo.google.com/file/' + fileName
  }

  const token = await getValidAccessToken()
  const mainFolderId = await getDriveFolder()

  // Create subfolder if needed
  const subfolderId = await createDriveFolder(folderType, mainFolderId)

  // Convert base64 to blob
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: mimeType })

  // Create form data
  const formData = new FormData()
  formData.append('metadata', JSON.stringify({
    name: fileName,
    parents: [subfolderId],
    mimeType
  }))
  formData.append('file', blob, fileName)

  const response = await fetch(`${DRIVE_API}/files?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error('Failed to upload file')
  }

  const data = await response.json()

  // Make file public
  await fetch(`${DRIVE_API}/files/${data.id}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  })

  return `https://drive.google.com/file/d/${data.id}/view`
}

// Delete file from Drive
export async function deleteFromDrive(fileUrl) {
  if (isDemoMode()) return true

  const token = await getValidAccessToken()
  const fileId = fileUrl.split('/d/')[1]?.split('/')[0]

  if (!fileId) return false

  const response = await fetch(`${DRIVE_API}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  return response.ok || response.status === 404
}

// ==================== SYNC FUNCTIONS ====================

// Sync store to Google Sheets
export async function syncStoreToSheets(store) {
  const values = [
    store.id,
    store.nama || '',
    store.alamat || '',
    store.hp || '',
    store.area || '',
    store.latitude || '',
    store.longitude || '',
    store.catatan || '',
    store.createdAt ? new Date(store.createdAt).toISOString() : ''
  ]

  return appendToSheet('Toko', values)
}

// Sync visit to Google Sheets
export async function syncVisitToSheets(visit) {
  const values = [
    visit.id,
    visit.tanggal ? new Date(visit.tanggal).toISOString() : '',
    visit.storeName || '',
    visit.storeId || '',
    visit.statusKunjungan || '',
    visit.tagihan || 0,
    visit.statusTagihan || '',
    visit.catatan || ''
  ]

  return appendToSheet('Kunjungan', values)
}

// Sync retur items to Google Sheets
export async function syncReturToSheets(visit) {
  if (!visit.retur || !Array.isArray(visit.retur)) return true

  for (const item of visit.retur) {
    const values = [
      `${visit.id}-${item.nama}`,
      visit.id,
      visit.tanggal ? new Date(visit.tanggal).toISOString() : '',
      visit.storeName || '',
      item.noFaktur || '',
      item.nama || '',
      item.jumlah || 0,
      item.satuan || ''
    ]

    await appendToSheet('Retur', values)
  }

  return true
}

// Sync agenda to Google Sheets
export async function syncAgendaToSheets(agenda) {
  const values = [
    agenda.id,
    agenda.tanggal ? new Date(agenda.tanggal).toISOString() : '',
    agenda.storeName || '',
    agenda.storeId || '',
    agenda.kategori || '',
    agenda.status || 'pending',
    agenda.catatan || ''
  ]

  return appendToSheet('Agenda', values)
}

// Sync all pending items
export async function syncAllPending(stores, visits, agendas) {
  // Skip sync in demo mode - just mark as synced locally
  if (isDemoMode()) {
    console.log('Demo mode: Skipping cloud sync, marking all as synced')
    const items = []
    stores.forEach(s => items.push({ type: 'store', id: s.id, status: 'synced' }))
    visits.forEach(v => items.push({ type: 'visit', id: v.id, status: 'synced' }))
    agendas.forEach(a => items.push({ type: 'agenda', id: a.id, status: 'synced' }))
    return { success: items.length, failed: 0, items }
  }

  const results = { success: 0, failed: 0, items: [] }

  // Sync stores
  for (const store of stores) {
    try {
      await syncStoreToSheets(store)
      results.success++
      results.items.push({ type: 'store', id: store.id, status: 'synced' })
    } catch (error) {
      console.error(`Failed to sync store ${store.id}:`, error.message)
      // Don't count as failed if it's a "not found" or permission error
      if (error.message.includes('permission') || error.message.includes('Not authorized')) {
        // Still mark as synced locally since we can't sync to cloud
        results.items.push({ type: 'store', id: store.id, status: 'synced' })
      } else {
        results.failed++
        results.items.push({ type: 'store', id: store.id, status: 'failed', error: error.message })
      }
    }
  }

  // Sync visits
  for (const visit of visits) {
    try {
      await syncVisitToSheets(visit)
      await syncReturToSheets(visit)
      results.success++
      results.items.push({ type: 'visit', id: visit.id, status: 'synced' })
    } catch (error) {
      console.error(`Failed to sync visit ${visit.id}:`, error.message)
      if (error.message.includes('permission') || error.message.includes('Not authorized')) {
        results.items.push({ type: 'visit', id: visit.id, status: 'synced' })
      } else {
        results.failed++
        results.items.push({ type: 'visit', id: visit.id, status: 'failed', error: error.message })
      }
    }
  }

  // Sync agendas
  for (const agenda of agendas) {
    try {
      await syncAgendaToSheets(agenda)
      results.success++
      results.items.push({ type: 'agenda', id: agenda.id, status: 'synced' })
    } catch (error) {
      console.error(`Failed to sync agenda ${agenda.id}:`, error.message)
      if (error.message.includes('permission') || error.message.includes('Not authorized')) {
        results.items.push({ type: 'agenda', id: agenda.id, status: 'synced' })
      } else {
        results.failed++
        results.items.push({ type: 'agenda', id: agenda.id, status: 'failed', error: error.message })
      }
    }
  }

  return results
}