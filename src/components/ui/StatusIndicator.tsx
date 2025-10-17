'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, Lock, Unlock } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StatusIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  status: 'success' | 'error' | 'warning' | 'info' | 'locked' | 'unlocked'
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const StatusIndicator = forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, showIcon = true, size = 'md', children, ...props }, ref) => {
    const icons = {
      success: CheckCircle2,
      error: XCircle,
      warning: AlertCircle,
      info: Info,
      locked: Lock,
      unlocked: Unlock,
    }

    const Icon = icons[status]

    const baseClasses = cn(
      'inline-flex items-center gap-2',
      'rounded-lg px-3 py-2',
      'font-medium',
      'transition-all duration-200'
    )

    const variants = {
      success: 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20',
      error: 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20',
      warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20',
      info: 'bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20',
      locked: 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20',
      unlocked: 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20',
    }

    const sizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    }

    const iconSizes = {
      sm: 14,
      md: 16,
      lg: 20,
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variants[status], sizes[size], className)}
        {...props}
      >
        {showIcon && <Icon size={iconSizes[size]} className="flex-shrink-0" />}
        {children && <span className="flex-shrink-0">{children}</span>}
      </div>
    )
  }
)

StatusIndicator.displayName = 'StatusIndicator'

export { StatusIndicator }
export type { StatusIndicatorProps }