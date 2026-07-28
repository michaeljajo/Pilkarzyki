'use client'

import { ReactNode, useEffect } from 'react'
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

/**
 * Plain, fully-opaque modal. Previously animated with framer-motion, whose
 * spring fade could leave the panel stuck part-way (the "grey on grey, ~30%
 * opacity" bug) and kept the compositor busy. Colours are explicit (white panel,
 * dark text) rather than theme CSS variables, which invert under the root
 * `dark` class and made the text illegible on the white panel.
 */
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
  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200',
          'max-h-[90vh] flex flex-col',
          sizeClasses[size]
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {icon && <div className="flex-shrink-0 mt-0.5 text-[#29544D]">{icon}</div>}
              <div className="flex-1 min-w-0">
                {title && <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>}
                {description && <p className="text-sm text-gray-600">{description}</p>}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29544D]"
                aria-label="Zamknij okno"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {footer && <div className="p-6 border-t border-gray-200 bg-gray-50">{footer}</div>}
      </div>
    </div>
  )
}
