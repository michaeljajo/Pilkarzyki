'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { X, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface Player {
  id: string
  name: string
  surname: string
  position: string
}

interface Lineup {
  id: string
  player_ids: string[]
}

interface AdminLineupPickerProps {
  leagueId: string
  managerId: string
  managerName: string
  gameweekId: string
  existingLineup?: Lineup
  onClose: () => void
  onSave: () => void
}

export function AdminLineupPicker({
  leagueId,
  managerId,
  managerName,
  gameweekId,
  existingLineup,
  onClose,
  onSave
}: AdminLineupPickerProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(existingLineup?.player_ids || [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSquad()
  }, [])

  const loadSquad = async () => {
    setLoading(true)
    try {
      // Fetch manager's squad
      const response = await fetch(`/api/manager/leagues/${leagueId}/squad?managerId=${managerId}`)
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.players || [])
      }
    } catch (error) {
      console.error('Error loading squad:', error)
      toast.error('Nie udało się załadować składu')
    } finally {
      setLoading(false)
    }
  }

  const togglePlayer = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId))
    } else {
      if (selectedPlayers.length >= 3) {
        toast.error('Maksymalnie 3 zawodników w składzie')
        return
      }
      setSelectedPlayers([...selectedPlayers, playerId])
    }
  }

  const handleSave = async () => {
    if (selectedPlayers.length === 0) {
      toast.error('Wybierz przynajmniej jednego zawodnika')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/leagues/${leagueId}/lineups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerId,
          gameweekId,
          playerIds: selectedPlayers
        })
      })

      if (response.ok) {
        toast.success('Skład zapisany pomyślnie')
        onSave()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Nie udało się zapisać składu')
      }
    } catch (error) {
      console.error('Error saving lineup:', error)
      toast.error('Błąd podczas zapisywania składu')
    } finally {
      setSaving(false)
    }
  }

  const getPlayersByPosition = (position: string) => {
    return players.filter(p => p.position === position)
  }

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
  const positionLabels: Record<string, string> = {
    'Goalkeeper': 'Bramkarze',
    'Defender': 'Obrońcy',
    'Midfielder': 'Pomocnicy',
    'Forward': 'Napastnicy'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Wybierz Skład dla {managerName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Wybrano: {selectedPlayers.length} (wymagane: 1-3 zawodników)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Ładowanie zawodników...
            </div>
          ) : players.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Brak zawodników w składzie menedżera
            </div>
          ) : (
            <div className="space-y-6">
              {positions.map(position => {
                const positionPlayers = getPlayersByPosition(position)
                if (positionPlayers.length === 0) return null

                return (
                  <div key={position}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      {positionLabels[position]}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {positionPlayers.map(player => {
                        const isSelected = selectedPlayers.includes(player.id)
                        return (
                          <button
                            key={player.id}
                            onClick={() => togglePlayer(player.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-[#29544D] bg-[#29544D]/10'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {player.name} {player.surname}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {position}
                                </div>
                              </div>
                              {isSelected && (
                                <Badge variant="success" size="sm">
                                  Wybrany
                                </Badge>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            Anuluj
          </Button>
          <Button
            icon={<Save size={16} />}
            onClick={handleSave}
            disabled={saving || selectedPlayers.length === 0}
          >
            {saving ? 'Zapisywanie...' : 'Zapisz Skład'}
          </Button>
        </div>
      </div>
    </div>
  )
}
