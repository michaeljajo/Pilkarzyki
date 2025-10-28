'use client'

import { useState } from 'react'
import { PlayerWithResult } from '@/types'

interface PlayerGoalInputProps {
  player: PlayerWithResult
  goals: number
  onChange: (playerId: string, goals: number) => void
  disabled?: boolean
}

export function PlayerGoalInput({ player, goals, onChange, disabled = false }: PlayerGoalInputProps) {
  const [localGoals, setLocalGoals] = useState(goals)

  const handleChange = (value: string) => {
    const goalCount = parseInt(value) || 0
    const clampedGoals = Math.max(0, Math.min(10, goalCount)) // Clamp between 0-10
    setLocalGoals(clampedGoals)
    onChange(player.id, clampedGoals)
  }

  const positionColors = {
    Goalkeeper: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Defender: 'bg-blue-100 text-blue-800 border-blue-200',
    Midfielder: 'bg-green-100 text-green-800 border-green-200',
    Forward: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <div className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 truncate">
          {player.name} {player.surname}
        </div>
      </div>

      <div className="flex items-center space-x-1.5 ml-3">
        <input
          id={`goals-${player.id}`}
          type="number"
          min="0"
          max="10"
          value={localGoals}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          className="w-12 px-1.5 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        />
        <span className="text-sm">⚽</span>
      </div>
    </div>
  )
}