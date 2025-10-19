'use client'

import { HTMLAttributes, forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover3d?: boolean
  glass?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover3d = false, glass = false, onMouseMove, onMouseLeave, children, onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, onAnimationIteration, ...props }, ref) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hover3d) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) / 20
      const y = (e.clientY - rect.top - rect.height / 2) / 20

      setMousePosition({ x, y })
      setIsHovered(true)

      onMouseMove?.(e)
    }

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      setMousePosition({ x: 0, y: 0 })
      setIsHovered(false)
      onMouseLeave?.(e)
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-2xl border border-gray-200',
          'transition-all duration-200',
          glass
            ? 'bg-white/90 backdrop-blur-sm shadow-lg'
            : 'bg-white shadow-lg',
          'hover:shadow-xl',
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          hover3d && isHovered
            ? {
                transform: `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg) translateY(-4px)`,
                transformStyle: 'preserve-3d',
              }
            : undefined
        }
        animate={
          hover3d && isHovered
            ? {
                scale: 1.02,
              }
            : {
                scale: 1,
              }
        }
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col',
        'border-b border-gray-200',
        className
      )}
      style={{ padding: '24px', gap: '12px', ...style }}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, style, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'font-bold text-gray-900',
        className
      )}
      style={{ fontSize: '32px', lineHeight: '1.3', ...style }}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, style, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-gray-600',
        className
      )}
      style={{ fontSize: '15px', lineHeight: '1.6', ...style }}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(className)}
      style={{ padding: '24px', ...style }}
      {...props}
    />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center', className)}
      style={{ paddingLeft: '24px', paddingRight: '24px', paddingBottom: '24px', paddingTop: 0, ...style }}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
}
export type { CardProps }