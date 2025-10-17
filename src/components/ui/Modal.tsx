'use client'

import { Fragment, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl mx-4',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}: ModalProps) {
  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className={cn(
                'relative w-full glass-light rounded-2xl shadow-2xl',
                'border border-[var(--navy-border)]',
                'pointer-events-auto',
                'max-h-[90vh] flex flex-col',
                sizeClasses[size]
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between p-6 border-b border-[var(--navy-border)]">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {icon && (
                      <div className="flex-shrink-0 mt-0.5 text-[var(--mineral-green)]">
                        {icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {title && (
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p className="text-sm text-[var(--foreground-secondary)]">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className={cn(
                        'flex-shrink-0 rounded-lg p-1.5 transition-colors',
                        'text-[var(--foreground-secondary)]',
                        'hover:bg-[var(--background-secondary)]',
                        'hover:text-[var(--foreground)]',
                        'focus:outline-none focus-visible:ring-2',
                        'focus-visible:ring-[var(--mineral-green)]'
                      )}
                      aria-label="Zamknij okno"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="p-6 border-t border-[var(--navy-border)] bg-[var(--background-secondary)]/50">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  )
}
