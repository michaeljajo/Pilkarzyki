'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helper?: string
  fullWidth?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    label,
    error,
    helper,
    fullWidth = false,
    id,
    children,
    ...props
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}

        {/* Select Container */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-12 rounded-xl appearance-none',
              'bg-white text-gray-900',
              'border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
              'cursor-pointer',
              error
                ? 'border-2 border-[#EF4444] focus:ring-[#EF4444]'
                : 'border border-gray-300 focus:ring-[#29544D]',
              className
            )}
            style={{ paddingLeft: '1.25em', paddingRight: '2.5em' }}
            {...props}
          >
            {children}
          </select>

          {/* Chevron Icon */}
          <div className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ right: '1.25em' }}>
            <ChevronDown size={20} />
          </div>
        </div>

        {/* Helper or Error Text */}
        {(error || helper) && (
          <p
            className={cn(
              'text-sm',
              error ? 'text-[#EF4444]' : 'text-gray-600'
            )}
          >
            {error || helper}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
export type { SelectProps }
