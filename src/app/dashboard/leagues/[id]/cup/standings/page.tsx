'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { LeagueNavigation } from '@/components/LeagueNavigation'
import { CupGroupTable } from '@/components/CupGroupTable'
import { KnockoutBracket } from '@/components/KnockoutBracket'

interface Cup {
  id: string
  name: string
  stage: string
  league_id: string
  leagues?: {
    id: string
    name: string
    season: string
  }
}

interface Standing {
  id: string
  manager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  position: number
  qualified: boolean
}

interface Group {
  group_name: string
  standings: Standing[]
}

interface CupGameweek {
  id: string
  stage: string
  matches: unknown[]
}

interface CupStandingsData {
  cup: Cup
  groups: Group[]
}

interface CupResultsData {
  cup: Cup
  gameweeks: CupGameweek[]
}

interface CupStandingsPageProps {
  params: Promise<{ id: string }>
}

export default function CupStandingsPage({ params }: CupStandingsPageProps) {
  const { user } = useUser()
  const router = useRouter()
  const [leagueId, setLeagueId] = useState<string>('')
  const [leagueName, setLeagueName] = useState<string>('')
  const [cupId, setCupId] = useState<string>('')
  const [cupStandingsData, setCupStandingsData] = useState<CupStandingsData | null>(null)
  const [cupResultsData, setCupResultsData] = useState<CupResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      // Fetch cup for this league
      try {
        const cupResponse = await fetch(`/api/cups?leagueId=${resolvedParams.id}`)
        if (cupResponse.ok) {
          const cupListData = await cupResponse.json()
          if (cupListData.cup) {
            setCupId(cupListData.cup.id)
          } else {
            setError('Brak pucharu dla tej ligi')
            setLoading(false)
          }
        } else {
          setError('Nie udało się pobrać informacji o pucharze')
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to fetch cup:', error)
        setError('Błąd podczas pobierania danych pucharu')
        setLoading(false)
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (cupId) {
      fetchCupData()
    }
  }, [cupId])

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
    }
  }, [user, router])

  const fetchCupData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch group standings
      const standingsResponse = await fetch(`/api/cups/${cupId}/group-standings`)
      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json()
        setCupStandingsData(standingsData)
      } else {
        const errorData = await standingsResponse.json().catch(() => ({}))
        setError(errorData.error || 'Nie udało się pobrać tabeli pucharu')
        setLoading(false)
        return
      }

      // Fetch results for knockout bracket
      const resultsResponse = await fetch(`/api/cups/${cupId}/results`)
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        setCupResultsData(resultsData)
      }
    } catch (error) {
      console.error('Failed to fetch cup data:', error)
      setError('Błąd podczas pobierania danych pucharu')
    } finally {
      setLoading(false)
    }
  }

  // Determine which view to show based on cup stage
  const showGroupStage = cupStandingsData?.cup.stage === 'group_stage'
  const showKnockout = cupStandingsData?.cup.stage !== 'group_stage'

  // Extract knockout matches from results data
  const knockoutMatches = cupResultsData?.gameweeks
    .filter(gw => gw.stage !== 'group_stage')
    .flatMap(gw => gw.matches)
    .filter(Boolean) || []

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <LeagueNavigation
        leagueId={leagueId}
        leagueName={leagueName}
        currentPage="cup-standings"
      />

      <main className="w-full flex justify-center" style={{ paddingTop: '48px', paddingBottom: '64px' }}>
        <div className="w-full max-w-4xl px-6">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-16">
              <div className="text-amber-600 text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Błąd</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          )}

          {/* Cup Standings Content */}
          {!loading && !error && cupStandingsData && (
            <>
              {/* Group Stage View */}
              {showGroupStage && (
                <CupGroupTable groups={cupStandingsData.groups} />
              )}

              {/* Knockout Stage View */}
              {showKnockout && (
                <>
                  {/* Show completed group standings for reference */}
                  {cupStandingsData.groups.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Faza Grupowa (zakończona)</h2>
                      <CupGroupTable groups={cupStandingsData.groups} />
                    </div>
                  )}

                  {/* Show knockout bracket */}
                  <div>
                    <KnockoutBracket matches={knockoutMatches} />
                  </div>
                </>
              )}

              {/* Empty State */}
              {cupStandingsData.groups.length === 0 && knockoutMatches.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-gray-400">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="text-sm">Puchar jeszcze się nie rozpoczął</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
