'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface Standing {
  managerId: string
  managerName: string
  teamName?: string | null
  points: number
  goalsFor: number
  goalsAgainst: number
  manualTiebreaker?: number | null
}

interface ManualTiebreakerModalProps {
  isOpen: boolean
  onClose: () => void
  standings: Standing[]
  competitionId: string
  competitionType: 'league' | 'cup'
  onSave: () => void
}

export function ManualTiebreakerModal({
  isOpen,
  onClose,
  standings,
  competitionId,
  competitionType,
  onSave
}: ManualTiebreakerModalProps) {
  const [tiebreakers, setTiebreakers] = useState<Record<string, number | null>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Initialize tiebreakers from standings
      const initial: Record<string, number | null> = {}
      standings.forEach(s => {
        initial[s.managerId] = s.manualTiebreaker || null
      })
      setTiebreakers(initial)
      setError(null)
    }
  }, [isOpen, standings])

  if (!isOpen) return null

  const getDisplayName = (standing: Standing) => {
    return standing.teamName || standing.managerName
  }

  // Detect which teams are tied after automatic criteria
  const detectTiedTeams = (): Set<string> => {
    const tied = new Set<string>()
    for (let i = 0; i < standings.length; i++) {
      for (let j = i + 1; j < standings.length; j++) {
        const a = standings[i]
        const b = standings[j]
        // Check if tied on points, goals scored, and goals conceded
        if (
          a.points === b.points &&
          a.goalsFor === b.goalsFor &&
          a.goalsAgainst === b.goalsAgainst
        ) {
          tied.add(a.managerId)
          tied.add(b.managerId)
        }
      }
    }
    return tied
  }

  const tiedTeams = detectTiedTeams()

  const handleTiebreakerChange = (managerId: string, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10)
    if (numValue !== null && (isNaN(numValue) || numValue < 1)) {
      return // Invalid input
    }
    setTiebreakers(prev => ({ ...prev, [managerId]: numValue }))
  }

  const handleClearAll = () => {
    const cleared: Record<string, number | null> = {}
    standings.forEach(s => {
      cleared[s.managerId] = null
    })
    setTiebreakers(cleared)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Prepare tiebreakers data (only include those with values)
      const tiebreakerArray = Object.entries(tiebreakers)
        .filter(([_, value]) => value !== null)
        .map(([managerId, value]) => ({
          manager_id: managerId,
          tiebreaker_value: value as number
        }))

      const endpoint = competitionType === 'league'
        ? `/api/leagues/${competitionId}/manual-tiebreakers`
        : `/api/cups/${competitionId}/manual-tiebreakers`

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiebreakers: tiebreakerArray })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save tiebreakers')
      }

      // Success - trigger refresh and close
      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving tiebreakers:', err)
      setError(err instanceof Error ? err.message : 'Failed to save tiebreakers')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Zarządzaj Kolejnością Rozstrzygającą
        </h3>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Instrukcja:</strong> Użyj tej funkcji, aby ręcznie określić kolejność zespołów,
            które są remisowe po wszystkich automatycznych kryteriach (punkty, bramki zdobyte,
            bramki stracone, mecze bezpośrednie).
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Wprowadź numery (1, 2, 3...) dla zespołów, które chcesz uporządkować.
            <strong> Niższy numer = wyższa pozycja w tabeli.</strong>
          </p>
        </div>

        {tiedTeams.size > 0 && (
          <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-semibold text-amber-900">
              🔸 Zespoły remisowe: {tiedTeams.size} zespołów wymaga rozstrzygnięcia
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="mb-6 overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-16">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Zespół
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-20">
                  PKT
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-20">
                  B+
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-20">
                  B-
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-32">
                  Kolejność
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {standings.map((standing, index) => {
                const isTied = tiedTeams.has(standing.managerId)
                return (
                  <tr
                    key={standing.managerId}
                    className={`hover:bg-gray-50 ${isTied ? 'bg-amber-50/30' : ''}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-900">{index + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {getDisplayName(standing)}
                        </span>
                        {isTied && (
                          <span className="text-xs text-amber-700 font-semibold">
                            REMIS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {standing.points}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {standing.goalsFor}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {standing.goalsAgainst}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={tiebreakers[standing.managerId] || ''}
                        onChange={(e) => handleTiebreakerChange(standing.managerId, e.target.value)}
                        placeholder={isTied ? 'Ustaw' : 'Opcjonalnie'}
                        className={`w-full px-3 py-2 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isTied ? 'border-amber-300 bg-white' : 'border-gray-300'
                        }`}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClearAll}
            disabled={saving}
            className="flex-1"
          >
            Wyczyść Wszystkie
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
        </div>
      </div>
    </div>
  )
}
