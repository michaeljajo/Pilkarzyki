'use client'

import { HTMLAttributes, forwardRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
  autoDismiss?: boolean
  autoDismissDelay?: number
  icon?: React.ReactNode
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({
    className,
    variant = 'info',
    title,
    dismissible = false,
    onDismiss,
    autoDismiss = false,
    autoDismissDelay = 5000,
    icon,
    children,
    onDrag,
    onDragStart,
    onDragEnd,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
      if (autoDismiss && autoDismissDelay) {
        const timer = setTimeout(() => {
          handleDismiss()
        }, autoDismissDelay)
        return () => clearTimeout(timer)
      }
    }, [autoDismiss, autoDismissDelay])

    const handleDismiss = () => {
      setIsVisible(false)
      setTimeout(() => {
        onDismiss?.()
      }, 300)
    }

    const variants = {
      success: {
        container: 'bg-[var(--success)]/10 border-[var(--success)]/30',
        icon: 'text-[var(--success)]',
        title: 'text-[var(--success)]',
        text: 'text-[var(--success)]/90',
        defaultIcon: CheckCircle,
      },
      error: {
        container: 'bg-[var(--danger)]/10 border-[var(--danger)]/30',
        icon: 'text-[var(--danger)]',
        title: 'text-[var(--danger)]',
        text: 'text-[var(--danger)]/90',
        defaultIcon: AlertCircle,
      },
      warning: {
        container: 'bg-[var(--warning)]/10 border-[var(--warning)]/30',
        icon: 'text-[var(--warning)]',
        title: 'text-[var(--warning)]',
        text: 'text-[var(--warning)]/90',
        defaultIcon: AlertTriangle,
      },
      info: {
        container: 'bg-[var(--info)]/10 border-[var(--info)]/30',
        icon: 'text-[var(--info)]',
        title: 'text-[var(--info)]',
        text: 'text-[var(--info)]/90',
        defaultIcon: Info,
      },
    }

    const variantStyles = variants[variant]
    const IconComponent = variantStyles.defaultIcon

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div
              ref={ref}
              className={cn(
                'relative rounded-xl border backdrop-blur-sm p-4',
                'shadow-lg',
                variantStyles.container,
                className
              )}
              {...props}
            >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn('flex-shrink-0 mt-0.5', variantStyles.icon)}>
                {icon || <IconComponent size={20} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {title && (
                  <h4 className={cn('text-sm font-semibold mb-1', variantStyles.title)}>
                    {title}
                  </h4>
                )}
                <div className={cn('text-sm', variantStyles.text)}>
                  {children}
                </div>
              </div>

              {/* Dismiss Button */}
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className={cn(
                    'flex-shrink-0 rounded-md p-1 transition-colors',
                    'hover:bg-black/10',
                    variantStyles.icon
                  )}
                  aria-label="Zamknij"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

Alert.displayName = 'Alert'

export { Alert }
export type { AlertProps }
