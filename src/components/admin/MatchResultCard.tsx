'use client'

import { useMemo } from 'react'
import { MatchWithLineups } from '@/types'
import { PlayerGoalInput } from './PlayerGoalInput'

interface MatchResultCardProps {
  match: MatchWithLineups
  onPlayerGoalsChange: (playerId: string, goals: number) => void
  playerGoals: { [key: string]: number }
  disabled?: boolean
}

export function MatchResultCard({
  match,
  onPlayerGoalsChange,
  playerGoals,
  disabled = false
}: MatchResultCardProps) {

  // Calculate real-time scores
  const homeScore = useMemo(() => {
    if (!match.home_lineup?.players) return 0
    return match.home_lineup.players.reduce((sum, player) => {
      return sum + (playerGoals[player.id] || player.goals_scored || 0)
    }, 0)
  }, [match.home_lineup?.players, playerGoals])

  const awayScore = useMemo(() => {
    if (!match.away_lineup?.players) return 0
    return match.away_lineup.players.reduce((sum, player) => {
      return sum + (playerGoals[player.id] || player.goals_scored || 0)
    }, 0)
  }, [match.away_lineup?.players, playerGoals])

  const getManagerDisplayName = (manager: { first_name?: string; last_name?: string; email: string }) => {
    if (manager?.first_name && manager?.last_name) {
      return `${manager.first_name} ${manager.last_name}`
    }
    if (manager?.first_name) {
      return manager.first_name
    }
    return manager?.email || 'Unknown Manager'
  }

  const renderManagerSide = (
    manager: { first_name?: string; last_name?: string; email: string },
    lineup: typeof match.home_lineup,
    score: number
  ) => (
    <div className="flex-1">
      {/* Manager Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {getManagerDisplayName(manager)}
        </h3>
        <div className="text-3xl font-bold text-blue-600 mt-1">
          {score}
        </div>
        <div className="text-sm text-gray-500">gole</div>
      </div>

      {/* Player Lineup */}
      <div className="space-y-2">
        {lineup?.players && lineup.players.length > 0 ? (
          lineup.players.map((player) => (
            <PlayerGoalInput
              key={player.id}
              player={player}
              goals={playerGoals[player.id] || player.goals_scored || 0}
              onChange={onPlayerGoalsChange}
              disabled={disabled}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-sm">Nie ustawiono składu dla tej kolejki</div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Match Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mecz #{match.id.slice(-6)}
          </div>
          <div className="flex items-center space-x-2">
            {match.is_completed && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Zakończony
              </span>
            )}
            <div className="text-sm font-medium text-gray-900">
              {homeScore} - {awayScore}
            </div>
          </div>
        </div>
      </div>

      {/* Match Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Home Manager */}
          {renderManagerSide(match.home_manager, match.home_lineup, homeScore, 'home')}

          {/* VS Divider */}
          <div className="flex items-center justify-center lg:block hidden">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400 mb-2">VS</div>
              <div className="w-px h-32 bg-gray-300 mx-auto"></div>
            </div>
          </div>

          {/* Mobile VS Divider */}
          <div className="lg:hidden flex items-center justify-center py-4">
            <div className="text-xl font-bold text-gray-400">VS</div>
          </div>

          {/* Away Manager */}
          {renderManagerSide(match.away_manager, match.away_lineup, awayScore, 'away')}
        </div>
      </div>

      {/* Match Status Footer */}
      {(!match.home_lineup?.players?.length || !match.away_lineup?.players?.length) && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-3">
          <div className="text-sm text-yellow-800">
            ⚠️ Jeden lub obaj menedżerowie nie ustawili składu dla tej kolejki
          </div>
        </div>
      )}
    </div>
  )
}