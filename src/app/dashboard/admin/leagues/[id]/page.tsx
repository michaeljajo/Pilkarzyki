'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import { League, User } from '@/types'
import { Users, UserPlus, Edit3, Trash2, Calendar, AlertTriangle, Trophy, CheckCircle, Download } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LeagueDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [league, setLeague] = useState<League | null>(null)
  const [managers, setManagers] = useState<User[]>([])
  interface ScheduleGameweek {
    id: string
    week: number
    is_completed?: boolean
    matches: Array<{
      id: string
      home_manager: { first_name: string | null; last_name: string | null; email: string } | null
      away_manager: { first_name: string | null; last_name: string | null; email: string } | null
      home_score: number | null
      away_score: number | null
      is_completed: boolean
    }>
  }
  const [schedule, setSchedule] = useState<ScheduleGameweek[]>([])
  const [hasSchedule, setHasSchedule] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddManager, setShowAddManager] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [formData, setFormData] = useState({
    name: ''
  })
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchLeagueData(params.id as string)
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

  async function fetchLeagueData(id: string) {
    try {
      setLoading(true)
      const [leagueRes, managersRes, scheduleRes, usersRes] = await Promise.all([
        fetch(`/api/leagues/${id}`),
        fetch(`/api/leagues/${id}/managers`),
        fetch(`/api/leagues/${id}/schedule`),
        fetch(`/api/users`)
      ])

      const [leagueData, managersData, scheduleData, usersData] = await Promise.all([
        leagueRes.json(),
        managersRes.json(),
        scheduleRes.json(),
        usersRes.json()
      ])

      if (!leagueRes.ok) {
        throw new Error(leagueData.error || 'Failed to fetch league')
      }

      setLeague(leagueData.league)
      setFormData({
        name: leagueData.league.name
      })

      if (managersRes.ok) {
        setManagers(managersData.managers || [])
      } else {
        setManagers([])
      }

      if (scheduleRes.ok) {
        setSchedule(scheduleData.schedule || [])
        setHasSchedule(scheduleData.hasSchedule || false)
      } else {
        setSchedule([])
        setHasSchedule(false)
      }

      if (usersRes.ok) {
        setAllUsers(usersData.users || [])
      } else {
        setAllUsers([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function updateLeagueName() {
    if (!league || formData.name === league.name) {
      setEditingName(false)
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/leagues/${league.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, isActive: league.isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update league name')
      }

      const data = await response.json()
      setLeague(data.league)
      setEditingName(false)
      setSuccess('League name updated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update league name')
    } finally {
      setSaving(false)
    }
  }

  async function addManager(userId: string) {
    try {
      setSaving(true)
      const response = await fetch(`/api/leagues/${league?.id}/managers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add manager')
      }

      await fetchLeagueData(params.id as string)
      setShowAddManager(false)
      setSelectedUserId('')
      setSuccess('Manager added successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add manager')
    } finally {
      setSaving(false)
    }
  }

  async function removeManager(managerId: string, managerName: string) {
    if (!confirm(`Are you sure you want to remove ${managerName} from this league? This action cannot be undone.`)) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      const response = await fetch(`/api/leagues/${league?.id}/managers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove manager')
      }

      setSuccess(`${managerName} has been removed from the league`)
      await fetchLeagueData(params.id as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove manager')
    } finally {
      setSaving(false)
    }
  }

  async function generateSchedule() {
    if (!league || managers.length < 2) {
      setError('Need at least 2 managers to generate schedule')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const response = await fetch(`/api/leagues/${league.id}/schedule`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate schedule')
      }

      setSuccess(`Schedule generated successfully! ${data.stats.totalMatches} matches across ${data.stats.totalGameweeks} gameweeks.`)
      setTimeout(async () => {
        await fetchLeagueData(params.id as string)
      }, 200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSchedule() {
    if (!league || !confirm('Are you sure you want to delete the entire schedule? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      const response = await fetch(`/api/leagues/${league.id}/schedule`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete schedule')
      }

      setSuccess('Schedule deleted successfully')
      await fetchLeagueData(params.id as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule')
    } finally {
      setSaving(false)
    }
  }

  async function deleteLeague() {
    if (!league || !confirm(`Are you sure you want to delete "${league.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/leagues/${league.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete league')
      }

      router.push('/dashboard/admin/leagues')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete league')
      setSaving(false)
    }
  }

  async function exportToExcel() {
    if (!league) return

    try {
      setExporting(true)
      setError(null)
      const response = await fetch(`/api/admin/leagues/${league.id}/export`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to export data')
      }

      // Get the blob from response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${league.name}_${league.season}_Export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess('Data exported successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data')
    } finally {
      setExporting(false)
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

  if (error && !league) {
    return (
      <div className="text-center py-12">
        <Alert variant="error">{error}</Alert>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  const currentManagerIds = managers.map(m => m.id)
  const filteredUsers = allUsers.filter(user => !currentManagerIds.includes(user.id))

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:gap-3"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--foreground)]">
          Przegląd Ligi
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-[var(--foreground-secondary)]">
          Zarządzaj wszystkimi aspektami swojej ligi
        </p>
      </motion.div>

      {/* Error and Success Messages */}
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

      {/* League Name & Cup Access & Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy size={28} className="text-[var(--mineral-green)]" />
              Nazwa Ligi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingName ? (
              <div className="space-y-6">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter league name"
                  fullWidth
                />
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button onClick={updateLeagueName} loading={saving} icon={<CheckCircle size={18} />} className="w-full sm:w-auto">
                    Zapisz
                  </Button>
                  <Button onClick={() => setEditingName(false)} variant="secondary" className="w-full sm:w-auto">
                    Anuluj
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <span className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">{league?.name}</span>
                <Button onClick={() => setEditingName(true)} variant="ghost" icon={<Edit3 size={18} />} className="w-full sm:w-auto">
                  Edytuj
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-yellow-800">
              🏆 Turniej Pucharowy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-yellow-700 mb-4 sm:mb-6">
              Zarządzaj turniejami pucharowymi równolegle z ligą
            </p>
            <Button
              onClick={() => router.push(`/dashboard/admin/leagues/${params.id}/cup`)}
              variant="secondary"
              size="lg"
              className="w-full !bg-yellow-500 hover:!bg-yellow-600 !text-white !border-0"
            >
              Zarządzaj Pucharem
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-800">
              <Download size={28} className="text-green-600" />
              Eksport do Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-green-700 mb-4 sm:mb-6">
              Eksportuj wszystkie dane ligi i pucharu do pliku Excel
            </p>
            <Button
              onClick={exportToExcel}
              loading={exporting}
              variant="secondary"
              size="lg"
              className="w-full !bg-green-500 hover:!bg-green-600 !text-white !border-0"
              icon={<Download size={18} />}
            >
              {exporting ? 'Eksportowanie...' : 'Pobierz Excel'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Managers List */}
      <Card className="hover-lift">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-3">
              <Users size={28} className="text-[var(--mineral-green)]" />
              Menedżerowie Ligi ({managers.length})
            </CardTitle>
            <Button
              onClick={() => setShowAddManager(true)}
              icon={<UserPlus size={18} />}
              size="lg"
            >
              Dodaj Menedżera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {managers.length === 0 ? (
            <EmptyState
              icon={<Users size={56} />}
              title="Brak menedżerów"
              description="Dodaj menedżerów, aby rozpocząć budowanie ligi"
              action={{
                label: 'Dodaj Pierwszego Menedżera',
                onClick: () => setShowAddManager(true),
                icon: <UserPlus size={18} />
              }}
            />
          ) : (
            <div className="space-y-3 sm:space-y-5">
              {managers.map((manager, index) => (
                <motion.div
                  key={manager.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 bg-[var(--background-tertiary)] rounded-2xl hover:bg-[var(--background-tertiary)]/90 transition-colors group"
                >
                  <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
                    <Avatar
                      fallback={`${manager.firstName} ${manager.lastName}`}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base sm:text-lg text-[var(--foreground)] truncate">
                        {manager.firstName} {manager.lastName}
                      </div>
                      <div className="text-sm sm:text-base text-[var(--foreground-secondary)] mt-1 truncate">{manager.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-sm sm:text-base text-[var(--foreground-tertiary)]">Menedżer #{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--danger)] hover:bg-[var(--danger)]/10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={() => removeManager(manager.id, `${manager.firstName} ${manager.lastName}`)}
                      disabled={saving}
                      icon={<Trash2 size={16} />}
                    >
                      Usuń
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* League Schedule */}
      <Card className="hover-lift">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-3">
              <Calendar size={28} className="text-[var(--mineral-green)]" />
              Harmonogram Ligi
            </CardTitle>
            {hasSchedule ? (
              <Button
                onClick={deleteSchedule}
                disabled={saving}
                variant="danger"
                icon={<Trash2 size={18} />}
              >
                Usuń Harmonogram
              </Button>
            ) : (
              <Button
                onClick={generateSchedule}
                disabled={managers.length < 2 || saving}
                size="lg"
                icon={<Calendar size={18} />}
              >
                Generuj Harmonogram
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasSchedule ? (
            <EmptyState
              icon={<Calendar size={56} />}
              title="Nie wygenerowano jeszcze harmonogramu"
              description={
                managers.length < 2
                  ? 'Dodaj co najmniej 2 menedżerów, aby wygenerować harmonogram'
                  : `Gotowy do wygenerowania harmonogramu ${2 * (managers.length - 1)} kolejek dla ${managers.length} menedżerów`
              }
              action={
                managers.length >= 2
                  ? {
                      label: 'Generuj Profesjonalny Harmonogram Ligi',
                      onClick: generateSchedule,
                      icon: <Calendar size={18} />,
                      disabled: saving
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-h-[500px] overflow-y-auto pr-2 sm:pr-3">
              {schedule.map((gameweek, idx) => (
                <motion.div
                  key={gameweek.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border border-[var(--navy-border)]/30 rounded-2xl p-4 sm:p-6 lg:p-8 bg-[var(--background-tertiary)]/60"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <h4 className="font-semibold text-xl sm:text-2xl text-[var(--foreground)]">
                      Kolejka {gameweek.week}
                    </h4>
                    <span
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full ${
                        gameweek.is_completed
                          ? 'bg-[var(--success)]/20 text-[var(--success)]'
                          : 'bg-[var(--warning)]/20 text-[var(--warning)]'
                      }`}
                    >
                      {gameweek.is_completed ? 'Zakończona' : 'Oczekująca'}
                    </span>
                  </div>

                  {gameweek.matches && gameweek.matches.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {gameweek.matches.map((match) => (
                        <div
                          key={match.id}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 p-3 sm:p-5 bg-[var(--background-secondary)] rounded-xl"
                        >
                          <div className="flex flex-wrap items-center gap-2 sm:gap-5 w-full sm:w-auto">
                            <span className="font-medium text-sm sm:text-base text-[var(--foreground)]">
                              {match.home_manager?.first_name} {match.home_manager?.last_name}
                            </span>
                            <span className="text-[var(--foreground-tertiary)] text-sm sm:text-base">vs</span>
                            <span className="font-medium text-sm sm:text-base text-[var(--foreground)]">
                              {match.away_manager?.first_name} {match.away_manager?.last_name}
                            </span>
                          </div>
                          {match.is_completed && (
                            <div className="text-sm sm:text-base font-bold text-[var(--mineral-green)]">
                              {match.home_score} - {match.away_score}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--foreground-secondary)] text-sm sm:text-base">Brak meczy w tej kolejce</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Manager Modal */}
      <Modal
        isOpen={showAddManager}
        onClose={() => {
          setShowAddManager(false)
          setSelectedUserId('')
        }}
        title="Dodaj Menedżera do Ligi"
        description="Wybierz użytkownika z listy, aby dodać go jako menedżera"
        icon={<UserPlus size={24} />}
        footer={
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddManager(false)
                setSelectedUserId('')
              }}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={() => addManager(selectedUserId)}
              loading={saving}
              disabled={filteredUsers.length === 0 || !selectedUserId}
              icon={<UserPlus size={18} />}
              className="w-full sm:w-auto"
            >
              Dodaj Menedżera
            </Button>
          </div>
        }
      >
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={<Users size={32} />}
            title="Brak dostępnych użytkowników"
            description="Wszyscy zarejestrowani użytkownicy są już menedżerami w tej lidze"
          />
        ) : (
          <Select
            label="Wybierz Użytkownika"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            fullWidth
            required
          >
            <option value="">Wybierz użytkownika...</option>
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </Select>
        )}
      </Modal>
    </div>
  )
}
