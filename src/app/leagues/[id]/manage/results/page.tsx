'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { GameweekMatchData, MatchWithLineups, PlayerWithResult } from '@/types'
import { ClipboardList, ListChecks, Trophy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SkladyTab } from '@/components/admin/kolejka/SkladyTab'
import { WynikiLigiTab } from '@/components/admin/kolejka/WynikiLigiTab'
import { WynikiPucharuTab } from '@/components/admin/kolejka/WynikiPucharuTab'
import { FinishGameweekModal } from '@/components/admin/kolejka/FinishGameweekModal'
import {
  Cup,
  CupGameweek,
  EtLineupData,
  PenaltyLineupData,
  KolejkaGameweek,
  GameweekState,
  deriveGameweekState,
  isKnockoutDecider,
  getManagerDisplayName,
} from '@/components/admin/kolejka/types'

type Tab = 'sklady' | 'liga' | 'puchar'

const STATE_LABEL: Record<GameweekState, string> = {
  open: 'Składy otwarte',
  locked: 'Zablokowana — wpisywanie wyników',
  completed: 'Zakończona',
}

/**
 * Kolejka — the guided weekly-flow page. One tabbed screen per gameweek:
 *   Składy       → read-only lineup review + admin corrections
 *   Wyniki Ligi  → league goal entry
 *   Wyniki Pucharu → cup goal entry + ET/penalty (only when a cup round runs)
 * plus an explicit, validated "Zakończ kolejkę" action.
 */
export default function KolejkaPage() {
  const params = useParams()
  const leagueId = params.id as string

  const [gameweeks, setGameweeks] = useState<KolejkaGameweek[]>([])
  const [matchData, setMatchData] = useState<GameweekMatchData | null>(null)
  const [cup, setCup] = useState<Cup | null>(null)
  const [cupGameweeks, setCupGameweeks] = useState<CupGameweek[]>([])
  const [selectedGameweek, setSelectedGameweek] = useState<string>('')
  const [activeTab, setActiveTab] = useState<Tab>('sklady')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [playerGoals, setPlayerGoals] = useState<{ [key: string]: number }>({})
  const [playerHasPlayed, setPlayerHasPlayed] = useState<{ [key: string]: boolean }>({})
  const [etLineups, setEtLineups] = useState<{ [key: string]: EtLineupData }>({})
  const [penaltyLineups, setPenaltyLineups] = useState<{ [key: string]: PenaltyLineupData }>({})
  const [penaltyGoals, setPenaltyGoals] = useState<{ [key: string]: number[] }>({})
  const [showFinish, setShowFinish] = useState(false)
  const [finishMissing, setFinishMissing] = useState<string[]>([])

  // Guards the one-time landing on the active gameweek. Reading `selectedGameweek`
  // here instead would put it in fetchGameweeks' deps, and since fetchGameweeks
  // sets it, the load effect would re-run itself.
  const hasAutoSelected = useRef(false)

  const gw = gameweeks.find((g) => g.id === selectedGameweek)
  const state = deriveGameweekState(gw)
  const canCorrect = state === 'locked'
  const resultsDisabled = state !== 'locked'
  const canFinish = state === 'locked'
  const hasCup = cupGameweeks.length > 0

  const fetchGameweeks = useCallback(async () => {
    try {
      const response = await fetch('/api/gameweeks')
      if (response.ok) {
        const data = await response.json()
        const leagueGameweeks: KolejkaGameweek[] = (data.gameweeks || [])
          .filter((g: KolejkaGameweek) => g.league_id === leagueId)
          .sort((a: KolejkaGameweek, b: KolejkaGameweek) => a.week - b.week)
        setGameweeks(leagueGameweeks)

        if (!hasAutoSelected.current && leagueGameweeks.length > 0) {
          hasAutoSelected.current = true
          const active = leagueGameweeks.find((g) => !g.is_completed) ?? leagueGameweeks[leagueGameweeks.length - 1]
          setSelectedGameweek(active.id)
          // Land on the tab that matches where the work is.
          setActiveTab(deriveGameweekState(active) === 'locked' ? 'liga' : 'sklady')
        }
      }
    } catch (error) {
      console.error('Failed to fetch gameweeks:', error)
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  const fetchCup = useCallback(async () => {
    try {
      const response = await fetch(`/api/cups?leagueId=${leagueId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.cup) setCup(data.cup)
      }
    } catch (error) {
      console.error('Failed to fetch cup:', error)
    }
  }, [leagueId])

  const fetchMatchData = useCallback(async () => {
    if (!selectedGameweek) return
    try {
      setLoading(true)
      const response = await fetch(`/api/gameweeks/${selectedGameweek}/matches-with-lineups`)
      if (response.ok) {
        const data = await response.json()
        setMatchData(data)
        const goalsMap: { [key: string]: number } = {}
        const hasPlayedMap: { [key: string]: boolean } = {}
        data.matches?.forEach((match: MatchWithLineups) => {
          ;[...(match.home_lineup?.players || []), ...(match.away_lineup?.players || [])].forEach(
            (player: PlayerWithResult) => {
              goalsMap[player.id] = player.goals_scored || 0
              hasPlayedMap[player.id] = player.has_played || false
            }
          )
        })
        setPlayerGoals(goalsMap)
        setPlayerHasPlayed(hasPlayedMap)
      } else {
        setMatchData(null)
      }
    } catch (error) {
      console.error('Failed to fetch match data:', error)
      setMatchData(null)
    } finally {
      setLoading(false)
    }
  }, [selectedGameweek])

  // Works purely from its arguments and functional state updates, so it needs no
  // deps and stays referentially stable for fetchCupMatches below.
  const fetchEtPenaltyLineups = useCallback(async (cupGameweekId: string, matches: MatchWithLineups[]) => {
    try {
      const managerIds = new Set<string>()
      matches.forEach((m) => {
        if (m.home_manager_id) managerIds.add(m.home_manager_id)
        if (m.away_manager_id) managerIds.add(m.away_manager_id)
      })

      const response = await fetch(
        `/api/admin/cup-et-penalty?cupGameweekId=${cupGameweekId}&managerIds=${Array.from(managerIds).join(',')}`
      )
      if (!response.ok) return
      const data = await response.json()

      const newEt: { [key: string]: EtLineupData } = {}
      const newPen: { [key: string]: PenaltyLineupData } = {}
      const newPenGoals: { [key: string]: number[] } = {}

      data.etLineups?.forEach((et: EtLineupData) => {
        newEt[`${et.cup_gameweek_id}_${et.manager_id}`] = et
        et.players?.forEach((player: PlayerWithResult) => {
          setPlayerGoals((prev) => ({ ...prev, [player.id]: player.goals_scored || 0 }))
          setPlayerHasPlayed((prev) => ({ ...prev, [player.id]: player.has_played || false }))
        })
      })
      data.penaltyLineups?.forEach((pen: PenaltyLineupData) => {
        const key = `${pen.cup_gameweek_id}_${pen.manager_id}`
        newPen[key] = pen
        newPenGoals[key] = pen.goals || [0, 0, 0, 0, 0]
      })

      setEtLineups((prev) => ({ ...prev, ...newEt }))
      setPenaltyLineups((prev) => ({ ...prev, ...newPen }))
      setPenaltyGoals((prev) => ({ ...prev, ...newPenGoals }))
    } catch (error) {
      console.error('Failed to fetch ET/penalty lineups:', error)
    }
  }, [])

  const fetchCupMatches = useCallback(async () => {
    if (!cup || !selectedGameweek) return
    try {
      const response = await fetch(`/api/cups/${cup.id}/results`)
      if (response.ok) {
        const data = await response.json()
        const matching: CupGameweek[] = (data.gameweeks || []).filter(
          (cgw: CupGameweek) => cgw.gameweek?.id === selectedGameweek
        )
        setCupGameweeks(matching)

        matching.forEach((cgw) => {
          cgw.matches?.forEach((match) => {
            ;[...(match.home_lineup?.players || []), ...(match.away_lineup?.players || [])].forEach(
              (player: PlayerWithResult) => {
                setPlayerGoals((prev) => ({ ...prev, [player.id]: player.goals_scored || 0 }))
                setPlayerHasPlayed((prev) => ({ ...prev, [player.id]: player.has_played || false }))
              }
            )
          })
        })

        for (const cgw of matching) {
          if (isKnockoutDecider(cgw)) await fetchEtPenaltyLineups(cgw.id, cgw.matches)
        }
      }
    } catch (error) {
      console.error('Failed to fetch cup matches:', error)
    }
  }, [cup, selectedGameweek, fetchEtPenaltyLineups])

  useEffect(() => {
    fetchGameweeks()
    fetchCup()
  }, [fetchGameweeks, fetchCup])

  useEffect(() => {
    if (selectedGameweek) {
      fetchMatchData().then(() => fetchCupMatches())
    } else {
      setMatchData(null)
      setCupGameweeks([])
      setPlayerGoals({})
      setPlayerHasPlayed({})
    }
  }, [selectedGameweek, cup, fetchMatchData, fetchCupMatches])

  const handleGoalsChange = (playerId: string, value: string) => {
    let goals = 0
    if (value !== '' && value !== '-') {
      const parsed = parseInt(value)
      if (!isNaN(parsed)) goals = Math.min(Math.max(parsed, -1), 9)
    }
    setPlayerGoals((prev) => ({ ...prev, [playerId]: goals }))
  }

  const handleHasPlayedChange = (playerId: string, checked: boolean) => {
    setPlayerHasPlayed((prev) => ({ ...prev, [playerId]: checked }))
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select()

  const handlePenaltyToggle = (key: string, index: number) => {
    setPenaltyGoals((prev) => {
      const current = [...(prev[key] || [0, 0, 0, 0, 0])]
      current[index] = current[index] === 1 ? 0 : 1
      return { ...prev, [key]: current }
    })
  }

  const savePenaltyResults = async (cupGameweekId: string, managerId: string) => {
    const goals = penaltyGoals[`${cupGameweekId}_${managerId}`] || [0, 0, 0, 0, 0]
    try {
      const response = await fetch('/api/cup-penalty-lineups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cupGameweekId, managerId, goals }),
      })
      if (response.ok) {
        toast.success('Karne zapisane')
      } else {
        const error = await response.json()
        toast.error(`Błąd zapisu karnych: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to save penalty results:', error)
      toast.error('Nie udało się zapisać karnych')
    }
  }

  /** Persist every goal/has_played entry currently in state. Returns success. */
  const saveAllResults = async (silent = false): Promise<boolean> => {
    if (!selectedGameweek) return false
    const results = Object.entries(playerGoals).map(([player_id, goals]) => ({
      player_id,
      goals,
      has_played: playerHasPlayed[player_id] || false,
    }))
    try {
      const response = await fetch(`/api/gameweeks/${selectedGameweek}/lineups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      if (response.ok) {
        if (!silent) toast.success('Wyniki zapisane — tabela zaktualizowana')
        return true
      }
      const error = await response.json()
      toast.error(`Błąd zapisu wyników: ${error.error}`)
      return false
    } catch {
      toast.error('Nie udało się zapisać wyników')
      return false
    }
  }

  /** Save the results for a single match (league or cup, ET included). */
  const saveMatch = async (matchId: string) => {
    if (!selectedGameweek || !matchData) return
    setSaving(true)
    try {
      let match: MatchWithLineups | undefined = matchData.matches.find((m) => m.id === matchId)
      if (!match) {
        for (const cgw of cupGameweeks) {
          const found = cgw.matches.find((m) => m.id === matchId)
          if (found) {
            match = found
            break
          }
        }
      }
      if (!match) return

      const playerIds = [
        ...(match.home_lineup?.players?.map((p) => p.id) || []),
        ...(match.away_lineup?.players?.map((p) => p.id) || []),
      ]
      for (const cgw of cupGameweeks) {
        const cupMatch = cgw.matches.find((m) => m.id === matchId)
        if (cupMatch) {
          const homeEt = etLineups[`${cgw.id}_${cupMatch.home_manager_id}`]
          const awayEt = etLineups[`${cgw.id}_${cupMatch.away_manager_id}`]
          if (homeEt?.players) playerIds.push(...homeEt.players.map((p) => p.id))
          if (awayEt?.players) playerIds.push(...awayEt.players.map((p) => p.id))
          break
        }
      }

      const results = playerIds.map((playerId) => ({
        player_id: playerId,
        goals: playerGoals[playerId] || 0,
        has_played: playerHasPlayed[playerId] || false,
      }))

      const response = await fetch(`/api/gameweeks/${selectedGameweek}/lineups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      if (response.ok) {
        toast.success('Wynik meczu zapisany')
        await fetchMatchData()
        await fetchCupMatches()
      } else {
        const error = await response.json()
        toast.error(`Błąd zapisu: ${error.error}`)
      }
    } catch {
      toast.error('Nie udało się zapisać wyniku meczu')
    } finally {
      setSaving(false)
    }
  }

  /** All starting players still missing a "rozegrał mecz" mark, labelled by manager. */
  const computeMissing = (): string[] => {
    const missing: string[] = []
    const seen = new Set<string>()
    const check = (players: PlayerWithResult[] | undefined, label: string) => {
      for (const p of players || []) {
        if (!playerHasPlayed[p.id]) {
          const entry = `${label}: ${p.name} ${p.surname}`
          if (!seen.has(entry)) {
            seen.add(entry)
            missing.push(entry)
          }
        }
      }
    }
    matchData?.matches.forEach((m) => {
      check(m.home_lineup?.players, getManagerDisplayName(m.home_manager))
      check(m.away_lineup?.players, getManagerDisplayName(m.away_manager))
    })
    cupGameweeks.forEach((cgw) => {
      cgw.matches.forEach((m) => {
        check(m.home_lineup?.players, `${getManagerDisplayName(m.home_manager)} (puchar)`)
        check(m.away_lineup?.players, `${getManagerDisplayName(m.away_manager)} (puchar)`)
      })
    })
    return missing
  }

  const openFinish = () => {
    setFinishMissing(computeMissing())
    setShowFinish(true)
  }

  const confirmFinish = async () => {
    if (!selectedGameweek || !gw) return
    setFinishing(true)
    try {
      const saved = await saveAllResults(true)
      if (!saved) {
        setFinishing(false)
        return
      }
      const response = await fetch(`/api/gameweeks/${selectedGameweek}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week: gw.week,
          start_date: gw.start_date,
          end_date: gw.end_date,
          lock_date: gw.lock_date,
          is_completed: true,
        }),
      })
      if (response.ok) {
        toast.success(`Kolejka ${gw.week} zakończona`)
        setShowFinish(false)
        await fetchGameweeks()
        await fetchMatchData()
        await fetchCupMatches()
      } else {
        const error = await response.json()
        toast.error(`Błąd: ${error.error}`)
      }
    } catch {
      toast.error('Nie udało się zakończyć kolejki')
    } finally {
      setFinishing(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
    { key: 'sklady', label: 'Składy', icon: ListChecks },
    { key: 'liga', label: 'Wyniki Ligi', icon: ClipboardList },
    ...(hasCup ? [{ key: 'puchar' as Tab, label: 'Wyniki Pucharu', icon: Trophy }] : []),
  ]

  if (loading && !matchData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#29544D]" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kolejka</h1>
          {gw && (
            <p className="text-sm text-gray-600 mt-1">
              Kolejka {gw.week} • {STATE_LABEL[state]}
            </p>
          )}
        </div>
        {canFinish && (
          <Button onClick={openFinish} icon={<CheckCircle2 size={18} />}>
            Zakończ kolejkę
          </Button>
        )}
      </div>

      {/* Gameweek selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Wybierz kolejkę</label>
        <select
          value={selectedGameweek}
          onChange={(e) => setSelectedGameweek(e.target.value)}
          className="w-full max-w-md p-2 sm:p-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29544D]"
        >
          <option value="">Wybierz kolejkę...</option>
          {gameweeks.map((g) => (
            <option key={g.id} value={g.id}>
              Kolejka {g.week}
              {g.is_completed ? ' (Zakończona)' : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedGameweek && matchData && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200" role="tablist">
            {tabs.map((t) => {
              const Icon = t.icon
              const active = activeTab === t.key
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    active
                      ? 'border-[#29544D] text-[#29544D]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'sklady' && (
            <SkladyTab
              matches={matchData.matches}
              leagueId={leagueId}
              gameweekId={selectedGameweek}
              canCorrect={canCorrect}
              onCorrected={() => {
                fetchMatchData().then(() => fetchCupMatches())
              }}
            />
          )}

          {activeTab === 'liga' && (
            <WynikiLigiTab
              matches={matchData.matches}
              playerGoals={playerGoals}
              playerHasPlayed={playerHasPlayed}
              onGoalsChange={handleGoalsChange}
              onHasPlayedChange={handleHasPlayedChange}
              onFocus={handleFocus}
              onSaveMatch={saveMatch}
              saving={saving}
              disabled={resultsDisabled}
            />
          )}

          {activeTab === 'puchar' && cup && (
            <WynikiPucharuTab
              cup={cup}
              cupGameweeks={cupGameweeks}
              leagueId={leagueId}
              playerGoals={playerGoals}
              playerHasPlayed={playerHasPlayed}
              etLineups={etLineups}
              penaltyLineups={penaltyLineups}
              penaltyGoals={penaltyGoals}
              onGoalsChange={handleGoalsChange}
              onHasPlayedChange={handleHasPlayedChange}
              onFocus={handleFocus}
              onSaveMatch={saveMatch}
              onPenaltyToggle={handlePenaltyToggle}
              onSavePenalties={savePenaltyResults}
              saving={saving}
              disabled={resultsDisabled}
              onCorrected={() => {
                fetchMatchData().then(() => fetchCupMatches())
              }}
            />
          )}

          {resultsDisabled && (activeTab === 'liga' || activeTab === 'puchar') && (
            <p className="text-xs text-gray-500">
              {state === 'open'
                ? 'Wpisywanie wyników będzie możliwe po zablokowaniu kolejki.'
                : 'Kolejka zakończona — wyniki są tylko do wglądu.'}
            </p>
          )}
        </>
      )}

      {showFinish && gw && (
        <FinishGameweekModal
          week={gw.week}
          missing={finishMissing}
          finishing={finishing}
          onConfirm={confirmFinish}
          onClose={() => setShowFinish(false)}
        />
      )}
    </div>
  )
}
