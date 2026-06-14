import { exportAllData, importAllData } from './db'

// Export all data as JSON file
export async function downloadBackup() {
  try {
    const data = await exportAllData()
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const date = new Date().toISOString().split('T')[0]
    const fileName = `sales-tracker-backup-${date}.json`

    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true, fileName }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Import data from JSON file
export async function restoreBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const jsonString = event.target.result
        const data = JSON.parse(jsonString)

        // Validate backup structure
        if (!data.version || !data.data) {
          throw new Error('Invalid backup file format')
        }

        // Validate data integrity
        if (!Array.isArray(data.data.stores)) {
          throw new Error('Invalid stores data')
        }
        if (!Array.isArray(data.data.visits)) {
          throw new Error('Invalid visits data')
        }
        if (!Array.isArray(data.data.agendas)) {
          throw new Error('Invalid agendas data')
        }

        await importAllData(data)

        resolve({
          success: true,
          stats: {
            stores: data.data.stores?.length || 0,
            visits: data.data.visits?.length || 0,
            agendas: data.data.agendas?.length || 0
          }
        })
      } catch (error) {
        reject({ success: false, error: error.message })
      }
    }

    reader.onerror = () => {
      reject({ success: false, error: 'Failed to read file' })
    }

    reader.readAsText(file)
  })
}

// Get backup file info without importing
export function validateBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)

        if (!data.version || !data.data) {
          resolve({ valid: false, error: 'Invalid backup file format' })
          return
        }

        resolve({
          valid: true,
          info: {
            version: data.version,
            exportedAt: data.exportedAt,
            stores: data.data.stores?.length || 0,
            visits: data.data.visits?.length || 0,
            agendas: data.data.agendas?.length || 0
          }
        })
      } catch {
        resolve({ valid: false, error: 'Could not parse JSON file' })
      }
    }

    reader.onerror = () => {
      resolve({ valid: false, error: 'Failed to read file' })
    }

    reader.readAsText(file)
  })
}