import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const variants = {
      primary:   'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50',
      danger:    'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
      warning:   'bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-yellow-300',
      ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 disabled:opacity-50',
      outline:   'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-sm',
    }
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1',
          variants[variant], sizes[size],
          disabled && 'cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
