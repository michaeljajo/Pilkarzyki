'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle2, XCircle, Edit } from 'lucide-react'
import { AdminLineupPicker } from './AdminLineupPicker'

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Gameweek {
  id: string
  week: number
  start_date: string
  end_date: string
  lock_date: string
  is_completed: boolean
}

interface Lineup {
  id: string
  manager_id: string
  gameweek_id: string
  player_ids: string[]
  created_by_admin?: boolean
}

interface AdminLineupsManagerProps {
  leagueId: string
  gameweeks: Gameweek[]
  managers: Manager[]
}

export function AdminLineupsManager({ leagueId, gameweeks, managers }: AdminLineupsManagerProps) {
  const [selectedGameweek, setSelectedGameweek] = useState<string>('')
  const [lineups, setLineups] = useState<Lineup[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  // Load lineups when gameweek changes
  useEffect(() => {
    if (selectedGameweek) {
      loadLineups()
    }
  }, [selectedGameweek])

  const loadLineups = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/leagues/${leagueId}/lineups?gameweekId=${selectedGameweek}`)
      if (response.ok) {
        const data = await response.json()
        setLineups(data.lineups || [])
      }
    } catch (error) {
      console.error('Error loading lineups:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasLineup = (managerId: string) => {
    return lineups.some(lineup => lineup.manager_id === managerId)
  }

  const getLineup = (managerId: string) => {
    return lineups.find(lineup => lineup.manager_id === managerId)
  }

  const handleEditLineup = (manager: Manager) => {
    setSelectedManager(manager)
    setShowPicker(true)
  }

  const handleLineupSaved = () => {
    setShowPicker(false)
    setSelectedManager(null)
    loadLineups()
  }

  const getManagerName = (manager: Manager) => {
    if (manager.firstName || manager.lastName) {
      return `${manager.firstName} ${manager.lastName}`.trim()
    }
    return manager.email
  }

  return (
    <div className="space-y-6">
      {/* Gameweek Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wybierz Kolejkę
        </label>
        <select
          value={selectedGameweek}
          onChange={(e) => setSelectedGameweek(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#29544D] focus:border-transparent"
        >
          <option value="">-- Wybierz kolejkę --</option>
          {gameweeks.map((gw) => (
            <option key={gw.id} value={gw.id}>
              Kolejka {gw.week} {gw.is_completed ? '(Zakończona)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Managers Grid */}
      {selectedGameweek && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Menedżerowie i Składy
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {lineups.length} z {managers.length} składów utworzonych
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Ładowanie...
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {managers.map((manager) => {
                const lineup = getLineup(manager.id)
                const hasSubmitted = hasLineup(manager.id)

                return (
                  <div
                    key={manager.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {hasSubmitted ? (
                        <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle size={20} className="text-gray-400 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {getManagerName(manager)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {hasSubmitted ? (
                            <>
                              <span className="text-green-600">Skład utworzony</span>
                              {' • '}
                              {lineup?.player_ids.length || 0} zawodników
                            </>
                          ) : (
                            <span className="text-gray-500">Brak składu</span>
                          )}
                        </div>
                      </div>
                      {lineup?.created_by_admin && (
                        <Badge variant="warning" size="sm">
                          Utworzony przez admina
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant={hasSubmitted ? 'outline' : 'primary'}
                      size="sm"
                      icon={<Edit size={16} />}
                      onClick={() => handleEditLineup(manager)}
                    >
                      {hasSubmitted ? 'Edytuj' : 'Utwórz'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Lineup Picker Modal */}
      {showPicker && selectedManager && selectedGameweek && (
        <AdminLineupPicker
          leagueId={leagueId}
          managerId={selectedManager.id}
          managerName={getManagerName(selectedManager)}
          gameweekId={selectedGameweek}
          existingLineup={getLineup(selectedManager.id)}
          onClose={() => {
            setShowPicker(false)
            setSelectedManager(null)
          }}
          onSave={handleLineupSaved}
        />
      )}
    </div>
  )
}
