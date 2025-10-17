'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { League, User } from '@/types'

interface AddManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userId: string) => void
  loading: boolean
  availableUsers: User[]
  currentManagers: User[]
}

function AddManagerModal({ isOpen, onClose, onSubmit, loading, availableUsers, currentManagers }: AddManagerModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('')

  if (!isOpen) return null

  // Filter out users who are already managers in this league
  const currentManagerIds = currentManagers.map(m => m.id)
  const filteredUsers = availableUsers.filter(user => !currentManagerIds.includes(user.id))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUserId) {
      onSubmit(selectedUserId)
      setSelectedUserId('')
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Manager to League</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No available users to add as managers</p>
                <p className="text-sm">All registered users are already managers in this league</p>
              </div>
            ) : (
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a user...</option>
                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={filteredUsers.length === 0 || !selectedUserId}
              className="flex-1"
            >
              Add Manager
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LeagueDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [league, setLeague] = useState<League | null>(null)
  const [managers, setManagers] = useState<User[]>([])
  interface ScheduleGameweek {
    id: string
    week: number
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
      // Fetch league, managers, schedule, and all users in parallel
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

      // Handle managers response (might be 404 if no managers yet)
      if (managersRes.ok) {
        setManagers(managersData.managers || [])
      } else {
        setManagers([])
      }

      // Handle schedule response (might be 404 if none exist yet)
      if (scheduleRes.ok) {
        setSchedule(scheduleData.schedule || [])
        setHasSchedule(scheduleData.hasSchedule || false)
      } else {
        setSchedule([])
        setHasSchedule(false)
      }

      // Handle all users response
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

      // Refresh managers list
      await fetchLeagueData(params.id as string)
      setShowAddManager(false)
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

      // Refresh managers list
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

      // Wait a moment to ensure database consistency, then refresh the league data
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

      // Refresh the league data
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
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error && !league) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">League Overview</h1>
            <p className="mt-1 text-gray-600">Manage all aspects of your league</p>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400">✅</span>
              </div>
              <div className="ml-3">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* League Name */}
          <Card>
            <CardHeader>
              <CardTitle>League Name</CardTitle>
            </CardHeader>
            <CardContent>
              {editingName ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <Button onClick={updateLeagueName} loading={saving} size="sm">Save</Button>
                    <Button onClick={() => setEditingName(false)} variant="secondary" size="sm">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">{league?.name}</span>
                  <Button onClick={() => setEditingName(true)} variant="secondary" size="sm">Edit</Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Managers List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>League Managers ({managers.length})</CardTitle>
              <Button onClick={() => setShowAddManager(true)}>Add Manager</Button>
            </div>
          </CardHeader>
          <CardContent>
            {managers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">👥</div>
                <p>No managers added to this league yet</p>
                <Button onClick={() => setShowAddManager(true)} className="mt-4">
                  Add First Manager
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {managers.map((manager, index) => (
                  <div key={manager.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{manager.firstName} {manager.lastName}</div>
                      <div className="text-sm text-gray-600">{manager.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Manager #{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => removeManager(manager.id, `${manager.firstName} ${manager.lastName}`)}
                        disabled={saving}
                      >
                        {saving ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* League Schedule */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>League Schedule</CardTitle>
              {hasSchedule ? (
                <Button
                  onClick={deleteSchedule}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {saving ? 'Deleting...' : 'Delete Schedule'}
                </Button>
              ) : (
                <Button
                  onClick={generateSchedule}
                  disabled={managers.length < 2 || saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Generating...' : 'Generate Schedule'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!hasSchedule ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📅</div>
                <p className="mb-2">No schedule generated yet</p>
                {managers.length < 2 ? (
                  <p className="text-sm text-red-600 mb-4">
                    Add at least 2 managers to generate a schedule
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">
                    Ready to generate a {2 * (managers.length - 1)} gameweek schedule for {managers.length} managers
                  </p>
                )}
                <Button
                  onClick={generateSchedule}
                  disabled={managers.length < 2 || saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Generating...' : 'Generate Professional League Schedule'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {schedule.map((gameweek) => (
                  <div key={gameweek.id} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-lg mb-3 text-gray-900">
                      Gameweek {gameweek.week}
                      <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                        gameweek.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {gameweek.is_completed ? 'Completed' : 'Pending'}
                      </span>
                    </h4>

                    {gameweek.matches && gameweek.matches.length > 0 ? (
                      <div className="space-y-2">
                        {gameweek.matches.map((match) => (
                          <div key={match.id} className="flex justify-between items-center p-3 bg-white rounded border">
                            <div className="flex items-center space-x-4">
                              <span className="font-medium">
                                {match.home_manager?.first_name} {match.home_manager?.last_name}
                              </span>
                              <span className="text-gray-500">vs</span>
                              <span className="font-medium">
                                {match.away_manager?.first_name} {match.away_manager?.last_name}
                              </span>
                            </div>
                            {match.is_completed && (
                              <div className="text-sm font-semibold">
                                {match.home_score} - {match.away_score}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No matches in this gameweek</p>
                    )}
                  </div>
                ))}

                {schedule.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p>Schedule exists but no gameweeks found</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">Delete League</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Permanently delete this league and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button
                onClick={deleteLeague}
                loading={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete League
              </Button>
            </div>
          </CardContent>
        </Card>

        <AddManagerModal
          isOpen={showAddManager}
          onClose={() => setShowAddManager(false)}
          onSubmit={addManager}
          loading={saving}
          availableUsers={allUsers}
          currentManagers={managers}
        />
      </div>
  )
}