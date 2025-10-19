'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface ChipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDelete'> {
  variant?: 'default' | 'goalkeeper' | 'defender' | 'midfielder' | 'forward'
  onDelete?: () => void
  icon?: React.ReactNode
}

const Chip = forwardRef<HTMLDivElement, ChipProps>(
  ({ className, variant = 'default', onDelete, icon, children, onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, onAnimationIteration, ...props }, ref) => {
    const baseClasses = cn(
      'inline-flex items-center gap-1.5',
      'px-3 py-1.5 rounded-full',
      'font-medium text-sm',
      'transition-all duration-200',
      'hover:scale-105'
    )

    const variants = {
      default: 'bg-[var(--background-tertiary)] text-[var(--foreground)] border border-[var(--navy-border)]',
      goalkeeper: 'bg-[var(--goalkeeper)] text-[var(--collegiate-navy)] shadow-sm',
      defender: 'bg-[var(--defender)] text-[var(--off-white)] shadow-sm',
      midfielder: 'bg-[var(--midfielder)] text-[var(--off-white)] shadow-sm',
      forward: 'bg-[var(--forward)] text-[var(--off-white)] shadow-sm',
    }

    return (
      <motion.div
        ref={ref}
        className={cn(baseClasses, variants[variant], className)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="flex-shrink-0">{children}</span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="flex-shrink-0 ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            aria-label="Remove"
          >
            <X size={14} />
          </button>
        )}
      </motion.div>
    )
  }
)

Chip.displayName = 'Chip'

export { Chip }
export type { ChipProps }