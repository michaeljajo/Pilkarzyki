'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { Calendar, Trash2, Plus, AlertCircle, ArrowLeft, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

interface LeagueGameweek {
  id: string
  week: number
  start_date: string
  end_date: string
  lock_date: string
}

interface GameweekMapping {
  cupWeek: number
  leagueGameweekId: string
}

// Helper function to get stage label for a cup week
function getStageLabel(cupWeek: number, totalManagers: number): string {
  if (totalManagers === 4) {
    if (cupWeek <= 2) return `Group Stage`
    if (cupWeek <= 4) return `Semi-Final Leg ${cupWeek - 2}`
    return 'Final'
  }
  // Add logic for 8, 16, 32 team cups later
  return 'Group Stage'
}

export default function CupSchedulePage() {
  const params = useParams()
  const router = useRouter()
  const [cup, setCup] = useState<{ id: string; name: string; league_id: string } | null>(null)
  const [leagueGameweeks, setLeagueGameweeks] = useState<LeagueGameweek[]>([])
  const [mappings, setMappings] = useState<GameweekMapping[]>([])
  interface CupGameweek {
    id: string
    cup_week: number
    league_gameweek_id: string
    matches: Array<{
      id: string
      group_name: string | null
      home_manager: { first_name: string | null; last_name: string | null } | null
      away_manager: { first_name: string | null; last_name: string | null } | null
      stage: string
    }>
  }
  const [schedule, setSchedule] = useState<CupGameweek[]>([])
  const [hasSchedule, setHasSchedule] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [requiredGameweeks, setRequiredGameweeks] = useState(6) // Default estimate
  const [totalManagers, setTotalManagers] = useState(4) // Default to 4

  useEffect(() => {
    if (params.id) {
      fetchData()
    }
  }, [params.id])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch cup
      const cupResponse = await fetch(`/api/cups?leagueId=${params.id}`)
      const cupData = await cupResponse.json()

      if (!cupResponse.ok || !cupData.cup) {
        setError('Cup not found. Please create a cup first.')
        router.push(`/dashboard/admin/leagues/${params.id}/cup`)
        return
      }

      setCup(cupData.cup)

      // Fetch league gameweeks
      const gameweeksResponse = await fetch(`/api/leagues/${params.id}/gameweeks`)
      const gameweeksData = await gameweeksResponse.json()

      if (gameweeksResponse.ok) {
        setLeagueGameweeks(gameweeksData.gameweeks || [])
      }

      // Fetch existing cup schedule
      const scheduleResponse = await fetch(`/api/cups/${cupData.cup.id}/schedule`)
      const scheduleData = await scheduleResponse.json()

      if (scheduleResponse.ok && scheduleData.schedule && scheduleData.schedule.length > 0) {
        setSchedule(scheduleData.schedule)
        setHasSchedule(true)

        // Extract mappings from existing schedule
        interface ScheduleGameweekData {
          cup_week: number
          league_gameweek_id: string
        }
        const existingMappings: GameweekMapping[] = scheduleData.schedule.map((gw: ScheduleGameweekData) => ({
          cupWeek: gw.cup_week,
          leagueGameweekId: gw.league_gameweek_id
        }))
        setMappings(existingMappings)
      } else {
        setHasSchedule(false)
        // Get number of managers from groups to determine structure
        const groupsResponse = await fetch(`/api/cups/${cupData.cup.id}/groups`)
        const groupsData = await groupsResponse.json()

        const groups = groupsData.groups || {}
        const numManagers = Object.values(groups).reduce((sum: number, group: unknown[]) => sum + group.length, 0)

        // For 4-team cup: 2 group + 2 semi-final + 1 final = 5 gameweeks
        // For 8-team cup: 6 group + 2 quarter + 2 semi + 1 final = 11 gameweeks
        // For 16-team: 12 group + 2 R16 + 2 quarter + 2 semi + 1 final = 19 gameweeks
        const requiredGWs = numManagers === 4 ? 5 : numManagers === 8 ? 11 : 19

        setTotalManagers(numManagers)
        setRequiredGameweeks(requiredGWs)
        setMappings(Array.from({ length: requiredGWs }, (_, i) => ({
          cupWeek: i + 1,
          leagueGameweekId: ''
        })))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  function addMapping() {
    const nextCupWeek = mappings.length + 1
    setMappings([...mappings, { cupWeek: nextCupWeek, leagueGameweekId: '' }])
  }

  function removeMapping(index: number) {
    if (mappings.length <= 1) return
    setMappings(mappings.filter((_, i) => i !== index))
  }

  function updateMapping(index: number, leagueGameweekId: string) {
    const newMappings = [...mappings]
    newMappings[index].leagueGameweekId = leagueGameweekId
    setMappings(newMappings)
  }

  async function generateSchedule() {
    try {
      setSaving(true)

      // Validate all mappings are complete
      const incompleteMappings = mappings.filter(m => !m.leagueGameweekId)
      if (incompleteMappings.length > 0) {
        setError('Please select a league gameweek for all cup gameweeks')
        return
      }

      // Validate no duplicate league gameweeks
      const gameweekIds = mappings.map(m => m.leagueGameweekId)
      const uniqueIds = new Set(gameweekIds)
      if (uniqueIds.size !== gameweekIds.length) {
        setError('Each league gameweek can only be used once')
        return
      }

      const response = await fetch(`/api/cups/${cup.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameweekMappings: mappings })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate schedule')
      }

      setSuccess(`Schedule generated successfully! ${data.stats.totalMatches} matches across ${data.stats.totalGameweeks} gameweeks.`)
      setTimeout(() => fetchData(), 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSchedule() {
    if (!cup || !confirm('Are you sure you want to delete the cup schedule? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/cups/${cup.id}/schedule`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete schedule')
      }

      setSuccess('Cup schedule deleted successfully')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-[var(--background-secondary)] rounded-xl w-1/3"></div>
        <div className="h-64 bg-[var(--background-secondary)] rounded-xl"></div>
      </div>
    )
  }

  if (!cup) {
    return (
      <div className="text-center py-12">
        <Alert variant="error">Cup not found</Alert>
      </div>
    )
  }

  // Get used league gameweek IDs
  const usedGameweekIds = new Set(mappings.map(m => m.leagueGameweekId).filter(Boolean))

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-start"
      >
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push(`/dashboard/admin/leagues/${params.id}/cup`)}
            variant="ghost"
            icon={<ArrowLeft size={18} />}
            className="mb-2 -ml-2"
          >
            Powrót do Przeglądu Pucharu
          </Button>
          <h1 className="text-5xl font-bold text-[var(--foreground)]">
            Harmonogram Pucharu
          </h1>
          <p className="text-xl text-[var(--foreground-secondary)]">
            Zmapuj kolejki pucharowe do kolejek ligi i wygeneruj mecze
          </p>
        </div>
        {hasSchedule && (
          <Button
            onClick={deleteSchedule}
            loading={saving}
            variant="danger"
            icon={<Trash2 size={18} />}
          >
            Usuń Harmonogram
          </Button>
        )}
      </motion.div>

      {/* Messages */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {!hasSchedule ? (
        <>
          {/* Info Alert */}
          <Alert variant="info">
            <strong>Instrukcje Konfiguracji:</strong> Zmapuj każdą kolejkę pucharową do kolejki ligi. Mecze pucharowe będą rozgrywane równolegle z meczami ligi w wybranych kolejkach.
          </Alert>

          {/* Gameweek Mappings */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Calendar size={28} className="text-[var(--mineral-green)]" />
                Mapowanie Kolejek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mappings.map((mapping, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-[var(--background-tertiary)] rounded-xl"
                  >
                    <div className="w-48 flex flex-col gap-1">
                      <span className="font-semibold text-lg">Kolejka Pucharu {mapping.cupWeek}</span>
                      <span className="text-sm text-[var(--foreground-secondary)]">
                        {getStageLabel(mapping.cupWeek, totalManagers)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={mapping.leagueGameweekId}
                        onChange={(e) => updateMapping(index, e.target.value)}
                        fullWidth
                      >
                        <option value="">Wybierz kolejkę ligi...</option>
                        {leagueGameweeks.map(gw => (
                          <option
                            key={gw.id}
                            value={gw.id}
                            disabled={usedGameweekIds.has(gw.id) && mapping.leagueGameweekId !== gw.id}
                          >
                            Kolejka Ligi {gw.week}
                            {usedGameweekIds.has(gw.id) && mapping.leagueGameweekId !== gw.id ? ' (Już użyta)' : ''}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button
                      onClick={() => removeMapping(index)}
                      variant="ghost"
                      size="sm"
                      disabled={mappings.length <= 1}
                      icon={<Trash2 size={16} />}
                    >
                      Usuń
                    </Button>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={addMapping}
                  variant="secondary"
                  icon={<Plus size={18} />}
                  disabled={mappings.length >= leagueGameweeks.length}
                >
                  Dodaj Kolejkę
                </Button>
                <Button
                  onClick={generateSchedule}
                  loading={saving}
                  icon={<Calendar size={18} />}
                  disabled={mappings.some(m => !m.leagueGameweekId)}
                >
                  Generuj Harmonogram Pucharu
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Schedule Generated */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Calendar size={28} className="text-[var(--mineral-green)]" />
                Wygenerowany Harmonogram ({schedule.length} kolejek)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-3">
                {schedule.map((cupGameweek, idx) => (
                  <motion.div
                    key={cupGameweek.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-[var(--navy-border)]/30 rounded-xl p-6 bg-[var(--background-tertiary)]/60"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-semibold text-xl text-[var(--foreground)]">
                          Kolejka Pucharu {cupGameweek.cup_week}
                        </h4>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                          Kolejka Ligi {cupGameweek.gameweeks?.week} • {cupGameweek.stage.replace('_', ' ')}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--mineral-green)]/20 text-[var(--mineral-green)]">
                        {cupGameweek.matches?.length || 0} meczów
                      </span>
                    </div>

                    {cupGameweek.matches && cupGameweek.matches.length > 0 ? (
                      <div className="space-y-2">
                        {cupGameweek.matches.map((match: {
                          id: string
                          group_name: string | null
                          home_manager: { first_name: string | null; last_name: string | null } | null
                          away_manager: { first_name: string | null; last_name: string | null } | null
                          stage: string
                        }) => (
                          <div
                            key={match.id}
                            className="flex justify-between items-center p-3 bg-[var(--background-secondary)] rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {match.group_name && (
                                <span className="w-8 h-8 rounded-full bg-[var(--mineral-green)]/20 flex items-center justify-center text-sm font-bold text-[var(--mineral-green)]">
                                  {match.group_name}
                                </span>
                              )}
                              <span className="font-medium text-sm">
                                {match.home_manager?.first_name} {match.home_manager?.last_name}
                              </span>
                              <span className="text-[var(--foreground-tertiary)] text-sm">vs</span>
                              <span className="font-medium text-sm">
                                {match.away_manager?.first_name} {match.away_manager?.last_name}
                              </span>
                            </div>
                            {match.is_completed && (
                              <div className="text-sm font-bold text-[var(--mineral-green)]">
                                {match.home_score} - {match.away_score}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--foreground-secondary)] text-sm">Brak meczów</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Knockout Bracket Visualization */}
          {totalManagers === 4 && (
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Trophy size={28} className="text-[var(--mineral-green)]" />
                  Struktura Pucharowa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-8 py-8">
                  {/* Semi-Finals */}
                  <div className="flex gap-16">
                    <div className="text-center">
                      <div className="text-sm text-[var(--foreground-secondary)] mb-2">Półfinał 1</div>
                      <div className="border-2 border-[var(--mineral-green)] rounded-lg p-4 bg-[var(--mineral-green)]/5 min-w-[200px]">
                        <div className="font-semibold">Zwycięzca Grupy A</div>
                        <div className="text-sm text-[var(--foreground-secondary)]">vs</div>
                        <div className="font-semibold">Wicemistrz Grupy B</div>
                      </div>
                      <div className="text-xs text-[var(--foreground-tertiary)] mt-2">
                        Kolejki {schedule.find(s => s.stage === 'semi_final')?.cup_week || '3-4'} (2 mecze)
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-[var(--foreground-secondary)] mb-2">Półfinał 2</div>
                      <div className="border-2 border-[var(--mineral-green)] rounded-lg p-4 bg-[var(--mineral-green)]/5 min-w-[200px]">
                        <div className="font-semibold">Wicemistrz Grupy A</div>
                        <div className="text-sm text-[var(--foreground-secondary)]">vs</div>
                        <div className="font-semibold">Zwycięzca Grupy B</div>
                      </div>
                      <div className="text-xs text-[var(--foreground-tertiary)] mt-2">
                        Kolejki {schedule.find(s => s.stage === 'semi_final')?.cup_week || '3-4'} (2 mecze)
                      </div>
                    </div>
                  </div>

                  {/* Arrow Down */}
                  <div className="text-3xl text-[var(--foreground-tertiary)]">↓</div>

                  {/* Final */}
                  <div className="text-center">
                    <div className="text-sm text-[var(--foreground-secondary)] mb-2">Finał</div>
                    <div className="border-4 border-yellow-500 rounded-lg p-6 bg-yellow-50 min-w-[200px]">
                      <div className="font-bold text-lg">🏆 Zwycięzca PF1</div>
                      <div className="text-sm text-[var(--foreground-secondary)]">vs</div>
                      <div className="font-bold text-lg">🏆 Zwycięzca PF2</div>
                    </div>
                    <div className="text-xs text-[var(--foreground-tertiary)] mt-2">
                      Kolejka {schedule.find(s => s.stage === 'final')?.cup_week || '5'} (1 mecz)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
