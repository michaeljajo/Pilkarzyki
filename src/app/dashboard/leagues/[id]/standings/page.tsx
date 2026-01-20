'use client'

import { useState, useEffect } from 'react'
import { LeagueNavigation } from '@/components/LeagueNavigation'
import LeagueTable from '@/components/LeagueTable'
import { TeamNameModal } from '@/components/TeamNameModal'
import { useTeamNameModal } from '@/hooks/useTeamNameModal'

interface LeagueStandingsPageProps {
  params: Promise<{ id: string }>
}

export default function LeagueStandingsPage({ params }: LeagueStandingsPageProps) {
  const [leagueId, setLeagueId] = useState<string>('')
  const [leagueName, setLeagueName] = useState<string>('')
  const { squad, showModal, handleSuccess } = useTeamNameModal(leagueId)

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params
      setLeagueId(resolvedParams.id)

      // Fetch league name
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
      {/* Team Name Modal - shows if team name not set */}
      {showModal && squad && leagueName && (
        <TeamNameModal
          squadId={squad.id}
          leagueName={leagueName}
          onSuccess={handleSuccess}
        />
      )}

      <LeagueNavigation
        leagueId={leagueId}
        leagueName={leagueName}
        currentPage="standings"
      />

      <main className="max-w-[1400px] mx-auto px-2 sm:px-6 md:px-12 pt-16 pb-24">
        {/* League Table - without admin controls */}
        {leagueId && (
          <LeagueTable leagueId={leagueId} showAdminControls={false} />
        )}
      </main>
    </div>
  )
}