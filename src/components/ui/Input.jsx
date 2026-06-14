import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full h-12 px-4 rounded-xl border bg-white dark:bg-slate-800
          text-gray-900 dark:text-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-slate-600'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input