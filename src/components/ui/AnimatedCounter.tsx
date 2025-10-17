'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/utils/cn'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  suffix?: string
  prefix?: string
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  suffix = '',
  prefix = ''
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)
    let startTime: number | null = null
    const startValue = displayValue

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime
      }

      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3)

      const currentValue = Math.floor(
        startValue + (value - startValue) * easedProgress
      )

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span
      className={cn(
        'transition-all duration-200',
        isAnimating && 'animate-counter-bounce',
        className
      )}
    >
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  suffix?: string
  prefix?: string
  className?: string
}

export function AnimatedStatCard({
  title,
  value,
  icon,
  trend = 'neutral',
  suffix,
  prefix,
  className
}: StatCardProps) {
  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-navy-600 bg-navy-50'
  }

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  }

  return (
    <div className={cn(
      'bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover-lift',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy-700 uppercase tracking-wide">
          {title}
        </h3>
        {icon && (
          <div className="text-2xl">{icon}</div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold text-navy-900 mb-1">
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
            />
          </div>

          <div className={cn(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            trendColors[trend]
          )}>
            <span className="mr-1">{trendIcons[trend]}</span>
            {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
          </div>
        </div>
      </div>
    </div>
  )
}