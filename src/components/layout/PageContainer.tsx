/**
 * PageContainer - Standard Layout Wrapper
 *
 * Applies consistent spacing from the Style Guide across all pages:
 * - Horizontal padding: 48px fixed (matches Style Guide exactly)
 * - Vertical padding: 64px top, 96px bottom
 * - Max width: 1400px centered
 *
 * Usage:
 * ```tsx
 * <PageContainer>
 *   <PageHeader title="Page Title" description="Description" />
 *   <PageSection>Content</PageSection>
 * </PageContainer>
 * ```
 */

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PageContainerProps {
  children: ReactNode
  className?: string
  /** Remove vertical padding (useful for full-bleed layouts) */
  noPaddingY?: boolean
  /** Remove horizontal padding (use with caution) */
  noPaddingX?: boolean
  /** Custom max-width (defaults to 1400px like Style Guide) */
  maxWidth?: string
}

export function PageContainer({
  children,
  className,
  noPaddingY = false,
  noPaddingX = false,
  maxWidth = '1400px'
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        !noPaddingY && 'pt-16 pb-24',
        className
      )}
      style={{
        maxWidth,
        paddingLeft: noPaddingX ? undefined : '48px',
        paddingRight: noPaddingX ? undefined : '48px'
      }}
    >
      {children}
    </div>
  )
}

/**
 * PageHeader - Standard page header with consistent spacing
 *
 * Spacing: 48px below header (matches Style Guide section header spacing)
 */
interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-12', className)}>
      <div className="flex justify-between items-start gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  )
}

/**
 * PageSection - Standard section wrapper with consistent spacing
 *
 * Spacing: 80px between major sections (Style Guide standard)
 */
interface PageSectionProps {
  children: ReactNode
  className?: string
  /** Reduce spacing to 64px for less prominent sections */
  compact?: boolean
}

export function PageSection({ children, className, compact = false }: PageSectionProps) {
  return (
    <section className={cn(compact ? 'mb-16' : 'mb-20', className)}>
      {children}
    </section>
  )
}

/**
 * SectionHeader - Subsection header with consistent spacing
 *
 * Spacing: 48px below subsection header, 16px internal spacing
 */
interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
}

export function SectionHeader({ title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-12', className)}>
      <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-base text-gray-600 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

/**
 * SubsectionHeader - Smaller subsection header
 *
 * Spacing: 24px below (Style Guide subsection spacing)
 */
interface SubsectionHeaderProps {
  title: string
  className?: string
}

export function SubsectionHeader({ title, className }: SubsectionHeaderProps) {
  return (
    <h3 className={cn('text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6', className)}>
      {title}
    </h3>
  )
}

/**
 * CardGrid - Standard grid layout with Style Guide spacing
 *
 * Gap: 32px columns, 32px rows (Style Guide card grid standard)
 */
interface CardGridProps {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4
  className?: string
  /** Use 24px gaps for denser layouts */
  compact?: boolean
}

export function CardGrid({ children, cols = 3, className, compact = false }: CardGridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div
      className={cn('grid', colsClass[cols], className)}
      style={{ columnGap: compact ? '24px' : '32px', rowGap: compact ? '24px' : '32px' }}
    >
      {children}
    </div>
  )
}
