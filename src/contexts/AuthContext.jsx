import { createContext, useContext, useState, useEffect } from 'react'
import { getStoredUser, getStoredToken, loginAsDemo, logout as authLogout, handleOAuthCallback, isDemoMode, loginWithGoogle } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    initAuth()
  }, [])

  async function initAuth() {
    try {
      console.log('Initializing auth...')

      // Check for OAuth callback (with code parameter)
      const urlParams = new URLSearchParams(window.location.search)
      const hasCode = urlParams.has('code')
      const hasError = urlParams.has('error')

      console.log('URL has code:', hasCode, 'has error:', hasError)

      if (hasError) {
        const error = urlParams.get('error')
        const errorDesc = urlParams.get('error_description')
        console.error('OAuth error:', error, errorDesc)
        setAuthError(errorDesc || error)
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }

      if (hasCode) {
        console.log('Processing OAuth callback...')
        try {
          const result = await handleOAuthCallback()
          console.log('OAuth callback result:', result)

          if (result && result.user) {
            setUser(result.user)
            setToken(getStoredToken())
            console.log('User set from callback:', result.user)
          } else {
            console.error('No user in callback result')
            setAuthError('Gagal mendapatkan data user dari Google')
          }
        } catch (callbackError) {
          console.error('Callback error:', callbackError)
          setAuthError(callbackError.message)
        }
        // Clean URL after processing
        window.history.replaceState({}, document.title, window.location.pathname)
      } else {
        // Check stored session (normal app load)
        console.log('Checking stored session...')
        const storedUser = getStoredUser()
        const storedToken = getStoredToken()

        console.log('Stored user exists:', !!storedUser)
        console.log('Stored token exists:', !!storedToken)

        if (storedUser && storedToken && storedToken !== 'demo-token') {
          setUser(storedUser)
          setToken(storedToken)
          console.log('Restored session for user:', storedUser.name || storedUser.email)
        } else if (storedToken === 'demo-token') {
          setUser(storedUser)
          setToken(storedToken)
          console.log('Demo mode session restored')
        }
      }
    } catch (error) {
      console.error('Auth init error:', error)
      setAuthError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function login() {
    setAuthError(null)
    // Redirect to Google OAuth
    loginWithGoogle()
  }

  function loginDemo() {
    setAuthError(null)
    const demoUser = loginAsDemo()
    setUser(demoUser)
    setToken('demo-token')
  }

  function logout() {
    setAuthError(null)
    authLogout()
    setUser(null)
    setToken(null)
  }

  const value = {
    user,
    token,
    loading,
    authError,
    isDemo: isDemoMode(),
    login,
    loginDemo,
    logout,
    clearError: () => setAuthError(null)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}