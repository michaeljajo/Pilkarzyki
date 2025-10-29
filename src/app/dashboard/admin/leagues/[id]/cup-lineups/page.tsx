'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, XCircle, Edit, ArrowLeft, Trophy } from 'lucide-react'
import { AdminCupLineupPicker } from '@/components/admin/AdminCupLineupPicker'
import toast from 'react-hot-toast'

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface CupGameweek {
  id: string
  cup_week: number
  stage: string
  leg: number
  gameweeks: {
    id: string
    week: number
    lock_date: string
  }
}

interface CupLineup {
  id: string
  manager_id: string
  cup_gameweek_id: string
  player_ids: string[]
}

interface Cup {
  id: string
  name: string
  league_id: string
}

export default function AdminCupLineupsPage() {
  const params = useParams()
  const router = useRouter()
  const leagueId = params.id as string

  const [cup, setCup] = useState<Cup | null>(null)
  const [cupGameweeks, setCupGameweeks] = useState<CupGameweek[]>([])
  const [selectedCupGameweek, setSelectedCupGameweek] = useState<string>('')
  const [managers, setManagers] = useState<Manager[]>([])
  const [lineups, setLineups] = useState<CupLineup[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const loadCup = useCallback(async () => {
    try {
      const response = await fetch(`/api/cups?leagueId=${leagueId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.cup) {
          setCup(data.cup)
        } else {
          toast.error('Brak pucharu dla tej ligi')
        }
      }
    } catch (error) {
      console.error('Error loading cup:', error)
      toast.error('Błąd podczas ładowania pucharu')
    }
  }, [leagueId])

  const loadCupGameweeks = useCallback(async () => {
    try {
      const response = await fetch(`/api/cups/${cup!.id}/schedule`)
      if (response.ok) {
        const data = await response.json()
        // The schedule array items ARE the cup gameweeks
        const gameweeks: CupGameweek[] = data.schedule || []
        setCupGameweeks(gameweeks)
      }
    } catch (error) {
      console.error('Error loading cup gameweeks:', error)
      toast.error('Błąd podczas ładowania kolejek pucharowych')
    }
  }, [cup])

  const loadLineups = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/cups/${cup!.id}/lineups?cupGameweekId=${selectedCupGameweek}`)
      if (response.ok) {
        const data = await response.json()
        setManagers(data.managers || [])
        setLineups(data.lineups || [])
      }
    } catch (error) {
      console.error('Error loading cup lineups:', error)
      toast.error('Błąd podczas ładowania składów pucharowych')
    } finally {
      setLoading(false)
    }
  }, [cup, selectedCupGameweek])

  useEffect(() => {
    loadCup()
  }, [loadCup])

  useEffect(() => {
    if (cup?.id) {
      loadCupGameweeks()
    }
  }, [cup, loadCupGameweeks])

  useEffect(() => {
    if (selectedCupGameweek && cup?.id) {
      loadLineups()
    }
  }, [selectedCupGameweek, cup, loadLineups])

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

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      'group_stage': 'Faza Grupowa',
      'round_of_16': '1/8 Finału',
      'quarter_final': 'Ćwierćfinał',
      'semi_final': 'Półfinał',
      'final': 'Finał'
    }
    return labels[stage] || stage
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                icon={<ArrowLeft size={20} />}
                onClick={() => router.push(`/dashboard/admin/leagues/${leagueId}/cup`)}
              >
                Powrót
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Trophy size={24} className="text-[#29544D]" />
                  <h1 className="text-2xl font-bold text-gray-900">
                    Zarządzaj Składami Pucharowymi
                  </h1>
                </div>
                {cup && (
                  <p className="text-sm text-gray-600 mt-1">
                    {cup.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Cup Gameweek Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wybierz Kolejkę Pucharową
            </label>
            <select
              value={selectedCupGameweek}
              onChange={(e) => setSelectedCupGameweek(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#29544D] focus:border-transparent"
            >
              <option value="">-- Wybierz kolejkę pucharową --</option>
              {cupGameweeks.map((cgw) => (
                <option key={cgw.id} value={cgw.id}>
                  {getStageLabel(cgw.stage)} - Kolejka {cgw.cup_week}
                  {cgw.leg === 2 ? ' (Rewanż)' : ''}
                  {' '}(Liga: Kolejka {cgw.gameweeks.week})
                </option>
              ))}
            </select>
          </div>

          {/* Managers Grid */}
          {selectedCupGameweek && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Menedżerowie i Składy Pucharowe
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {lineups.length} z {managers.length} składów pucharowych utworzonych
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-500">
                  Ładowanie...
                </div>
              ) : managers.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  Brak menedżerów w pucharze
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
                        </div>
                        <Button
                          variant="outline"
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
        </div>
      </div>

      {/* Lineup Picker Modal */}
      {showPicker && selectedManager && cup && (
        <AdminCupLineupPicker
          cupId={cup.id}
          leagueId={leagueId}
          managerId={selectedManager.id}
          managerName={getManagerName(selectedManager)}
          cupGameweekId={selectedCupGameweek}
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
