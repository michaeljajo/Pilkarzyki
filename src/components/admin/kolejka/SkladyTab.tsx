'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Edit } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AdminLineupPicker } from '@/components/admin/AdminLineupPicker'
import { MatchWithLineups } from '@/types'
import { getManagerDisplayName } from './types'

interface SkladyTabProps {
  matches: MatchWithLineups[]
  leagueId: string
  gameweekId: string
  /** "Popraw" is only permitted between lock and completion. */
  canCorrect: boolean
  onCorrected: () => void
}

interface ManagerLineupRow {
  managerId: string
  name: string
  players: { id: string; name: string; surname: string }[]
  isFromDefault: boolean
  hasLineup: boolean
}

/**
 * Read-only review of every manager's league lineup for the gameweek. Żelazko
 * (auto-applied) lineups are marked. Between lock and completion the admin may
 * correct any lineup via "Popraw" — the pre-lock create flow is intentionally
 * gone (the żelazko mandate guarantees a lineup exists).
 */
export function SkladyTab({ matches, leagueId, gameweekId, canCorrect, onCorrected }: SkladyTabProps) {
  const [editing, setEditing] = useState<ManagerLineupRow | null>(null)

  // Flatten home + away sides into one row per manager, sorted by name.
  const rows: ManagerLineupRow[] = []
  for (const match of matches) {
    const sides = [
      { manager: match.home_manager, managerId: match.home_manager_id, lineup: match.home_lineup },
      { manager: match.away_manager, managerId: match.away_manager_id, lineup: match.away_lineup },
    ]
    for (const side of sides) {
      if (!side.managerId) continue
      rows.push({
        managerId: side.managerId,
        name: getManagerDisplayName(side.manager),
        players: side.lineup?.players || [],
        isFromDefault: !!side.lineup?.is_from_default,
        hasLineup: !!side.lineup && (side.lineup.players?.length ?? 0) > 0,
      })
    }
  }
  rows.sort((a, b) => a.name.localeCompare(b.name, 'pl'))

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-3xl mb-2">⚽</div>
        <div className="text-sm">Brak meczów w tej kolejce</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Składy menedżerów</h2>
        <p className="text-sm text-gray-600 mt-1">
          {rows.filter((r) => r.hasLineup).length} z {rows.length} składów ustawionych
          {!canCorrect && ' • poprawki dostępne po zablokowaniu kolejki'}
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {rows.map((row) => (
          <div key={row.managerId} className="px-4 sm:px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3 min-w-0">
              {row.hasLineup ? (
                <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={20} className="text-gray-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{row.name}</span>
                  {row.isFromDefault && (
                    <Badge variant="warning" size="sm">Żelazko</Badge>
                  )}
                </div>
                {row.hasLineup ? (
                  <div className="text-sm text-gray-600 mt-0.5">
                    {row.players.map((p, i) => (
                      <span key={p.id}>
                        <span className={row.isFromDefault ? 'underline decoration-dotted' : ''}>
                          {p.name} {p.surname}
                        </span>
                        {i < row.players.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mt-0.5">Brak składu</div>
                )}
              </div>
            </div>

            {canCorrect && (
              <Button
                variant="outline"
                size="sm"
                icon={<Edit size={16} />}
                onClick={() => setEditing(row)}
                className="shrink-0"
              >
                Popraw
              </Button>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <AdminLineupPicker
          leagueId={leagueId}
          managerId={editing.managerId}
          managerName={editing.name}
          gameweekId={gameweekId}
          existingLineup={{ id: '', player_ids: editing.players.map((p) => p.id) }}
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
