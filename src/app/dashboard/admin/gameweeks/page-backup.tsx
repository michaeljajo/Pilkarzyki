'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'

interface League {
  id: string
  name: string
  season: string
}

interface Gameweek {
  id: string
  league_id: string
  week: number
  start_date: string
  end_date: string
  lock_date: string
  is_completed: boolean
  created_at: string
  leagues?: League
}

export default function GameweeksPage() {
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGameweek, setNewGameweek] = useState({
    league_id: '',
    week: 1,
    start_date: '',
    end_date: '',
    lock_date: ''
  })

  useEffect(() => {
    fetchGameweeks()
    fetchLeagues()
  }, [])

  const fetchGameweeks = async () => {
    try {
      const response = await fetch('/api/gameweeks')
      if (response.ok) {
        const data = await response.json()
        setGameweeks(data.gameweeks || [])
      }
    } catch (error) {
      console.error('Failed to fetch gameweeks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/leagues')
      if (response.ok) {
        const data = await response.json()
        setLeagues(data.leagues || [])
      }
    } catch (error) {
      console.error('Failed to fetch leagues:', error)
    }
  }

  const handleCreateGameweek = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/gameweeks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGameweek),
      })

      if (response.ok) {
        await fetchGameweeks()
        setShowCreateForm(false)
        setNewGameweek({ league_id: '', week: 1, start_date: '', end_date: '', lock_date: '' })
      } else {
        const error = await response.json()
        alert(`Error creating gameweek: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to create gameweek')
    } finally {
      setLoading(false)
    }
  }


  const deleteGameweek = async (gameweekId: string) => {
    if (!confirm('Are you sure you want to delete this gameweek?')) return

    try {
      const response = await fetch(`/api/gameweeks/${gameweekId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchGameweeks()
      } else {
        const error = await response.json()
        alert(`Error deleting gameweek: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to delete gameweek')
    }
  }

  if (loading && !showCreateForm) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gameweeks Management</h1>
          <p className="text-gray-600 mt-2">Manage fantasy football gameweeks and schedules</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + New Gameweek
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Gameweek</h2>
          <form onSubmit={handleCreateGameweek} className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  League
                </label>
                <select
                  value={newGameweek.league_id}
                  onChange={(e) => setNewGameweek({ ...newGameweek, league_id: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select League</option>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name} ({league.season})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Week Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="38"
                  value={newGameweek.week}
                  onChange={(e) => setNewGameweek({ ...newGameweek, week: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newGameweek.start_date}
                  onChange={(e) => setNewGameweek({ ...newGameweek, start_date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={newGameweek.end_date}
                  onChange={(e) => setNewGameweek({ ...newGameweek, end_date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lock Date
                </label>
                <input
                  type="datetime-local"
                  value={newGameweek.lock_date}
                  onChange={(e) => setNewGameweek({ ...newGameweek, lock_date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Gameweek'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  League
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gameweeks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No gameweeks found. Create your first gameweek to get started.
                  </td>
                </tr>
              ) : (
                gameweeks.map((gameweek) => (
                  <tr key={gameweek.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gameweek.leagues?.name || 'Unknown'} ({gameweek.leagues?.season || 'N/A'})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Week {gameweek.week}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(gameweek.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(gameweek.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {gameweek.is_completed ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => deleteGameweek(gameweek.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </AdminLayout>
  )
}