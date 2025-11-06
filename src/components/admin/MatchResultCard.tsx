'use client'

import { useMemo } from 'react'
import { MatchWithLineups } from '@/types'
import { PlayerGoalInput } from './PlayerGoalInput'
import { getTeamOrManagerName } from '@/utils/team-name-resolver'

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

  const getManagerDisplayName = (manager: { first_name?: string; last_name?: string; email: string; squad?: { team_name?: string } }) => {
    return getTeamOrManagerName({
      manager: {
        first_name: manager.first_name,
        last_name: manager.last_name,
        email: manager.email
      },
      squad: manager.squad
    })
  }

  const renderManagerSide = (
    manager: { first_name?: string; last_name?: string; email: string; squad?: { team_name?: string } },
    lineup: typeof match.home_lineup,
    score: number
  ) => (
    <div className="flex-1">
      {/* Manager Header */}
      <div className="text-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {getManagerDisplayName(manager)}
        </h3>
        <div className="text-2xl font-bold text-blue-600 mt-1">
          {score}
        </div>
      </div>

      {/* Player Lineup */}
      <div className="space-y-1.5">
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
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-xs">Nie ustawiono składu</div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Match Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Home Manager */}
          {renderManagerSide(match.home_manager, match.home_lineup, homeScore)}

          {/* VS Divider */}
          <div className="flex items-center justify-center lg:block hidden">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-400 mb-2">VS</div>
              <div className="w-px h-24 bg-gray-300 mx-auto"></div>
            </div>
          </div>

          {/* Mobile VS Divider */}
          <div className="lg:hidden flex items-center justify-center py-2">
            <div className="text-lg font-bold text-gray-400">VS</div>
          </div>

          {/* Away Manager */}
          {renderManagerSide(match.away_manager, match.away_lineup, awayScore)}
        </div>
      </div>

      {/* Match Status Footer */}
      {(!match.home_lineup?.players?.length || !match.away_lineup?.players?.length) && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2">
          <div className="text-xs text-yellow-800">
            ⚠️ Lineup missing
          </div>
        </div>
      )}
    </div>
  )
}