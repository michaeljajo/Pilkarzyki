'use client'

import { ReactNode } from 'react'
import { Icon } from 'lucide-react'
import { soccerBall } from '@lucide/lab'
import { calculateMatchScore, formatOwnGoalLabel, ResultsMap } from '@/utils/own-goal-calculator'
import { MatchWithLineups, PlayerWithResult } from '@/types'
import { GoalStepper } from './GoalStepper'
import { OwnGoalToggle } from './OwnGoalToggle'
import { getManagerDisplayName } from './types'

type Accent = 'league' | 'cup'

const ACCENT: Record<Accent, { border: string; button: string; divider: string; ball: string }> = {
  league: {
    border: 'border-[#29544D]',
    button: 'bg-[#29544D] hover:bg-[#1f3d37]',
    divider: 'border-[#DECF99]',
    ball: 'text-[#061852]',
  },
  cup: {
    border: 'border-yellow-600',
    button: 'bg-yellow-600 hover:bg-yellow-700',
    divider: 'border-yellow-200',
    ball: 'text-[#061852]',
  },
}

interface MatchGoalsCardProps {
  match: MatchWithLineups
  playerGoals: { [key: string]: number }
  playerOwnGoals: { [key: string]: number }
  playerHasPlayed: { [key: string]: boolean }
  onGoalsChange: (playerId: string, value: string) => void
  onOwnGoalsChange: (playerId: string, value: number) => void
  onHasPlayedChange: (playerId: string, checked: boolean) => void
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void
  onSave: (matchId: string) => void
  saving: boolean
  /** When true, inputs and the save button are disabled (unlocked / completed). */
  disabled?: boolean
  accent?: Accent
  /** Extra content rendered inside the card (e.g. ET / penalty sections). */
  footer?: ReactNode
}

/**
 * A single head-to-head match with per-player goal, own-goal and "rozegrał
 * mecz" inputs. Shared by the league and cup result-entry tabs; the accent prop
 * switches the card's colour scheme. Own goals are credited to the opponent by
 * calculateMatchScore.
 */
export function MatchGoalsCard({
  match,
  playerGoals,
  playerOwnGoals,
  playerHasPlayed,
  onGoalsChange,
  onOwnGoalsChange,
  onHasPlayedChange,
  onFocus,
  onSave,
  saving,
  disabled = false,
  accent = 'league',
  footer,
}: MatchGoalsCardProps) {
  const colors = ACCENT[accent]
  const homePlayers = match.home_lineup?.players || []
  const awayPlayers = match.away_lineup?.players || []
  const inputsDisabled = saving || disabled

  const tallies: ResultsMap = new Map(
    [...homePlayers, ...awayPlayers].map((p) => [
      p.id,
      { goals: playerGoals[p.id] || 0, ownGoals: playerOwnGoals[p.id] || 0 },
    ])
  )
  const { homeScore: homeGoals, awayScore: awayGoals } = calculateMatchScore(
    homePlayers.map((p) => p.id),
    awayPlayers.map((p) => p.id),
    tallies
  )

  const allPlayed = (players: PlayerWithResult[]) =>
    players.length > 0 && players.every((p) => playerHasPlayed[p.id] === true)
  const nameColor = (players: PlayerWithResult[]) =>
    allPlayed(players) ? 'text-[#061852]' : 'text-[#2E7D32]'

  const renderGoalInput = (player: PlayerWithResult, goals: number, mirrored = false) => (
    <GoalStepper
      value={goals}
      onChange={(value) => onGoalsChange(player.id, value)}
      onFocus={onFocus}
      disabled={inputsDisabled}
      accent={accent}
      mirrored={mirrored}
      label={`Gole — ${player.name} ${player.surname}`}
    />
  )

  const renderOwnGoalInput = (player: PlayerWithResult, ownGoals: number) => (
    <OwnGoalToggle
      value={ownGoals}
      onChange={(value) => onOwnGoalsChange(player.id, value)}
      disabled={inputsDisabled}
      accent={accent}
      label={`Gole samobójcze — ${player.name} ${player.surname}`}
    />
  )

  const renderCheckbox = (playerId: string, hasPlayed: boolean) => (
    <input
      type="checkbox"
      checked={hasPlayed}
      onChange={(e) => onHasPlayedChange(playerId, e.target.checked)}
      disabled={inputsDisabled}
      className="w-4 h-4 shrink-0 cursor-pointer disabled:cursor-not-allowed"
      title="Oznacz, że zawodnik rozegrał mecz"
    />
  )

  const nameClass = (goals: number, ownGoals: number, hasPlayed: boolean) =>
    ownGoals > 0 && goals === 0
      ? 'font-bold text-red-600'
      : hasPlayed && goals > 0
        ? 'font-bold text-[#061852]'
        : hasPlayed && goals === 0
          ? 'italic text-gray-600'
          : 'text-gray-600'

  return (
    <div className={`bg-white border-2 ${colors.border} rounded-2xl hover:shadow-lg transition-shadow duration-200 p-2 sm:p-5`}>
      {/* Save button */}
      <div className="flex justify-end mb-2 sm:mb-3">
        <button
          onClick={() => onSave(match.id)}
          disabled={inputsDisabled}
          className={`px-2 sm:px-4 py-0.5 sm:py-1 text-xs sm:text-sm text-white rounded-lg disabled:opacity-50 ${colors.button}`}
        >
          {saving ? 'Zapisywanie...' : 'Zapisz wynik'}
        </button>
      </div>

      {/* Score header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex-1 pr-2 sm:pr-6">
          <p className={`text-sm sm:text-lg font-semibold ${nameColor(homePlayers)}`}>
            {getManagerDisplayName(match.home_manager)}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-8">
          <span className="text-xl sm:text-3xl font-bold text-[#061852]">{homeGoals}</span>
          <span className="text-base sm:text-2xl font-medium text-gray-400">-</span>
          <span className="text-xl sm:text-3xl font-bold text-[#061852]">{awayGoals}</span>
        </div>
        <div className="flex-1 text-right pl-2 sm:pl-6">
          <p className={`text-sm sm:text-lg font-semibold ${nameColor(awayPlayers)}`}>
            {getManagerDisplayName(match.away_manager)}
          </p>
        </div>
      </div>

      {/* Player details */}
      <div className={`flex items-start justify-between pt-2 sm:pt-3 border-t-2 ${colors.divider}`}>
        {/* Home */}
        <div className="flex-1 space-y-1 pr-1 sm:pr-12">
          {homePlayers.length > 0 ? (
            homePlayers.map((player) => {
              const goals = playerGoals[player.id] || 0
              const ownGoals = playerOwnGoals[player.id] || 0
              const hasPlayed = playerHasPlayed[player.id] || false
              return (
                <div key={player.id} className="flex items-center gap-1 sm:gap-2 min-h-[36px] sm:min-h-[32px]">
                  {renderCheckbox(player.id, hasPlayed)}
                  {renderGoalInput(player, goals)}
                  {renderOwnGoalInput(player, ownGoals)}
                  <p className={`text-[11px] sm:text-sm ${nameClass(goals, ownGoals, hasPlayed)}`}>
                    {player.name} {player.surname}
                    {ownGoals > 0 && <span className="ml-1 text-red-600">{formatOwnGoalLabel(ownGoals)}</span>}
                    {goals > 0 &&
                      Array.from({ length: goals }).map((_, i) => (
                        <Icon key={i} iconNode={soccerBall} size={10} className={`${colors.ball} sm:w-3 sm:h-3 inline-block align-middle ml-0.5`} strokeWidth={2} />
                      ))}
                  </p>
                </div>
              )
            })
          ) : (
            <div className="flex items-baseline gap-2 min-h-[36px] sm:min-h-[32px]">
              <p className="text-[11px] sm:text-sm text-gray-400 italic">Nie ustawiono składu</p>
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 text-right space-y-1 pl-1 sm:pl-12">
          {awayPlayers.length > 0 ? (
            awayPlayers.map((player) => {
              const goals = playerGoals[player.id] || 0
              const ownGoals = playerOwnGoals[player.id] || 0
              const hasPlayed = playerHasPlayed[player.id] || false
              return (
                <div key={player.id} className="flex items-center justify-end gap-1 sm:gap-2 min-h-[36px] sm:min-h-[32px]">
                  <p className={`text-[11px] sm:text-sm text-right ${nameClass(goals, ownGoals, hasPlayed)}`}>
                    {goals > 0 &&
                      Array.from({ length: goals }).map((_, i) => (
                        <Icon key={i} iconNode={soccerBall} size={10} className={`${colors.ball} sm:w-3 sm:h-3 inline-block align-middle mr-0.5`} strokeWidth={2} />
                      ))}
                    {player.name} {player.surname}
                    {ownGoals > 0 && <span className="ml-1 text-red-600">{formatOwnGoalLabel(ownGoals)}</span>}
                  </p>
                  {renderOwnGoalInput(player, ownGoals)}
                  {renderGoalInput(player, goals, true)}
                  {renderCheckbox(player.id, hasPlayed)}
                </div>
              )
            })
          ) : (
            <div className="flex items-baseline gap-2 justify-end min-h-[36px] sm:min-h-[32px]">
              <p className="text-[11px] sm:text-sm text-gray-400 italic">Nie ustawiono składu</p>
            </div>
          )}
        </div>
      </div>

      {footer}
    </div>
  )
}
