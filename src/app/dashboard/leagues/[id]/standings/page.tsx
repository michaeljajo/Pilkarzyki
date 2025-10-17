'use client'

import { useState, useEffect } from 'react'
import { LeagueNavigation } from '@/components/LeagueNavigation'
import LeagueTable from '@/components/LeagueTable'

interface LeagueStandingsPageProps {
  params: Promise<{ id: string }>
}

export default function LeagueStandingsPage({ params }: LeagueStandingsPageProps) {
  const [leagueId, setLeagueId] = useState<string>('')
  const [leagueName, setLeagueName] = useState<string>('')

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params
      setLeagueId(resolvedParams.id)

      // Fetch league name for breadcrumb
      try {
        const response = await fetch(`/api/manager/leagues/${resolvedParams.id}`)
        if (response.ok) {
          const data = await response.json()
          setLeagueName(data.league?.name || 'League')
        }
      } catch (error) {
        console.error('Failed to fetch league name:', error)
      }
    }
    resolveParams()
  }, [params])

  return (
    <div className="min-h-screen bg-white">
      <LeagueNavigation
        leagueId={leagueId}
        leagueName={leagueName}
        currentPage="standings"
      />

      <main className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '64px', paddingBottom: '96px' }}>
        {/* League Table - without admin controls */}
        {leagueId && (
          <LeagueTable leagueId={leagueId} showAdminControls={false} />
        )}
      </main>
    </div>
  )
}