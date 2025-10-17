'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface LeagueAdminContextType {
  leagueId: string | null
  leagueName: string | null
  setLeagueContext: (leagueId: string | null, leagueName: string | null) => void
}

const LeagueAdminContext = createContext<LeagueAdminContextType | undefined>(undefined)

export function LeagueAdminProvider({ children }: { children: ReactNode }) {
  const [leagueId, setLeagueId] = useState<string | null>(null)
  const [leagueName, setLeagueName] = useState<string | null>(null)

  const setLeagueContext = (id: string | null, name: string | null) => {
    setLeagueId(id)
    setLeagueName(name)
  }

  return (
    <LeagueAdminContext.Provider value={{ leagueId, leagueName, setLeagueContext }}>
      {children}
    </LeagueAdminContext.Provider>
  )
}

export function useLeagueAdmin() {
  const context = useContext(LeagueAdminContext)
  if (context === undefined) {
    throw new Error('useLeagueAdmin must be used within a LeagueAdminProvider')
  }
  return context
}
