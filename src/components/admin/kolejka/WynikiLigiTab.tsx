'use client'

import { MatchWithLineups } from '@/types'
import { MatchGoalsCard } from './MatchGoalsCard'

interface WynikiLigiTabProps {
  matches: MatchWithLineups[]
  playerGoals: { [key: string]: number }
  playerHasPlayed: { [key: string]: boolean }
  onGoalsChange: (playerId: string, value: string) => void
  onHasPlayedChange: (playerId: string, checked: boolean) => void
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void
  onSaveMatch: (matchId: string) => void
  saving: boolean
  /** Result entry is only enabled while the gameweek is locked (not completed). */
  disabled: boolean
}

/**
 * League result entry: one card per head-to-head match with a progress
 * indicator counting how many starting players have their result recorded
 * (the "rozegrał mecz" checkbox).
 */
export function WynikiLigiTab({
  matches,
  playerGoals,
  playerHasPlayed,
  onGoalsChange,
  onHasPlayedChange,
  onFocus,
  onSaveMatch,
  saving,
  disabled,
}: WynikiLigiTabProps) {
  const allPlayerIds = matches.flatMap((m) => [
    ...(m.home_lineup?.players || []).map((p) => p.id),
    ...(m.away_lineup?.players || []).map((p) => p.id),
  ])
  const total = allPlayerIds.length
  const done = allPlayerIds.filter((id) => playerHasPlayed[id]).length

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-3xl mb-2">⚽</div>
        <div className="text-sm">Brak meczów ligowych w tej kolejce</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <span className="text-sm font-medium text-gray-700">
          Wyniki wpisane dla {done}/{total} zawodników
        </span>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#29544D] transition-all"
            style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {matches.map((match) => (
          <MatchGoalsCard
            key={match.id}
            match={match}
            playerGoals={playerGoals}
            playerHasPlayed={playerHasPlayed}
            onGoalsChange={onGoalsChange}
            onHasPlayedChange={onHasPlayedChange}
            onFocus={onFocus}
            onSave={onSaveMatch}
            saving={saving}
            disabled={disabled}
            accent="league"
          />
        ))}
      </div>
    </div>
  )
}
