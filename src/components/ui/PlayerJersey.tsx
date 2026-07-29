'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { LeagueFlag, hasLeagueFlag } from '@/components/ui/LeagueFlag'

/**
 * One jersey size, used everywhere — bench pool, pitch slots and empty drop
 * zones. Exported so callers size their placeholders identically instead of
 * hard-coding their own numbers (the pitch used to render these inside a
 * `transform: scale(0.85)` wrapper, which made pitch jerseys visibly smaller
 * than bench ones). Width is set so a typical full name fits on one line at
 * 13px, while still leaving the three pitch slots clear of each other.
 */
export const JERSEY_WIDTH = '160px'
export const JERSEY_HEIGHT = '96px'

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
  const fullName = [player.name, player.surname].filter(Boolean).join(' ')

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
      style={{ width: JERSEY_WIDTH, height: JERSEY_HEIGHT }}
    >
      {/* Single-line name. The card is sized so a typical "Firstname Surname" fits
          at 13px without wrapping; anything longer ends in an ellipsis with the
          full name on hover, which beats a ragged two-line block. Content is
          centred vertically so cards with and without a club still match. */}
      {/* `m-0` on the children is load-bearing: globals.css styles h1–h6 and p for
          prose, so the name carried a 24px bottom margin and the club a 16px one.
          Those margins — not the flex gap — were what pinned the name to the top
          edge and blew the block apart. With them gone, py-2.5 gives the card real
          breathing room top and bottom while gap-1 keeps the three lines tight. */}
      <div className="px-2.5 py-2.5 h-full flex flex-col items-center justify-center gap-1">
        <h3
          className="font-semibold text-[#111827] text-center w-full truncate m-0"
          style={{ fontSize: '13px', lineHeight: '1.3', hyphens: 'none' }}
          title={fullName}
        >
          {fullName}
        </h3>

        {/* Club & League Info - Show club primarily, position indicated by border */}
        {player.club && (
          <p
            className="text-[#6B7280] truncate text-center w-full m-0"
            style={{ fontSize: '11px', lineHeight: '1.3' }}
            title={player.club}
          >
            {player.club}
          </p>
        )}
        {(() => {
          const league = player.footballLeague || player.football_league
          if (!league) return null
          return hasLeagueFlag(league) ? (
            // height 10 renders a 13px glyph (LeagueFlag adds 3). At the previous
            // 13 the flag was 16px — the largest text on the card, outweighing the
            // player name it decorates.
            <div className="flex justify-center" title={league}>
              <LeagueFlag league={league} height={10} />
            </div>
          ) : (
            <p
              className="text-[#6B7280] truncate text-center w-full m-0"
              style={{ fontSize: '11px', lineHeight: '1.3' }}
              title={league}
            >
              {league}
            </p>
          )
        })()}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#061852] rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-[11px]">✓</span>
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