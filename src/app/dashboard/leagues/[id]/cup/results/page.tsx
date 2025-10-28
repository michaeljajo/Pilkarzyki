'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { LeagueNavigation } from '@/components/LeagueNavigation'
import { CupGameweekSelector } from '@/components/CupGameweekSelector'
import { CupMatchCard } from '@/components/CupMatchCard'

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

interface CupGameweek {
  id: string
  cup_week: number
  stage: string
  leg: number
  gameweek?: {
    id: string
    week: number
    start_date: string
    end_date: string
    lock_date: string
    is_completed: boolean
  }
  matches: any[]
}

interface CupResultsData {
  cup: Cup
  gameweeks: CupGameweek[]
}

interface CupResultsPageProps {
  params: Promise<{ id: string }>
}

export default function CupResultsPage({ params }: CupResultsPageProps) {
  const { user } = useUser()
  const router = useRouter()
  const [leagueId, setLeagueId] = useState<string>('')
  const [leagueName, setLeagueName] = useState<string>('')
  const [cupId, setCupId] = useState<string>('')
  const [cupData, setCupData] = useState<CupResultsData | null>(null)
  const [selectedGameweek, setSelectedGameweek] = useState<string>('')
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
      fetchCupResults()
    }
  }, [cupId])

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
    }
  }, [user, router])

  const fetchCupResults = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/cups/${cupId}/results`)

      if (response.ok) {
        const data = await response.json()
        setCupData(data)

        // Auto-select the first gameweek if none selected
        if (data.gameweeks && data.gameweeks.length > 0 && !selectedGameweek) {
          setSelectedGameweek(data.gameweeks[0].id)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Nie udało się pobrać wyników pucharu')
      }
    } catch (error) {
      console.error('Failed to fetch cup results:', error)
      setError('Błąd podczas pobierania wyników pucharu')
    } finally {
      setLoading(false)
    }
  }

  const selectedGameweekData = cupData?.gameweeks.find(gw => gw.id === selectedGameweek)

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <LeagueNavigation
        leagueId={leagueId}
        leagueName={leagueName}
        currentPage="cup-results"
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

          {/* Cup Results */}
          {!loading && !error && cupData && (
            <>
              {/* Gameweek Selector */}
              <CupGameweekSelector
                gameweeks={cupData.gameweeks}
                selectedGameweek={selectedGameweek}
                onGameweekChange={setSelectedGameweek}
              />

              {/* Matches */}
              {selectedGameweekData && (
                <div>
                  {selectedGameweekData.matches.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-gray-400">
                        <div className="text-3xl mb-2">⚽</div>
                        <div className="text-sm">Brak meczów w tej kolejce</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedGameweekData.matches.map((match: any) => (
                        <CupMatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!selectedGameweek && cupData.gameweeks.length === 0 && (
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
