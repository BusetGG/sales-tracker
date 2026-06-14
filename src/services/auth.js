// Google OAuth Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || ''
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || window.location.origin

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
].join(' ')

const TOKEN_KEY = 'google_access_token'
const USER_KEY = 'google_user'

// Debug logging
function debug(...args) {
  console.log('[Auth]', ...args)
}

// Generate random string for state parameter
function generateRandomString(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate code verifier for PKCE
function generateCodeVerifier() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Generate code challenge from verifier
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Store auth data
function storeAuthData(token, user) {
  debug('Storing auth data, token length:', token?.length)
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// Clear auth data
function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem('google_refresh_token')
}

// Get stored token
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

// Get stored user
export function getStoredUser() {
  const userStr = localStorage.getItem(USER_KEY)
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

// Check if user is logged in
export function isLoggedIn() {
  return !!getStoredToken()
}

// Initiate Google OAuth login
export async function loginWithGoogle() {
  debug('Starting Google OAuth login')
  debug('Client ID:', GOOGLE_CLIENT_ID)
  debug('Redirect URI:', REDIRECT_URI)

  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID belum dikonfigurasi. Gunakan Mode Demo sebagai alternatif.')
  }

  const state = generateRandomString()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Store for verification
  sessionStorage.setItem('oauth_state', state)
  sessionStorage.setItem('oauth_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent'
  })

  debug('Redirecting to Google OAuth')
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// Handle OAuth callback
export async function handleOAuthCallback() {
  debug('Handling OAuth callback')

  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  const error = urlParams.get('error')
  const errorDesc = urlParams.get('error_description')

  debug('URL params - code:', !!code, 'error:', error, 'errorDesc:', errorDesc)

  if (error) {
    debug('OAuth error:', error, errorDesc)
    throw new Error(errorDesc || error || 'OAuth error')
  }

  if (!code) {
    debug('No authorization code received')
    throw new Error('Tidak ada kode otorisasi dari Google')
  }

  // Verify state
  const storedState = sessionStorage.getItem('oauth_state')
  if (state !== storedState) {
    debug('State mismatch:', state, 'vs', storedState)
    throw new Error('Verifikasi keamanan gagal (state mismatch). Coba login lagi.')
  }

  const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
  if (!codeVerifier) {
    debug('No code verifier found')
    throw new Error('Sesi login tidak valid. Coba login lagi.')
  }

  // Clear session storage
  sessionStorage.removeItem('oauth_state')
  sessionStorage.removeItem('oauth_code_verifier')

  debug('Exchanging code for tokens...')

  // Exchange code for tokens
  const tokenParams = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
    code,
    code_verifier: codeVerifier
  })

  debug('Token request to:', 'https://oauth2.googleapis.com/token')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: tokenParams.toString()
  })

  const responseText = await response.text()
  debug('Token response status:', response.status)

  if (!response.ok) {
    debug('Token exchange failed:', responseText)
    let errorData
    try {
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { error: 'unknown', error_description: responseText }
    }
    throw new Error(errorData.error_description || errorData.error || 'Gagal mendapatkan token akses')
  }

  const tokens = JSON.parse(responseText)
  debug('Token received, access_token length:', tokens.access_token?.length)

  // Fetch user info
  debug('Fetching user info...')
  const user = await fetchUserInfo(tokens.access_token)
  debug('User info received:', user.email)

  // Store auth data
  storeAuthData(tokens.access_token, user)

  // Store refresh token if provided
  if (tokens.refresh_token) {
    debug('Storing refresh token')
    localStorage.setItem('google_refresh_token', tokens.refresh_token)
  }

  return { user, tokens }
}

// Fetch user info from Google
async function fetchUserInfo(accessToken) {
  debug('Fetching user info with token')

  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    debug('User info fetch failed:', errorText)
    throw new Error('Gagal mendapatkan informasi user dari Google')
  }

  return response.json()
}

// Refresh access token
export async function refreshAccessToken() {
  debug('Refreshing access token')

  const refreshToken = localStorage.getItem('google_refresh_token')
  if (!refreshToken) {
    debug('No refresh token available')
    throw new Error('Tidak ada refresh token')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    debug('Token refresh failed')
    clearAuthData()
    throw new Error('Sesi habis, silakan login lagi')
  }

  const tokens = await response.json()
  localStorage.setItem(TOKEN_KEY, tokens.access_token)

  debug('Token refreshed successfully')
  return tokens.access_token
}

// Get current access token (with refresh if needed)
export async function getValidAccessToken() {
  let token = getStoredToken()
  if (!token) {
    debug('No token available')
    throw new Error('Belum login')
  }

  return token
}

// Logout
export function logout() {
  debug('Logging out')
  clearAuthData()
}

// Demo mode - for development without Google OAuth
export function loginAsDemo() {
  debug('Logging in as demo user')
  const demoUser = {
    sub: 'demo-user',
    email: 'demo@sales-tracker.app',
    name: 'Demo Sales',
    picture: null
  }
  storeAuthData('demo-token', demoUser)
  return demoUser
}

export function isDemoMode() {
  return getStoredToken() === 'demo-token'
}