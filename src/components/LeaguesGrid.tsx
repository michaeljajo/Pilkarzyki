'use client'

import { useState, useEffect } from 'react'
import { LeagueCard } from '@/components/LeagueCard'

interface League {
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

// Hook to detect screen size and return appropriate column count
function useGridColumns() {
  const [columns, setColumns] = useState(3) // Default for SSR
  
  useEffect(() => {
    const getColumns = () => {
      const width = window.innerWidth
      if (width >= 1280) return 3       // xl: 3 columns
      if (width >= 768) return 2        // md: 2 columns
      return 1                          // mobile: 1 column
    }
    
    setColumns(getColumns())
    
    const handleResize = () => setColumns(getColumns())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return columns
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
