'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    fullWidth = false,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ left: '1.25em' }}>
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-12 rounded-xl',
              'bg-white text-gray-900',
              'border transition-all duration-200',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
              error
                ? 'border-2 border-[#EF4444] focus:ring-[#EF4444]'
                : 'border border-gray-300 focus:ring-[#29544D]',
              className
            )}
            style={{
              paddingLeft: leftIcon ? '3em' : '1.25em',
              paddingRight: rightIcon ? '3em' : '1.25em'
            }}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ right: '1.25em' }}>
              {rightIcon}
            </div>
          )}
        </div>

        {/* Helper or Error Text */}
        {(error || helper) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'text-sm',
              error ? 'text-[#EF4444]' : 'text-gray-600'
            )}
          >
            {error || helper}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }
