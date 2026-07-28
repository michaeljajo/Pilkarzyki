'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LeagueNavigation } from '@/components/LeagueNavigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { validateTeamName } from '@/utils/team-name-resolver'

interface LeagueSettingsPageProps {
  params: Promise<{ id: string }>
}

interface Squad {
  id: string
  manager_id: string
  league_id: string
  team_name?: string | null
}

export default function LeagueSettingsPage({ params }: LeagueSettingsPageProps) {
  const router = useRouter()
  const [leagueId, setLeagueId] = useState<string>('')
  const [leagueName, setLeagueName] = useState<string>('')
  const [squad, setSquad] = useState<Squad | null>(null)
  const [teamName, setTeamName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params
      setLeagueId(resolvedParams.id)

      // Fetch league name and squad info
      try {
        const [leagueResponse, squadResponse] = await Promise.all([
          fetch(`/api/manager/leagues/${resolvedParams.id}`),
          fetch(`/api/manager/leagues/${resolvedParams.id}/squad-info`)
        ])

        if (leagueResponse.ok) {
          const data = await leagueResponse.json()
          setLeagueName(data.league?.name || 'League')
        }

        if (squadResponse.ok) {
          const squadData = await squadResponse.json()
          if (squadData.squad) {
            setSquad(squadData.squad)
            setTeamName(squadData.squad.team_name || '')
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setError('Nie udało się załadować danych')
      } finally {
        setLoading(false)
      }
    }
    resolveParams()
  }, [params])

  const handleSave = async () => {
    if (!squad) return

    setError(null)
    setSuccess(false)

    // Validate team name
    const validation = validateTeamName(teamName)
    if (!validation.valid) {
      setError(validation.error || 'Nieprawidłowa nazwa')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/squads/${squad.id}/team-name`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Nie udało się zapisać nazwy')
      }

      setSuccess(true)
      setSquad({ ...squad, team_name: teamName })

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <LeagueNavigation
          leagueId={leagueId}
          leagueName={leagueName}
          currentPage="settings"
        />
        <main className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '64px', paddingBottom: '96px' }}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </main>
      </div>
    )
  }

  if (!squad) {
    return (
      <div className="min-h-screen bg-white">
        <LeagueNavigation
          leagueId={leagueId}
          leagueName={leagueName}
          currentPage="settings"
        />
        <main className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '64px', paddingBottom: '96px' }}>
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600">Nie jesteś członkiem tej ligi</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <LeagueNavigation
        leagueId={leagueId}
        leagueName={leagueName}
        currentPage="settings"
      />

      <main className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '64px', paddingBottom: '96px' }}>
        <Card>
          <CardHeader>
            <CardTitle>Ustawienia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Team Name Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nazwa Drużyny
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Twoja nazwa drużyny będzie wyświetlana w całej lidze zamiast twojego imienia i nazwiska.
                </p>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Wprowadź nazwę drużyny"
                  className="w-full max-w-md px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  maxLength={30}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {teamName.length}/30 znaków (minimum 3)
                </p>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">
                      ✓ Nazwa drużyny została zapisana pomyślnie!
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving || teamName === squad.team_name}
                  loading={saving}
                >
                  {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setTeamName(squad.team_name || '')}
                  disabled={saving || teamName === squad.team_name}
                >
                  Anuluj
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
