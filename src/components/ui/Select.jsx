import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Pilih...',
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
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full h-12 px-4 pr-10 rounded-xl border bg-white dark:bg-slate-800
            text-gray-900 dark:text-white appearance-none
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            transition-all
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-slate-600'}
            ${className}
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select