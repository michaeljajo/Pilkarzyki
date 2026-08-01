'use client'

import { useSyncExternalStore } from 'react'
import { LeagueCard } from '@/components/LeagueCard'

export interface League {
  id: string
  name: string
  season: string | null
  isAdmin: boolean
  isManager: boolean
  created_at: string
  is_active: boolean
}

interface LeaguesGridProps {
  leagues: League[]
}

function subscribeToResize(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

function getColumnsSnapshot() {
  const width = window.innerWidth
  if (width >= 1280) return 3 // xl: 3 columns
  if (width >= 768) return 2 // md: 2 columns
  return 1 // mobile: 1 column
}

// SSR has no window, so the server snapshot is the xl default the markup is
// laid out for.
function getServerColumnsSnapshot() {
  return 3
}

/**
 * Detects screen size and returns the column count.
 *
 * useSyncExternalStore rather than useState + useEffect: window size is
 * external mutable state, and setting state synchronously inside an effect on
 * mount causes a cascading second render on every page load.
 */
function useGridColumns() {
  return useSyncExternalStore(
    subscribeToResize,
    getColumnsSnapshot,
    getServerColumnsSnapshot
  )
}

export function LeaguesGrid({ leagues }: LeaguesGridProps) {
  const columns = useGridColumns()
  
  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '32px',
        padding: '8px',
      }}
    >
      {leagues.map((league, index) => (
        <LeagueCard
          key={league.id}
          league={league}
          index={index}
        />
      ))}
    </div>
  )
}
