import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-primary-200 dark:border-primary-800 animate-spin border-t-primary" />
        <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
      </div>
      <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Memuat...</p>
    </div>
  )
}