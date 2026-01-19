'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { LeagueNavigation } from '@/components/LeagueNavigation'
import { Position } from '@/types'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface SquadsPageProps {
  params: Promise<{ id: string }>
}

interface Player {
  id: string
  name: string
  surname: string
  position: Position
  club?: string
}

interface Manager {
  id: string
  first_name?: string
  last_name?: string
  email: string
}

interface SquadDetail {
  squadId: string
  teamName?: string
  manager: Manager
  players: Player[]
  defaultLineup: Player[]
  defaultCupLineup: Player[]
}

interface SquadsData {
  league: {
    id: string
    name: string
  }
  hasCup: boolean
  cupName?: string
  squads: SquadDetail[]
}

export default function SquadsPage({ params }: SquadsPageProps) {
  const { user } = useUser()
  const [leagueId, setLeagueId] = useState<string>('')
  const [leagueName, setLeagueName] = useState<string>('')
  const [squadsData, setSquadsData] = useState<SquadsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params
      setLeagueId(resolvedParams.id)

      try {
        setLoading(true)
        const response = await fetch(`/api/leagues/${resolvedParams.id}/squads`)

        if (response.ok) {
          const data = await response.json()
          setSquadsData(data)
          setLeagueName(data.league?.name || 'Liga')
        } else {
          const errorData = await response.json().catch(() => ({}))
          setError(errorData.error || 'Nie udało się pobrać składów')
        }
      } catch (error) {
        console.error('Failed to fetch squads:', error)
        setError('Błąd podczas pobierania danych składów')
      } finally {
        setLoading(false)
      }
    }
    resolveParams()
  }, [params])

  if (!user) {
    return null
  }

  const toggleSquad = (squadId: string) => {
    setExpandedSquads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(squadId)) {
        newSet.delete(squadId)
      } else {
        newSet.add(squadId)
      }
      return newSet
    })
  }

  const getManagerName = (manager: Manager): string => {
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name} ${manager.last_name}`
    }
    if (manager.first_name) {
      return manager.first_name
    }
    return manager.email.split('@')[0]
  }

  const getPositionLabel = (position: Position): string => {
    switch (position) {
      case 'Goalkeeper':
        return 'Bramkarze'
      case 'Defender':
        return 'Obrońcy'
      case 'Midfielder':
        return 'Pomocnicy'
      case 'Forward':
        return 'Napastnicy'
      default:
        return position
    }
  }

  const groupPlayersByPosition = (players: Player[]) => {
    const grouped: Record<Position, Player[]> = {
      'Goalkeeper': [],
      'Defender': [],
      'Midfielder': [],
      'Forward': []
    }

    players.forEach(player => {
      grouped[player.position].push(player)
    })

    return grouped
  }

  const formatPlayerNames = (players: Player[]): string => {
    if (players.length === 0) return 'brak'
    return players.map(p => {
      const fullName = `${p.name} ${p.surname}`
      return p.club ? `${fullName} (${p.club})` : fullName
    }).join(', ')
  }

  return (
    <div className="min-h-screen bg-white">
      <LeagueNavigation
        leagueId={leagueId}
        leagueName={leagueName}
        currentPage="squad"
      />

      <main
        className="w-full flex justify-center"
        style={{ paddingTop: '48px', paddingBottom: '64px' }}
      >
        <div className="w-full max-w-4xl px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Składy</h1>

          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#061852]"></div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
              <div className="text-red-600 text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Błąd</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          )}

          {!loading && !error && squadsData && (
            <div className="space-y-2">
              {squadsData.squads.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">Brak składów w tej lidze</p>
                </div>
              ) : (
                squadsData.squads.map((squad) => {
                  const groupedPlayers = groupPlayersByPosition(squad.players)
                  const managerName = getManagerName(squad.manager)
                  const isExpanded = expandedSquads.has(squad.squadId)

                  return (
                    <div
                      key={squad.squadId}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Collapsible Header */}
                      <button
                        onClick={() => toggleSquad(squad.squadId)}
                        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown size={20} className="text-gray-600" />
                          ) : (
                            <ChevronRight size={20} className="text-gray-600" />
                          )}
                          <span className="font-semibold text-gray-900">
                            {squad.teamName || 'Bez nazwy'}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({managerName})
                          </span>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-6 py-4 space-y-3 bg-white">
                          <div>
                            <span className="font-semibold text-gray-700">Zespół: </span>
                            <span className="text-gray-900">{squad.teamName || 'Bez nazwy'}</span>
                          </div>

                          <div>
                            <span className="font-semibold text-gray-700">Manager: </span>
                            <span className="text-gray-900">{managerName}</span>
                          </div>

                          {/* Players by Position */}
                          {(['Forward', 'Midfielder', 'Defender', 'Goalkeeper'] as Position[]).map((position) => {
                            const positionPlayers = groupedPlayers[position]
                            if (positionPlayers.length === 0) return null

                            return (
                              <div key={position}>
                                <span className="font-semibold text-gray-700">
                                  {getPositionLabel(position)}:{' '}
                                </span>
                                <span className="text-gray-900">
                                  {formatPlayerNames(positionPlayers)}
                                </span>
                              </div>
                            )
                          })}

                          {/* Default League Lineup */}
                          <div>
                            <span className="font-semibold text-gray-700">
                              Żelazny skład ligowy:{' '}
                            </span>
                            <span className="text-gray-900">
                              {formatPlayerNames(squad.defaultLineup)}
                            </span>
                          </div>

                          {/* Default Cup Lineup */}
                          {squadsData.hasCup && (
                            <div>
                              <span className="font-semibold text-gray-700">
                                Żelazny skład pucharowy:{' '}
                              </span>
                              <span className="text-gray-900">
                                {formatPlayerNames(squad.defaultCupLineup)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
