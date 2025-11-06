'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { validateTeamName } from '@/utils/team-name-resolver'

interface TeamNameModalProps {
  squadId: string
  leagueName: string
  onSuccess: (teamName: string) => void
}

export function TeamNameModal({ squadId, leagueName, onSuccess }: TeamNameModalProps) {
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate team name
    const validation = validateTeamName(teamName)
    if (!validation.valid) {
      setError(validation.error || 'Nieprawidłowa nazwa drużyny')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/squads/${squadId}/team-name`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName: teamName.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        onSuccess(data.teamName)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Nie udało się ustawić nazwy drużyny')
      }
    } catch (error) {
      console.error('Failed to set team name:', error)
      setError('Wystąpił błąd podczas ustawiania nazwy drużyny')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ padding: '24px' }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" style={{ padding: '32px' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Witaj w lidze!
          </h2>
          <p className="text-gray-600">
            Aby rozpocząć grę w lidze <span className="font-semibold">{leagueName}</span>, nadaj swoją nazwę drużyny.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
              Nazwa drużyny
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value)
                setError(null)
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="np. Piłkarskie Legendy"
              maxLength={30}
              autoFocus
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              3-30 znaków, tylko litery, cyfry i spacje
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !teamName.trim()}
            >
              {loading ? 'Zapisywanie...' : 'Zatwierdź'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Nazwę drużyny można później zmienić w ustawieniach ligi
          </p>
        </form>
      </div>
    </div>
  )
}
