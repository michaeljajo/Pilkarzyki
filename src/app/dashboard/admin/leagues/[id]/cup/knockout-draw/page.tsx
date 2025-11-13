'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface QualifiedTeam {
  managerId: string
  managerName: string
  groupName: string
  position: number
  points: number
  qualified: boolean
}

interface MatchPairing {
  cupGameweekId: string
  homeManager: string
  awayManager: string
}

interface CupGameweek {
  id: string
  cup_week: number
  stage: string
  leg: number
  gameweeks?: {
    week: number
    start_date: string
    end_date: string
  }
}

interface StageInfo {
  stage: string
  matchesCount: number
  totalCount: number
  resolvedCount: number
  completedCount: number
}

type Mode = 'view' | 'create' | 'edit'

export default function KnockoutDrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params)
  const router = useRouter()

  // Cup and teams data
  const [cupId, setCupId] = useState<string | null>(null)
  const [qualifiedTeams, setQualifiedTeams] = useState<QualifiedTeam[]>([])
  const [teamsByGroup, setTeamsByGroup] = useState<Record<string, QualifiedTeam[]>>({})
  const [cupGameweeks, setCupGameweeks] = useState<CupGameweek[]>([])
  const [stagesOverview, setStagesOverview] = useState<StageInfo[]>([])

  // UI state
  const [mode, setMode] = useState<Mode>('view')
  const [selectedStage, setSelectedStage] = useState<string>('quarter_final')
  const [pairings, setPairings] = useState<MatchPairing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [stageToDelete, setStageToDelete] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    loadCupData()
  }, [leagueId])

  useEffect(() => {
    if (cupId) {
      loadQualifiedTeams()
      loadCupGameweeks()
      loadStagesOverview()
    }
  }, [cupId])

  const loadCupData = async () => {
    try {
      const response = await fetch(`/api/cups?leagueId=${leagueId}`)
      const data = await response.json()

      if (response.ok && data.cup) {
        setCupId(data.cup.id)
      } else {
        setError('No cup found for this league')
        setIsLoading(false)
      }
    } catch (err) {
      setError('Failed to load cup data')
      setIsLoading(false)
    }
  }

  const loadQualifiedTeams = async () => {
    if (!cupId) return

    try {
      const response = await fetch(`/api/cups/${cupId}/qualified-teams`)
      if (response.ok) {
        const data = await response.json()
        setQualifiedTeams(data.teams || [])
        setTeamsByGroup(data.teamsByGroup || {})
      }
    } catch (err) {
      console.error('Failed to load qualified teams:', err)
    }
  }

  const loadCupGameweeks = async () => {
    if (!cupId) return

    try {
      const response = await fetch(`/api/cups/${cupId}/gameweeks`)
      if (response.ok) {
        const data = await response.json()
        setCupGameweeks(data.cupGameweeks || [])
      }
    } catch (err) {
      console.error('Failed to load cup gameweeks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStagesOverview = async () => {
    if (!cupId) return

    try {
      const response = await fetch(`/api/admin/cups/${cupId}/knockout-draw`)
      if (response.ok) {
        const data = await response.json()
        setStagesOverview(data.stages || [])
      }
    } catch (err) {
      console.error('Failed to load stages overview:', err)
    }
  }

  const startCreating = (stage: string) => {
    setSelectedStage(stage)
    setMode('create')
    setError(null)
    setSuccess(null)
    initializePairings(stage)
  }

  const startEditing = async (stage: string) => {
    if (!cupId) return

    setSelectedStage(stage)
    setError(null)
    setSuccess(null)

    try {
      // Fetch existing matches for this stage
      const response = await fetch(`/api/cups/${cupId}/schedule`)
      if (!response.ok) throw new Error('Failed to load matches')

      const data = await response.json()
      const schedule = data.schedule || []

      // Find matches for this stage
      const stageMatches: any[] = []
      schedule.forEach((gw: any) => {
        if (gw.matches) {
          gw.matches.forEach((match: any) => {
            if (match.stage === stage) {
              stageMatches.push(match)
            }
          })
        }
      })

      if (stageMatches.length === 0) {
        setError(`No matches found for ${stage}`)
        return
      }

      // Group matches by tie (assuming leg 1 matches)
      const leg1Matches = stageMatches.filter(m => m.leg === 1)
      const loadedPairings: MatchPairing[] = leg1Matches.map(match => ({
        cupGameweekId: match.cup_gameweek_id,
        homeManager: match.home_team_source || match.home_manager_id || '',
        awayManager: match.away_team_source || match.away_manager_id || ''
      }))

      setPairings(loadedPairings)
      setMode('edit')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stage for editing')
    }
  }

  const initializePairings = (stage: string) => {
    const stageGameweeks = cupGameweeks
      .filter(gw => gw.stage === stage)
      .sort((a, b) => a.leg - b.leg)

    const matchCount = getMatchCountForStage(stage)
    const newPairings: MatchPairing[] = []

    for (let i = 0; i < matchCount; i++) {
      if (stageGameweeks[0]) {
        newPairings.push({
          cupGameweekId: stageGameweeks[0].id,
          homeManager: '',
          awayManager: ''
        })
      }
    }

    setPairings(newPairings)
  }

  const getMatchCountForStage = (stage: string): number => {
    switch (stage) {
      case 'quarter_final': return 4
      case 'semi_final': return 2
      case 'final': return 1
      default: return 0
    }
  }

  const updatePairing = (index: number, field: 'homeManager' | 'awayManager', value: string) => {
    const newPairings = [...pairings]
    newPairings[index][field] = value
    setPairings(newPairings)
  }

  const handleSubmit = async () => {
    if (!cupId) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate all pairings are filled
      const incompletePairings = pairings.filter(p => !p.homeManager || !p.awayManager)
      if (incompletePairings.length > 0) {
        throw new Error('Please fill in all match pairings')
      }

      const method = mode === 'edit' ? 'PUT' : 'POST'
      const response = await fetch(`/api/admin/cups/${cupId}/knockout-draw`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: selectedStage,
          matches: pairings
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save matches')
      }

      const action = mode === 'edit' ? 'updated' : 'created'
      setSuccess(`Successfully ${action} matches for ${formatStageName(selectedStage)}!`)
      setPairings([])
      setMode('view')
      await loadStagesOverview()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save matches')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (confirmed: boolean = false) => {
    if (!cupId || !stageToDelete) return

    try {
      const url = `/api/admin/cups/${cupId}/knockout-draw?stage=${stageToDelete}${confirmed ? '&confirmed=true' : ''}`
      const response = await fetch(url, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok) {
        if (data.requiresConfirmation) {
          setShowDeleteModal(true)
          return
        }
        throw new Error(data.error || 'Failed to delete stage')
      }

      setSuccess(`Successfully deleted ${formatStageName(stageToDelete)}`)
      setStageToDelete(null)
      setShowDeleteModal(false)
      setDeleteConfirmText('')
      await loadStagesOverview()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete stage')
    }
  }

  const handleResolve = async () => {
    if (!cupId) return

    try {
      const response = await fetch(`/api/admin/cups/${cupId}/resolve-placeholders`, {
        method: 'POST'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve placeholders')
      }

      setSuccess(`Resolved ${data.resolvedCount} match(es) out of ${data.totalChecked} checked`)
      await loadStagesOverview()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve placeholders')
    }
  }

  const formatStageName = (stage: string): string => {
    return stage.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getStageInfo = (stage: string): StageInfo | undefined => {
    return stagesOverview.find(s => s.stage === stage)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!cupId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">No Cup Found</h3>
          <p className="text-red-700">This league does not have a cup tournament configured.</p>
          <button
            onClick={() => router.push(`/dashboard/admin/leagues/${leagueId}/cup`)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go to Cup Configuration
          </button>
        </div>
      </div>
    )
  }

  const stageGameweeks = cupGameweeks.filter(gw => gw.stage === selectedStage)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Knockout Draw Configuration</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Define knockout stage matchups using simple placeholders (e.g., A1 vs C2)
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Tip: You can configure draws before group stage completion - placeholders will resolve automatically
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">Error</h3>
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <h3 className="text-green-800 dark:text-green-300 font-semibold mb-2">Success</h3>
          <p className="text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Resolution Button */}
      {stagesOverview.length > 0 && (
        <div className="mb-6">
          <button
            onClick={handleResolve}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            🔄 Refresh Team Resolution
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Click to update placeholder teams if group stage has completed
          </p>
        </div>
      )}

      {/* Stages Overview */}
      {mode === 'view' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configured Knockout Stages</h2>
          <div className="space-y-3">
            {['quarter_final', 'semi_final'].map((stage) => {
              const info = getStageInfo(stage)
              const isConfigured = !!info

              return (
                <div
                  key={stage}
                  className={`flex justify-between items-center p-4 rounded-lg border-2 ${
                    isConfigured
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'
                  }`}
                >
                  <div>
                    <h3 className="font-semibold text-lg">{formatStageName(stage)}</h3>
                    {info ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {info.matchesCount} matches • {info.resolvedCount}/{info.totalCount} teams resolved
                        {info.completedCount > 0 && ` • ${info.completedCount} completed`}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Not configured</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isConfigured ? (
                      <>
                        <button
                          onClick={() => startEditing(stage)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setStageToDelete(stage)
                            handleDelete(false)
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startCreating(stage)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Configure
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Final - Auto-configured */}
            {(() => {
              const finalInfo = getStageInfo('final')
              return (
                <div className="flex justify-between items-center p-4 rounded-lg border-2 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      Final
                      <span className="text-xs px-2 py-1 bg-purple-200 dark:bg-purple-700 rounded-full">Auto-configured</span>
                    </h3>
                    {finalInfo ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        1 match • {finalInfo.resolvedCount}/{finalInfo.totalCount} teams resolved
                        {finalInfo.completedCount > 0 && ` • Completed`}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Will be created automatically when semi-finals are configured (SF1 vs SF2)</p>
                    )}
                  </div>
                  {finalInfo && (
                    <button
                      onClick={() => {
                        setStageToDelete('final')
                        handleDelete(false)
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Qualified Teams Overview (Always visible) */}
      {Object.keys(teamsByGroup).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Qualified Teams Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(teamsByGroup).map(([groupName, teams]) => (
              <div key={groupName} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Group {groupName}</h3>
                {teams
                  .sort((a, b) => a.position - b.position)
                  .map((team) => (
                    <div key={team.managerId} className="text-sm py-1 flex items-center gap-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {team.position === 1 ? '1st' : '2nd'}
                      </span>
                      <span>{team.managerName}</span>
                      <span className="text-gray-500">({team.points}pts)</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Pairings Editor */}
      {(mode === 'create' || mode === 'edit') && pairings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {mode === 'edit' ? 'Edit' : 'Configure'} {formatStageName(selectedStage)}
            </h2>
            <button
              onClick={() => {
                setMode('view')
                setPairings([])
              }}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>

          {stageGameweeks.length > 0 && (
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <p className="font-semibold">Schedule Info:</p>
              {stageGameweeks.map((gw) => (
                <p key={gw.id}>
                  • Leg {gw.leg}: Week {gw.gameweeks?.week} (
                  {gw.gameweeks?.start_date ? new Date(gw.gameweeks.start_date).toLocaleDateString() : 'TBD'})
                </p>
              ))}
            </div>
          )}

          <div className="space-y-4 mb-6">
            {pairings.map((pairing, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-semibold mb-3">Match {index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Home Team</label>
                    <input
                      type="text"
                      value={pairing.homeManager}
                      onChange={(e) => updatePairing(index, 'homeManager', e.target.value.toUpperCase())}
                      placeholder={
                        selectedStage === 'quarter_final' ? 'e.g., A1, B2, C1' :
                        selectedStage === 'semi_final' ? 'e.g., QF1, QF2' : 'Enter team'
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Away Team</label>
                    <input
                      type="text"
                      value={pairing.awayManager}
                      onChange={(e) => updatePairing(index, 'awayManager', e.target.value.toUpperCase())}
                      placeholder={
                        selectedStage === 'quarter_final' ? 'e.g., D2, A2, B1' :
                        selectedStage === 'semi_final' ? 'e.g., QF3, QF4' : 'Enter team'
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Matches' : 'Create Matches')}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
          How to Use Placeholders
        </h3>
        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <strong className="block mb-1">Quarter-Finals (Ćwierćfinały):</strong>
            <ul className="space-y-1 ml-4">
              <li>• Use group references: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded font-semibold">A1</code> = Winner of Group A, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded font-semibold">B2</code> = Runner-up of Group B</li>
              <li>• Format: Group letter (A, B, C, D) + Position (1 = winner, 2 = runner-up)</li>
              <li>• Examples: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">A1</code>, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">A2</code>, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">B1</code>, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">B2</code>, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">C1</code>, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">C2</code>, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">D1</code>, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">D2</code></li>
            </ul>
          </div>
          <div>
            <strong className="block mb-1">Semi-Finals (Półfinały):</strong>
            <ul className="space-y-1 ml-4">
              <li>• Use quarter-final winners: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded font-semibold">QF1</code> = Winner of Quarter-final #1</li>
              <li>• Examples: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">QF1</code>, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">QF2</code>, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">QF3</code>, <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">QF4</code></li>
              <li>• Note: Match #1 is the first match you configured in quarterfinals, #2 is second, etc.</li>
              <li>• 🎯 <strong>The Final will be created automatically</strong> when you configure semi-finals (SF1 vs SF2)</li>
            </ul>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
            <ul className="space-y-1">
              <li>• ✅ You can configure draws before matches complete - teams will resolve automatically</li>
              <li>• ✅ Edit anytime to change bracket structure</li>
              <li>• ✅ Use "Refresh Resolution" button after completing a stage to update placeholders</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && stageToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
              Confirm Deletion
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              This stage has completed matches with results. Deleting will remove all match data permanently.
            </p>
            <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Type <span className="text-red-600">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-4"
              placeholder="Type DELETE"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                  setStageToDelete(null)
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(true)}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
