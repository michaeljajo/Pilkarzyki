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
import { Users, UserPlus, Edit3, Trash2, Calendar, AlertTriangle, Trophy, CheckCircle } from 'lucide-react'
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
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 -mt-16"
      >
        <h1 className="text-5xl font-bold text-[var(--foreground)]">
          Przegląd Ligi
        </h1>
        <p className="text-xl text-[var(--foreground-secondary)]">
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

      {/* League Name & Cup Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <div className="flex gap-4">
                  <Button onClick={updateLeagueName} loading={saving} icon={<CheckCircle size={18} />}>
                    Zapisz
                  </Button>
                  <Button onClick={() => setEditingName(false)} variant="secondary">
                    Anuluj
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-3xl font-semibold text-[var(--foreground)]">{league?.name}</span>
                <Button onClick={() => setEditingName(true)} variant="ghost" icon={<Edit3 size={18} />}>
                  Edytuj
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-yellow-800">
              🏆 Turniej Pucharowy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-yellow-700 mb-6">
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
            <div className="space-y-5 -ml-2">
              {managers.map((manager, index) => (
                <motion.div
                  key={manager.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex justify-between items-center p-6 pl-8 bg-[var(--background-tertiary)] rounded-2xl hover:bg-[var(--background-tertiary)]/90 transition-colors group"
                >
                  <div className="flex items-center gap-5">
                    <Avatar
                      fallback={`${manager.firstName} ${manager.lastName}`}
                      size="lg"
                    />
                    <div>
                      <div className="font-semibold text-lg text-[var(--foreground)]">
                        {manager.firstName} {manager.lastName}
                      </div>
                      <div className="text-base text-[var(--foreground-secondary)] mt-1">{manager.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base text-[var(--foreground-tertiary)]">Menedżer #{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--danger)] hover:bg-[var(--danger)]/10 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="space-y-8 max-h-[500px] overflow-y-auto pr-3 -ml-2">
              {schedule.map((gameweek, idx) => (
                <motion.div
                  key={gameweek.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border border-[var(--navy-border)]/30 rounded-2xl p-8 pl-10 bg-[var(--background-tertiary)]/60"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-semibold text-2xl text-[var(--foreground)]">
                      Kolejka {gameweek.week}
                    </h4>
                    <span
                      className={`px-4 py-2 text-sm font-semibold rounded-full ${
                        gameweek.is_completed
                          ? 'bg-[var(--success)]/20 text-[var(--success)]'
                          : 'bg-[var(--warning)]/20 text-[var(--warning)]'
                      }`}
                    >
                      {gameweek.is_completed ? 'Zakończona' : 'Oczekująca'}
                    </span>
                  </div>

                  {gameweek.matches && gameweek.matches.length > 0 ? (
                    <div className="space-y-4">
                      {gameweek.matches.map((match) => (
                        <div
                          key={match.id}
                          className="flex justify-between items-center p-5 pl-6 bg-[var(--background-secondary)] rounded-xl"
                        >
                          <div className="flex items-center gap-5">
                            <span className="font-medium text-base text-[var(--foreground)]">
                              {match.home_manager?.first_name} {match.home_manager?.last_name}
                            </span>
                            <span className="text-[var(--foreground-tertiary)]">vs</span>
                            <span className="font-medium text-base text-[var(--foreground)]">
                              {match.away_manager?.first_name} {match.away_manager?.last_name}
                            </span>
                          </div>
                          {match.is_completed && (
                            <div className="text-base font-bold text-[var(--mineral-green)]">
                              {match.home_score} - {match.away_score}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--foreground-secondary)] text-base">Brak meczy w tej kolejce</p>
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
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddManager(false)
                setSelectedUserId('')
              }}
              disabled={saving}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={() => addManager(selectedUserId)}
              loading={saving}
              disabled={filteredUsers.length === 0 || !selectedUserId}
              icon={<UserPlus size={18} />}
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
