'use client'

import { useState } from 'react'
import { Icon, Trophy, Timer, CircleDot } from 'lucide-react'
import { soccerBall } from '@lucide/lab'
import { MatchWithLineups } from '@/types'
import { AdminCupLineupPicker } from '@/components/admin/AdminCupLineupPicker'
import { MatchGoalsCard } from './MatchGoalsCard'
import {
  Cup,
  CupGameweek,
  EtLineupData,
  PenaltyLineupData,
  getStageLabel,
  isKnockoutDecider,
  getManagerDisplayName,
} from './types'

interface WynikiPucharuTabProps {
  cup: Cup
  cupGameweeks: CupGameweek[]
  leagueId: string
  playerGoals: { [key: string]: number }
  playerHasPlayed: { [key: string]: boolean }
  etLineups: { [key: string]: EtLineupData }
  penaltyLineups: { [key: string]: PenaltyLineupData }
  penaltyGoals: { [key: string]: number[] }
  onGoalsChange: (playerId: string, value: string) => void
  onHasPlayedChange: (playerId: string, checked: boolean) => void
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void
  onSaveMatch: (matchId: string) => void
  onPenaltyToggle: (key: string, index: number) => void
  onSavePenalties: (cupGameweekId: string, managerId: string) => void
  saving: boolean
  disabled: boolean
  onCorrected: () => void
}

/**
 * Cup result entry for the gameweek: league-style goal entry plus extra-time and
 * penalty shoot-out deciders for knockout second legs / finals. Cup lineups can
 * also be corrected here (folded in from the old cup-lineups page).
 */
export function WynikiPucharuTab(props: WynikiPucharuTabProps) {
  const {
    cup,
    cupGameweeks,
    leagueId,
    playerGoals,
    playerHasPlayed,
    etLineups,
    penaltyLineups,
    penaltyGoals,
    onGoalsChange,
    onHasPlayedChange,
    onFocus,
    onSaveMatch,
    onPenaltyToggle,
    onSavePenalties,
    saving,
    disabled,
    onCorrected,
  } = props

  const [editing, setEditing] = useState<{
    cupGameweekId: string
    managerId: string
    managerName: string
    playerIds: string[]
  } | null>(null)

  if (cupGameweeks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Trophy size={32} className="mx-auto mb-2 text-gray-300" />
        <div className="text-sm">Brak meczów pucharowych w tej kolejce</div>
      </div>
    )
  }

  const inputsDisabled = saving || disabled

  return (
    <div className="space-y-8">
      {cupGameweeks.map((cgw) => {
        const decider = isKnockoutDecider(cgw)
        return (
          <div key={cgw.id}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={20} className="text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Puchar — {getStageLabel(cgw.stage)}
                {cgw.leg === 2 ? ' (Rewanż)' : ''}
              </h3>
            </div>

            <div className="space-y-6">
              {cgw.matches.map((match: MatchWithLineups) => {
                const footer = (
                  <>
                    {decider && (
                      <EtSection
                        cgwId={cgw.id}
                        match={match}
                        etLineups={etLineups}
                        playerGoals={playerGoals}
                        playerHasPlayed={playerHasPlayed}
                        onGoalsChange={onGoalsChange}
                        onHasPlayedChange={onHasPlayedChange}
                        onFocus={onFocus}
                        inputsDisabled={inputsDisabled}
                      />
                    )}
                    {decider && (
                      <PenaltySection
                        cgwId={cgw.id}
                        match={match}
                        penaltyLineups={penaltyLineups}
                        penaltyGoals={penaltyGoals}
                        onToggle={onPenaltyToggle}
                        onSave={onSavePenalties}
                        inputsDisabled={inputsDisabled}
                      />
                    )}

                    {!disabled && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 self-center">Popraw skład:</span>
                        {match.home_manager_id && (
                          <button
                            onClick={() =>
                              setEditing({
                                cupGameweekId: cgw.id,
                                managerId: match.home_manager_id,
                                managerName: getManagerDisplayName(match.home_manager),
                                playerIds: (match.home_lineup?.players || []).map((p) => p.id),
                              })
                            }
                            className="px-2 py-0.5 text-xs border border-yellow-600 text-yellow-700 rounded hover:bg-yellow-50"
                          >
                            {getManagerDisplayName(match.home_manager)}
                          </button>
                        )}
                        {match.away_manager_id && (
                          <button
                            onClick={() =>
                              setEditing({
                                cupGameweekId: cgw.id,
                                managerId: match.away_manager_id,
                                managerName: getManagerDisplayName(match.away_manager),
                                playerIds: (match.away_lineup?.players || []).map((p) => p.id),
                              })
                            }
                            className="px-2 py-0.5 text-xs border border-yellow-600 text-yellow-700 rounded hover:bg-yellow-50"
                          >
                            {getManagerDisplayName(match.away_manager)}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )

                return (
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
                    accent="cup"
                    footer={footer}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      {editing && (
        <AdminCupLineupPicker
          cupId={cup.id}
          leagueId={leagueId}
          managerId={editing.managerId}
          managerName={editing.managerName}
          cupGameweekId={editing.cupGameweekId}
          existingLineup={{ id: '', player_ids: editing.playerIds }}
          onClose={() => setEditing(null)}
          onSave={() => {
            setEditing(null)
            onCorrected()
          }}
        />
      )}
    </div>
  )
}

// --- Extra time ---

function EtSection({
  cgwId,
  match,
  etLineups,
  playerGoals,
  playerHasPlayed,
  onGoalsChange,
  onHasPlayedChange,
  onFocus,
  inputsDisabled,
}: {
  cgwId: string
  match: MatchWithLineups
  etLineups: { [key: string]: EtLineupData }
  playerGoals: { [key: string]: number }
  playerHasPlayed: { [key: string]: boolean }
  onGoalsChange: (playerId: string, value: string) => void
  onHasPlayedChange: (playerId: string, checked: boolean) => void
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void
  inputsDisabled: boolean
}) {
  const homeEt = etLineups[`${cgwId}_${match.home_manager_id}`]
  const awayEt = etLineups[`${cgwId}_${match.away_manager_id}`]
  if (!homeEt && !awayEt) return null

  const renderInputs = (playerId: string, goals: number, hasPlayed: boolean) => (
    <>
      <input
        type="number"
        min="-1"
        max="9"
        value={goals}
        onChange={(e) => onGoalsChange(playerId, e.target.value)}
        onFocus={onFocus}
        disabled={inputsDisabled}
        className={`w-8 sm:w-12 px-0.5 py-0 text-[10px] sm:text-xs text-center border rounded disabled:bg-gray-100 ${
          goals === -1 ? 'border-red-300 bg-red-50 text-red-700' : 'border-orange-300 focus:ring-orange-500'
        }`}
      />
      <input
        type="checkbox"
        checked={hasPlayed}
        onChange={(e) => onHasPlayedChange(playerId, e.target.checked)}
        disabled={inputsDisabled}
        className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer mt-0.5"
      />
    </>
  )

  return (
    <div className="mt-3 pt-3 border-t-2 border-orange-300">
      <div className="flex items-center gap-1.5 mb-2">
        <Timer size={14} className="text-orange-600" />
        <span className="text-xs font-semibold text-orange-700">Dogrywka</span>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-0.5 pr-4 sm:pr-12">
          {homeEt?.players?.map((player) => {
            const goals = playerGoals[player.id] || 0
            const hasPlayed = playerHasPlayed[player.id] || false
            return (
              <div key={player.id} className="flex items-start gap-1 sm:gap-2 min-h-[24px]">
                <input
                  type="checkbox"
                  checked={hasPlayed}
                  onChange={(e) => onHasPlayedChange(player.id, e.target.checked)}
                  disabled={inputsDisabled}
                  className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer mt-0.5"
                />
                <input
                  type="number"
                  min="-1"
                  max="9"
                  value={goals}
                  onChange={(e) => onGoalsChange(player.id, e.target.value)}
                  onFocus={onFocus}
                  disabled={inputsDisabled}
                  className={`w-8 sm:w-12 px-0.5 py-0 text-[10px] sm:text-xs text-center border rounded disabled:bg-gray-100 ${
                    goals === -1 ? 'border-red-300 bg-red-50 text-red-700' : 'border-orange-300 focus:ring-orange-500'
                  }`}
                />
                <p className="text-[11px] sm:text-sm text-gray-600">
                  {player.name} {player.surname}
                  {goals > 0 &&
                    Array.from({ length: goals }).map((_, i) => (
                      <Icon key={i} iconNode={soccerBall} size={10} className="text-orange-600 inline-block ml-0.5" strokeWidth={2} />
                    ))}
                </p>
              </div>
            )
          }) || <p className="text-[11px] text-gray-400 italic">Brak składu ET</p>}
        </div>
        <div className="flex-1 text-right space-y-0.5 pl-4 sm:pl-12">
          {awayEt?.players?.map((player) => {
            const goals = playerGoals[player.id] || 0
            const hasPlayed = playerHasPlayed[player.id] || false
            return (
              <div key={player.id} className="flex items-start justify-end gap-1 sm:gap-2 min-h-[24px]">
                <p className="text-[11px] sm:text-sm text-right text-gray-600">
                  {goals > 0 &&
                    Array.from({ length: goals }).map((_, i) => (
                      <Icon key={i} iconNode={soccerBall} size={10} className="text-orange-600 inline-block mr-0.5" strokeWidth={2} />
                    ))}
                  {player.name} {player.surname}
                </p>
                {renderInputs(player.id, goals, hasPlayed)}
              </div>
            )
          }) || <p className="text-[11px] text-gray-400 italic">Brak składu ET</p>}
        </div>
      </div>
    </div>
  )
}

// --- Penalties ---

function PenaltySection({
  cgwId,
  match,
  penaltyLineups,
  penaltyGoals,
  onToggle,
  onSave,
  inputsDisabled,
}: {
  cgwId: string
  match: MatchWithLineups
  penaltyLineups: { [key: string]: PenaltyLineupData }
  penaltyGoals: { [key: string]: number[] }
  onToggle: (key: string, index: number) => void
  onSave: (cupGameweekId: string, managerId: string) => void
  inputsDisabled: boolean
}) {
  const homeKey = `${cgwId}_${match.home_manager_id}`
  const awayKey = `${cgwId}_${match.away_manager_id}`
  const homePen = penaltyLineups[homeKey]
  const awayPen = penaltyLineups[awayKey]
  if (!homePen && !awayPen) return null

  const homeGoals = penaltyGoals[homeKey] || [0, 0, 0, 0, 0]
  const awayGoals = penaltyGoals[awayKey] || [0, 0, 0, 0, 0]

  return (
    <div className="mt-3 pt-3 border-t-2 border-red-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CircleDot size={14} className="text-red-600" />
          <span className="text-xs font-semibold text-red-700">Rzuty karne</span>
        </div>
        <div className="flex gap-2">
          {homePen && (
            <button
              onClick={() => onSave(cgwId, match.home_manager_id)}
              disabled={inputsDisabled}
              className="px-2 py-0.5 text-[10px] bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Zapisz karne (dom)
            </button>
          )}
          {awayPen && (
            <button
              onClick={() => onSave(cgwId, match.away_manager_id)}
              disabled={inputsDisabled}
              className="px-2 py-0.5 text-[10px] bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Zapisz karne (wyjazd)
            </button>
          )}
        </div>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1 pr-4 sm:pr-12">
          {homePen?.players?.map((player, idx) => (
            <div key={player.id} className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-4">{idx + 1}.</span>
              <button
                onClick={() => onToggle(homeKey, idx)}
                disabled={inputsDisabled}
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors disabled:opacity-50 ${
                  homeGoals[idx] === 1 ? 'bg-green-500 text-white' : 'bg-red-100 text-red-600 border border-red-300'
                }`}
              >
                {homeGoals[idx] === 1 ? '✓' : '✗'}
              </button>
              <span className="text-[11px] text-gray-600">{player.name} {player.surname}</span>
            </div>
          )) || <p className="text-[11px] text-gray-400 italic">Brak wykonawców</p>}
        </div>
        <div className="flex-1 text-right space-y-1 pl-4 sm:pl-12">
          {awayPen?.players?.map((player, idx) => (
            <div key={player.id} className="flex items-center justify-end gap-1.5">
              <span className="text-[11px] text-gray-600">{player.name} {player.surname}</span>
              <button
                onClick={() => onToggle(awayKey, idx)}
                disabled={inputsDisabled}
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors disabled:opacity-50 ${
                  awayGoals[idx] === 1 ? 'bg-green-500 text-white' : 'bg-red-100 text-red-600 border border-red-300'
                }`}
              >
                {awayGoals[idx] === 1 ? '✓' : '✗'}
              </button>
              <span className="text-[10px] text-gray-400 w-4">{idx + 1}.</span>
            </div>
          )) || <p className="text-[11px] text-gray-400 italic">Brak wykonawców</p>}
        </div>
      </div>
    </div>
  )
}
