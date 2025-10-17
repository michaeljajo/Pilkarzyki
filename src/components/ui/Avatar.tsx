'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { cn } from '@/utils/cn'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status?: 'online' | 'offline' | 'busy' | 'away'
  showStatus?: boolean
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
}

const statusColors = {
  online: 'bg-[var(--success)]',
  offline: 'bg-[var(--foreground-tertiary)]',
  busy: 'bg-[var(--danger)]',
  away: 'bg-[var(--warning)]',
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({
    className,
    src,
    alt,
    fallback,
    size = 'md',
    status,
    showStatus = false,
    ...props
  }, ref) => {
    // Get initials from fallback text
    const getInitials = (text?: string) => {
      if (!text) return '?'
      const words = text.trim().split(' ')
      if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase()
      }
      return text.substring(0, 2).toUpperCase()
    }

    const initials = getInitials(fallback || alt)

    return (
      <div ref={ref} className="relative inline-block" {...props}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={cn(
            'relative rounded-full overflow-hidden',
            'bg-gradient-to-br from-[var(--mineral-green)] to-[var(--bright-teal)]',
            'flex items-center justify-center',
            'font-semibold text-white',
            sizeClasses[size],
            className
          )}
        >
          {src ? (
            <img
              src={src}
              alt={alt || 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="select-none">
              {fallback ? initials : <User size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />}
            </span>
          )}
        </motion.div>

        {/* Status Indicator */}
        {showStatus && status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-2 border-[var(--background)]',
              statusColors[status],
              size === 'xs' ? 'w-2 h-2' :
              size === 'sm' ? 'w-2.5 h-2.5' :
              size === 'md' ? 'w-3 h-3' :
              size === 'lg' ? 'w-3.5 h-3.5' :
              size === 'xl' ? 'w-4 h-4' :
              'w-5 h-5'
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar }
export type { AvatarProps }
