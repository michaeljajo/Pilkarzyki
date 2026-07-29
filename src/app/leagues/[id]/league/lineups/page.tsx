'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Position } from '@/types'
import { LeagueFlag } from '@/components/ui/LeagueFlag'

interface SquadsPageProps {
  params: Promise<{ id: string }>
}

interface Player {
  id: string
  name: string
  surname: string
  position: Position
  club?: string
  football_league?: string
}

// Singular labels, as on the draft board — these now sit on individual player
// rows rather than heading a group, so "Bramkarz" reads correctly, not "Bramkarze".
const POSITION_PL: Record<string, string> = {
  Goalkeeper: 'Bramkarz',
  Defender: 'Obrońca',
  Midfielder: 'Pomocnik',
  Forward: 'Napastnik',
}
function getPositionLabel(position: Position): string {
  return POSITION_PL[position] || position
}

/** One compact player row, matching the draft board's roster line. */
function PlayerLine({ player }: { player: Player }) {
  return (
    // Sizes 11/13, weights 400/600, ink + muted only — the shared type system.
    // height 10 renders a 13px flag: at the draft board's 11 it came out 14px,
    // larger than the 12px name beside it and the loudest thing on the row.
    <li className="text-[13px] text-[#6B7280] flex items-center gap-1.5 flex-wrap">
      <span className="font-semibold text-[#111827]">
        {player.name} {player.surname}
      </span>
      {player.club && <span>{player.club}</span>}
      <LeagueFlag league={player.football_league} height={10} />
      <span className="text-[11px]">{getPositionLabel(player.position)}</span>
    </li>
  )
}

/** A labelled sub-list (used for the two "żelazny skład" selections). */
function PlayerLineList({ label, players }: { label: string; players: Player[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[#6B7280]">{label}</p>
      {players.length === 0 ? (
        <p className="mt-0.5 text-[11px] text-[#6B7280]">brak</p>
      ) : (
        <ul className="mt-0.5 space-y-0.5">
          {players.map((p) => (
            <PlayerLine key={p.id} player={p} />
          ))}
        </ul>
      )}
    </div>
  )
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

  return (
    <div>

      {/* No nested <main> and no own centring wrapper — the section layout caps
          and centres this. Caption dropped: the sub-nav already names the page. */}
      <div className="w-full pb-12">
        <div className="w-full">

          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#061852]"></div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
              <div className="text-red-600 text-4xl mb-3">⚠️</div>
              <h3 className="text-[15px] font-semibold text-[#111827] mb-2">Błąd</h3>
              <p className="text-[13px] text-[#6B7280]">{error}</p>
            </div>
          )}

          {!loading && !error && squadsData && (
            <div className="space-y-2">
              {squadsData.squads.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-[13px] text-[#6B7280]">Brak składów w tej lidze</p>
                </div>
              ) : (
                squadsData.squads.map((squad) => {
                  const managerName = getManagerName(squad.manager)
                  const isExpanded = expandedSquads.has(squad.squadId)

                  return (
                    // Same roster presentation as the draft board: a bordered
                    // card per squad, a collapsible header carrying the name and
                    // a squad-size count, and one line per player inside.
                    <div
                      key={squad.squadId}
                      className="rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSquad(squad.squadId)}
                        className="w-full flex items-center justify-between gap-2 text-left"
                      >
                        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[#111827]">
                          <span
                            className={`text-[#6B7280] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          >
                            ▸
                          </span>
                          {squad.teamName || managerName}
                        </span>
                        <span className="text-[11px] text-[#6B7280]">{squad.players.length}</span>
                      </button>

                      {isExpanded && squad.players.length === 0 && (
                        <p className="mt-2 text-[11px] text-[#6B7280]">Brak zawodników.</p>
                      )}

                      {isExpanded && squad.players.length > 0 && (
                        <div className="mt-2 space-y-3">
                          {/* Rendered in the API's order, which is draft pick
                              sequence. Do not re-group by position here — that
                              would discard the ordering the API just applied. */}
                          <ul className="space-y-0.5">
                            {squad.players.map((player) => (
                              <PlayerLine key={player.id} player={player} />
                            ))}
                          </ul>

                          <PlayerLineList label="Żelazny skład ligowy" players={squad.defaultLineup} />
                          {squadsData.hasCup && (
                            <PlayerLineList
                              label="Żelazny skład pucharowy"
                              players={squad.defaultCupLineup}
                            />
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
      </div>
    </div>
  )
}
