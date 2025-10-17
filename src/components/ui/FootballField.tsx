'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface FootballFieldProps {
  children?: ReactNode
  className?: string
  showPositions?: boolean
}

interface PositionSlotProps {
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  children?: ReactNode
  className?: string
  onClick?: () => void
}

export function FootballField({ children, className, showPositions = false }: FootballFieldProps) {
  return (
    <div className={cn('relative w-full max-w-sm mx-auto', className)}>
      {/* Football Field SVG - Half pitch (attacking half only) */}
      <svg
        viewBox="0 0 200 160"
        className="w-full h-auto rounded-lg shadow-lg border-2 border-white"
        style={{ aspectRatio: '5/4' }}
      >
        {/* Field markings */}
        <defs>
          <pattern id="grass" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect width="20" height="20" fill="#009f4d"/>
            <rect width="20" height="20" fill="#007a3d" opacity="0.1"/>
          </pattern>
        </defs>

        {/* Grass texture */}
        <rect width="200" height="160" fill="#009f4d" />

        {/* Field lines */}
        <g stroke="white" strokeWidth="2" fill="none">
          {/* Outer boundary (top and sides only) */}
          <line x1="10" y1="10" x2="190" y2="10" />
          <line x1="10" y1="10" x2="10" y2="150" />
          <line x1="190" y1="10" x2="190" y2="150" />

          {/* Halfway line (bottom of visible area) */}
          <line x1="10" y1="150" x2="190" y2="150" />

          {/* Half of center circle */}
          <path d="M 75,150 A 25,25 0 0,1 125,150" />

          {/* Goal area */}
          <rect x="60" y="10" width="80" height="30" />

          {/* Penalty area */}
          <rect x="40" y="10" width="120" height="50" />

          {/* Goal */}
          <rect x="75" y="5" width="50" height="10" fill="white" stroke="white" strokeWidth="1" />
        </g>

        {/* Corner arcs */}
        <g stroke="white" strokeWidth="2" fill="none">
          <path d="M 10,15 Q 10,10 15,10" />
          <path d="M 190,15 Q 190,10 185,10" />
        </g>

        {/* Center spot (on halfway line) */}
        <circle cx="100" cy="150" r="2" fill="white" />
      </svg>

      {/* Position overlays - Half pitch layout */}
      {showPositions && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Defender positions (near halfway line) */}
          <div className="absolute left-[30%] top-[85%] w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white pointer-events-auto">
            DEF
          </div>
          <div className="absolute left-[60%] top-[85%] w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white pointer-events-auto">
            DEF
          </div>

          {/* Midfielder positions */}
          <div className="absolute left-[35%] top-[55%] w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white pointer-events-auto">
            MID
          </div>
          <div className="absolute left-[55%] top-[55%] w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white pointer-events-auto">
            MID
          </div>

          {/* Forward positions (near goal) */}
          <div className="absolute left-[40%] top-[25%] w-8 h-8 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white pointer-events-auto">
            FWD
          </div>
          <div className="absolute left-[50%] top-[25%] w-8 h-8 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white pointer-events-auto">
            FWD
          </div>
        </div>
      )}

      {/* Custom children overlay */}
      {children && (
        <div className="absolute inset-0">
          {children}
        </div>
      )}
    </div>
  )
}

export function PositionSlot({ position, children, className, onClick }: PositionSlotProps) {
  const positionColors = {
    GK: 'bg-yellow-400 text-black',
    DEF: 'bg-blue-500 text-white',
    MID: 'bg-green-500 text-white',
    FWD: 'bg-red-500 text-white'
  }

  const positionNames = {
    GK: 'Goalkeeper',
    DEF: 'Defender',
    MID: 'Midfielder',
    FWD: 'Forward'
  }

  return (
    <div
      className={cn(
        'relative w-16 h-16 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold cursor-pointer transition-transform duration-200 hover:scale-110 shadow-lg',
        positionColors[position],
        className
      )}
      onClick={onClick}
      title={positionNames[position]}
    >
      {children || position}
    </div>
  )
}