'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { LeagueNavigation } from '@/components/LeagueNavigation'
import { TopScorersTable } from '@/components/TopScorersTable'
import { TopScorer } from '@/types'

interface TopScorersPageProps {
  params: Promise<{ id: string }>
}

export default function TopScorersPage({ params }: TopScorersPageProps) {
  const { user } = useUser()
  const router = useRouter()
  const [leagueId, setLeagueId] = useState<string>('')
  const [leagueName, setLeagueName] = useState<string>('')
  const [competitionType, setCompetitionType] = useState<'league' | 'cup'>(
    'league'
  )
  const [topScorers, setTopScorers] = useState<TopScorer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCup, setHasCup] = useState(false)
  const [checkingCup, setCheckingCup] = useState(true)

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params
      setLeagueId(resolvedParams.id)

      // Fetch league name
      try {
        const response = await fetch(
          `/api/manager/leagues/${resolvedParams.id}`
        )
        if (response.ok) {
          const data = await response.json()
          setLeagueName(data.league?.name || 'Liga')
        }
      } catch (error) {
        console.error('Failed to fetch league name:', error)
      }

      // Check if league has a cup
      try {
        const cupResponse = await fetch(
          `/api/cups?leagueId=${resolvedParams.id}`
        )
        if (cupResponse.ok) {
          const cupData = await cupResponse.json()
          setHasCup(cupData.cup !== null && cupData.cup !== undefined)
        }
      } catch (error) {
        console.error('Failed to check for cup:', error)
      } finally {
        setCheckingCup(false)
      }
    }
    resolveParams()
  }, [params])

  // Don't redirect on initial load while user is loading
  // Only redirect if we're sure user is not authenticated

  const fetchTopScorers = async () => {
    try {
      setLoading(true)
      setError(null)

      const endpoint =
        competitionType === 'league'
          ? `/api/leagues/${leagueId}/top-scorers`
          : `/api/leagues/${leagueId}/cup/top-scorers`

      const response = await fetch(endpoint)

      if (response.ok) {
        const data = await response.json()
        setTopScorers(data.topScorers || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(
          errorData.error ||
            `Nie udało się pobrać listy strzelców ${competitionType === 'cup' ? 'pucharu' : 'ligi'}`
        )
      }
    } catch (error) {
      console.error('Failed to fetch top scorers:', error)
      setError('Błąd podczas pobierania danych strzelców')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (leagueId) {
      fetchTopScorers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId, competitionType])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <LeagueNavigation
        leagueId={leagueId}
        leagueName={leagueName}
        currentPage="top-scorers"
      />

      <main
        className="w-full flex justify-center"
        style={{ paddingTop: '48px', paddingBottom: '64px' }}
      >
        <div className="w-full max-w-4xl px-6">
          {/* Competition Type Toggle */}
          {!checkingCup && hasCup && (
            <div className="mb-8 inline-flex rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setCompetitionType('league')}
                className={`px-16 py-3 text-base font-semibold rounded-md transition-all flex items-center justify-center min-w-[140px] ${
                  competitionType === 'league'
                    ? 'bg-[#061852] text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Liga
              </button>
              <button
                onClick={() => setCompetitionType('cup')}
                className={`px-16 py-3 text-base font-semibold rounded-md transition-all flex items-center justify-center min-w-[140px] ${
                  competitionType === 'cup'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Puchar
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#061852]"></div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
              <div className="text-red-600 text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Błąd
              </h3>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchTopScorers}
                className="mt-4 px-4 py-2 bg-[#061852] text-white rounded-lg hover:bg-[#0a2475] transition-colors"
              >
                Spróbuj ponownie
              </button>
            </div>
          )}

          {/* Top Scorers Table */}
          {!loading && !error && (
            <TopScorersTable
              topScorers={topScorers}
              competitionType={competitionType}
            />
          )}
        </div>
      </main>
    </div>
  )
}
