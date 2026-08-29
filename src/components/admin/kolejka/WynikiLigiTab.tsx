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
 * League result entry: one card per head-to-head match. Progress and the
 * bulk-save action live in the sticky ResultsActionBar above the tabs, so they
 * are shared with the cup tab and stay reachable while scrolling.
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
