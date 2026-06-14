import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import { ShoppingBag, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login, loginDemo, authError, clearError } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sync auth error from context
  useEffect(() => {
    if (authError) {
      setError(authError)
      clearError()
    }
  }, [authError, clearError])

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    try {
      await login()
      // Note: login() redirects, so loading won't reset here normally
    } catch (err) {
      setError('Gagal masuk dengan Google. Silakan coba lagi.')
      setLoading(false)
    }
  }

  function handleDemoLogin() {
    setLoading(true)
    setError('')
    try {
      loginDemo()
    } catch (err) {
      setError('Gagal masuk mode demo. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8">
        <ShoppingBag className="w-12 h-12 text-primary" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-2 text-center">
        Sales Tracker
      </h1>
      <p className="text-primary-200 text-center mb-12">
        Personal Edition
      </p>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
          Masuk ke Akun Anda
        </h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          Gunakan akun Google untuk sinkronisasi data
        </p>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Login Gagal</p>
              <p className="text-xs mt-1 opacity-80">{error}</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleGoogleLogin}
          loading={loading}
          className="w-full h-12"
          size="lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Masuk dengan Google
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">atau</span>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full"
        >
          Mode Demo
        </Button>

        <p className="text-xs text-gray-400 text-center mt-6">
          Dengan masuk, Anda menyetujui{' '}
          <a href="#" className="text-primary hover:underline">Syarat & Ketentuan</a>
          {' '}kami
        </p>
      </div>

      {/* Footer */}
      <p className="text-primary-200 text-xs mt-8 text-center">
        Versi 1.0.0 • Offline-First PWA
      </p>
    </div>
  )
}