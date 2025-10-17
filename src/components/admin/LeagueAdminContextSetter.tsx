'use client'

import { useEffect } from 'react'
import { useLeagueAdmin } from '@/contexts/LeagueAdminContext'

interface LeagueAdminContextSetterProps {
  leagueId: string
  leagueName: string
}

export function LeagueAdminContextSetter({ leagueId, leagueName }: LeagueAdminContextSetterProps) {
  const { setLeagueContext } = useLeagueAdmin()

  useEffect(() => {
    setLeagueContext(leagueId, leagueName)

    // Cleanup: reset context when component unmounts
    return () => {
      setLeagueContext(null, null)
    }
  }, [leagueId, leagueName, setLeagueContext])

  return null
}
