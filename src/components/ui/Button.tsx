'use client'

import { ButtonHTMLAttributes, forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    iconPosition = 'left',
    fullWidth,
    children,
    disabled,
    onClick,
    ...props
  }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return

      // Create ripple effect
      const button = e.currentTarget
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()

      setRipples((prev) => [...prev, { x, y, id }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
      }, 600)

      onClick?.(e)
    }

    const baseClasses = cn(
      'relative inline-flex items-center justify-center',
      'font-medium overflow-hidden whitespace-nowrap',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-30 disabled:cursor-not-allowed',
      'active:scale-[0.98]',
      fullWidth && 'w-full'
    )

    const variants = {
      primary: cn(
        'bg-[#29544D] text-white',
        'hover:bg-[#1f3f3a]',
        'focus:ring-[#29544D]',
        'shadow-sm hover:shadow-md'
      ),
      secondary: cn(
        'bg-[#061852] text-white',
        'hover:bg-[#0a2475]',
        'focus:ring-[#061852]',
        'shadow-sm hover:shadow-md'
      ),
      danger: cn(
        'bg-[#EF4444] text-white',
        'hover:bg-[#DC2626]',
        'focus:ring-[#EF4444]',
        'shadow-sm hover:shadow-md'
      ),
      success: cn(
        'bg-[#10B981] text-white',
        'hover:bg-[#059669]',
        'focus:ring-[#10B981]',
        'shadow-sm hover:shadow-md'
      ),
      ghost: cn(
        'text-gray-700 bg-transparent',
        'hover:bg-gray-100',
        'focus:ring-gray-300'
      ),
      outline: cn(
        'border border-[#061852]/20 text-[#061852] bg-white',
        'hover:bg-gray-50 hover:border-[#061852]/40',
        'focus:ring-[#061852]',
        'shadow-sm hover:shadow-md'
      ),
    }

    const sizes = {
      sm: 'min-h-[36px] py-2 text-xs rounded-lg',
      md: 'min-h-[44px] py-3 text-sm rounded-xl',
      lg: 'min-h-[52px] py-4 text-base rounded-xl',
      icon: 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl p-0',
    }

    const sizeStyles = {
      sm: { paddingLeft: '1.5em', paddingRight: '1.5em', gap: icon ? '0.75em' : undefined },
      md: { paddingLeft: '2em', paddingRight: '2em', gap: icon ? '0.75em' : undefined },
      lg: { paddingLeft: '2.5em', paddingRight: '2.5em', gap: icon ? '0.75em' : undefined },
      icon: {},
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        style={sizeStyles[size]}
        disabled={disabled || loading}
        onClick={handleClick}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        {...props}
      >
        {/* Ripple Effect */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute w-4 h-4 bg-white/30 rounded-full pointer-events-none animate-[ripple_0.6s_ease-out]"
            style={{
              left: ripple.x - 8,
              top: ripple.y - 8,
            }}
          />
        ))}

        {/* Loading Spinner */}
        {loading && (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
        )}

        {/* Icon Left */}
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}

        {/* Children */}
        {children && <span className="flex-shrink-0">{children}</span>}

        {/* Icon Right */}
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }