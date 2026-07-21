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

export default function KnockoutDrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: cupId } = use(params)
  const router = useRouter()

  const [qualifiedTeams, setQualifiedTeams] = useState<QualifiedTeam[]>([])
  const [teamsByGroup, setTeamsByGroup] = useState<Record<string, QualifiedTeam[]>>({})
  const [cupGameweeks, setCupGameweeks] = useState<CupGameweek[]>([])
  const [selectedStage, setSelectedStage] = useState<string>('round_of_16')
  const [pairings, setPairings] = useState<MatchPairing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadQualifiedTeams()
    loadCupGameweeks()
  }, [cupId])

  const loadQualifiedTeams = async () => {
    try {
      const response = await fetch(`/api/cups/${cupId}/qualified-teams`)
      if (!response.ok) throw new Error('Failed to load qualified teams')

      const data = await response.json()
      setQualifiedTeams(data.teams)
      setTeamsByGroup(data.teamsByGroup)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    }
  }

  const loadCupGameweeks = async () => {
    try {
      const response = await fetch(`/api/cups/${cupId}/gameweeks`)
      if (!response.ok) throw new Error('Failed to load cup gameweeks')

      const data = await response.json()
      setCupGameweeks(data.cupGameweeks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gameweeks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStageChange = (stage: string) => {
    setSelectedStage(stage)
    setPairings([])
    setError(null)
    setSuccess(null)

    // Get gameweeks for this stage
    const stageGameweeks = cupGameweeks
      .filter(gw => gw.stage === stage)
      .sort((a, b) => a.leg - b.leg)

    // Initialize pairings based on stage
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
      case 'round_of_16': return 8
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
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate all pairings are filled
      const incompletePairings = pairings.filter(p => !p.homeManager || !p.awayManager)
      if (incompletePairings.length > 0) {
        throw new Error('Please fill in all match pairings')
      }

      const response = await fetch(`/api/admin/cups/${cupId}/knockout-draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: selectedStage,
          matches: pairings
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create matches')
      }

      setSuccess(`Successfully created ${data.stats.matchesCreated} matches for ${selectedStage}`)
      setPairings([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create matches')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  const stageGameweeks = cupGameweeks.filter(gw => gw.stage === selectedStage)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Knockout Draw</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Define knockout stage matchups after group stage completion
        </p>
      </div>

      {/* Qualified Teams Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Qualified Teams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(teamsByGroup).map(([groupName, teams]) => (
            <div key={groupName} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Group {groupName}</h3>
              {teams
                .sort((a, b) => a.position - b.position)
                .map((team) => (
                  <div
                    key={team.managerId}
                    className="text-sm py-1 flex items-center gap-2"
                  >
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

      {/* Stage Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Knockout Stage</h2>
        <div className="flex flex-wrap gap-3">
          {['round_of_16', 'quarter_final', 'semi_final', 'final'].map((stage) => (
            <button
              key={stage}
              onClick={() => handleStageChange(stage)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                selectedStage === stage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {stage.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>

        {stageGameweeks.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              This stage has {stageGameweeks.length} leg(s) scheduled:
            </p>
            {stageGameweeks.map((gw) => (
              <p key={gw.id}>
                • Leg {gw.leg}: Week {gw.gameweeks?.week} (
                {gw.gameweeks?.start_date ? new Date(gw.gameweeks.start_date).toLocaleDateString() : 'TBD'})
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Match Pairings */}
      {pairings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Define Match Pairings</h2>
          <div className="space-y-4">
            {pairings.map((pairing, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Match {index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Home Team</label>
                    <input
                      type="text"
                      value={pairing.homeManager}
                      onChange={(e) => updatePairing(index, 'homeManager', e.target.value)}
                      placeholder="e.g., winner_group_A or manager UUID"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use: winner_group_A, runner_up_group_B, or direct UUID
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Away Team</label>
                    <input
                      type="text"
                      value={pairing.awayManager}
                      onChange={(e) => updatePairing(index, 'awayManager', e.target.value)}
                      placeholder="e.g., runner_up_group_C or manager UUID"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use: winner_group_C, runner_up_group_D, or direct UUID
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Creating Matches...' : 'Create Matches'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">Error</h3>
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <h3 className="text-green-800 dark:text-green-300 font-semibold mb-2">Success</h3>
          <p className="text-green-700 dark:text-green-400">{success}</p>
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go to Admin Dashboard
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
          How to Use Placeholders
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>• <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">winner_group_A</code> - Winner of Group A (1st place)</li>
          <li>• <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">runner_up_group_B</code> - Runner-up of Group B (2nd place)</li>
          <li>• Or use direct manager UUID if you want specific matchups</li>
          <li>• The system will automatically resolve placeholders to actual teams</li>
          <li>• Two-leg ties will automatically create matches for both legs</li>
        </ul>
      </div>
    </div>
  )
}
