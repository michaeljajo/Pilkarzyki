'use client'

import { useState, useEffect } from 'react'
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
    <div>
      {/* Team Name Modal - shows if team name not set */}
      {showModal && squad && leagueName && (
        <TeamNameModal
          squadId={squad.id}
          leagueName={leagueName}
          onSuccess={handleSuccess}
        />
      )}

      {/* No nested <main> (the AppShell already provides one) and no extra
          centring wrapper — both pushed the table off the section's left edge,
          out of line with the "Liga" heading and sub-nav above it. */}
      <div className="w-full pb-12">
        {/* League Table - without admin controls */}
        {leagueId && (
          <LeagueTable leagueId={leagueId} showAdminControls={false} />
        )}
      </div>
    </div>
  )
}