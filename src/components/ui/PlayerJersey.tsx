'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PlayerJerseyProps {
  player: {
    name: string
    surname: string
    position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward'
    footballLeague?: string
    football_league?: string  // Support snake_case from database
    club?: string
    id?: string
  }
  className?: string
  isSelected?: boolean
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, player: PlayerJerseyProps['player']) => void
  children?: ReactNode
}

export function PlayerJersey({
  player,
  className,
  isSelected = false,
  isDragging = false,
  onDragStart,
  children
}: PlayerJerseyProps) {
  // Position-based border colors
  const getBorderColor = () => {
    switch (player.position) {
      case 'Forward':
        return 'border-[#DECF99]' // Sand Gold
      case 'Midfielder':
      case 'Defender':
        return 'border-[#061852]' // Collegiate Navy
      case 'Goalkeeper':
        return 'border-gray-200' // Neutral Gray
      default:
        return 'border-gray-200'
    }
  }

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, player) : undefined}
      className={cn(
        'relative cursor-move rounded-xl border-2 bg-white transition-all duration-200 hover:shadow-lg group',
        getBorderColor(),
        isSelected && 'shadow-lg',
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100',
        className
      )}
      style={{ width: '140px', height: '120px' }}
    >
      {/* Card Content */}
      <div className="p-3 h-full flex flex-col" style={{ marginTop: '16px' }}>
        {/* Player Name - Consistent Typography */}
        <h3
          className="font-bold text-gray-900 break-words text-center"
          style={{
            fontSize: '13px',
            lineHeight: '1.3',
            minHeight: '2.6em',
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
            hyphens: 'auto'
          }}
        >
          {player.name} {player.surname}
        </h3>

        {/* Club & League Info - Show club primarily, position indicated by border */}
        <div className="text-center space-y-0.5">
          {player.club && (
            <p
              className="text-gray-700 font-medium truncate"
              style={{
                fontSize: '11px',
                lineHeight: '1.3'
              }}
              title={player.club}
            >
              {player.club}
            </p>
          )}
          {(player.footballLeague || player.football_league) && (
            <p
              className="text-gray-500 truncate"
              style={{
                fontSize: '10px',
                lineHeight: '1.3'
              }}
              title={player.footballLeague || player.football_league}
            >
              {player.footballLeague || player.football_league}
            </p>
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#061852] rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-xs">✓</span>
        </div>
      )}

      {children}
    </div>
  )
}

interface JerseyNumberProps {
  number: number | string
  className?: string
}

export function JerseyNumber({ number, className }: JerseyNumberProps) {
  return (
    <div className={cn(
      'absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-sm font-bold text-gray-800 shadow-sm',
      className
    )}>
      {number}
    </div>
  )
}