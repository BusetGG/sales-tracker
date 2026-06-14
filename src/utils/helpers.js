// Generate UUID
export function generateId() {
  return crypto.randomUUID?.() ||
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
}

// Format currency (Indonesian Rupiah)
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Format date for display
export function formatDate(date, options = {}) {
  if (!date) return ''
  const d = new Date(date)

  if (options.iso) {
    return d.toISOString().split('T')[0]
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  }).format(d)
}

// Format time
export function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

// Format date and time
export function formatDateTime(date) {
  if (!date) return ''
  return `${formatDate(date)} ${formatTime(date)}`
}

// Get relative time (e.g., "2 jam lalu")
export function getRelativeTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  return formatDate(date)
}

// Compress image
export async function compressImage(file, maxWidth = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve(reader.result)
            }
            reader.onerror = reject
            reader.readAsDataURL(blob)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Get current location
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

// Open URL in browser
export function openUrl(url) {
  window.open(url, '_blank')
}

// Open Google Maps
export function openGoogleMaps(latitude, longitude, label = '') {
  if (latitude && longitude) {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    if (label) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank')
    } else {
      window.open(url, '_blank')
    }
  }
}

// Open WhatsApp
export function openWhatsApp(phone, message = '') {
  const cleanPhone = phone?.replace(/\D/g, '') || ''
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
  const url = message
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${formattedPhone}`
  window.open(url, '_blank')
}

// Open phone dialer
export function openPhone(phone) {
  window.location.href = `tel:${phone}`
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  }
}

// Share via Web Share API
export async function shareText(title, text) {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text
      })
      return true
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error
      }
      return false
    }
  }
  return false
}

// Debounce function
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Check online status
export function isOnline() {
  return navigator.onLine
}

// Get greeting based on time
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

// Status labels
export const STATUS_KUNJUNGAN = {
  dikunjungi: 'Dikunjungi',
  tutup: 'Tutup',
  tidak_ada: 'Pemilik Tidak Ada'
}

export const STATUS_TAGIHAN = {
  lunas: 'Lunas',
  sebagian: 'Sebagian',
  belum_bayar: 'Belum Bayar'
}

export const KATEGORI_AGENDA = {
  janji_bayar: 'Janji Bayar',
  follow_up: 'Follow Up',
  ambil_retur: 'Ambil Retur',
  lainnya: 'Lainnya'
}

export const STATUS_AGENDA = {
  pending: 'Pending',
  done: 'Selesai'
}