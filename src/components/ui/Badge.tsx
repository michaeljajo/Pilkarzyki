'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', animated = false, children, onDrag, onDragStart, onDragEnd, ...props }, ref) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center',
      'font-semibold rounded-full',
      'transition-all duration-200',
      'whitespace-nowrap'
    )

    const variants = {
      default: 'bg-gray-100 text-gray-700',
      success: 'bg-[#10B981] text-white',
      warning: 'bg-[#F59E0B] text-white',
      danger: 'bg-[#EF4444] text-white',
      info: 'bg-[#3B82F6] text-white',
      outline: 'border-2 border-[#29544D] text-[#29544D] bg-transparent',
    }

    const sizes = {
      sm: 'py-0.5 text-xs',
      md: 'py-1 text-sm',
      lg: 'py-1.5 text-base',
    }

    const sizeStyles = {
      sm: { paddingLeft: '0.875em', paddingRight: '0.875em', gap: '0.5em' },
      md: { paddingLeft: '1em', paddingRight: '1em', gap: '0.5em' },
      lg: { paddingLeft: '1.25em', paddingRight: '1.25em', gap: '0.5em' },
    }

    if (animated) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div
            ref={ref}
            className={cn(baseClasses, variants[variant], sizes[size], className)}
            style={sizeStyles[size]}
            {...props}
          >
            {children}
          </div>
        </motion.div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        style={sizeStyles[size]}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
export type { BadgeProps }