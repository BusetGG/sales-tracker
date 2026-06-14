import { forwardRef } from 'react'

const Card = forwardRef(({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-800 rounded-2xl shadow-sm
        border border-gray-100 dark:border-slate-700
        ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export default Card