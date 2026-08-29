'use client'

import { Save } from 'lucide-react'

interface ResultsActionBarProps {
  /** Players in the visible tab whose "rozegrał mecz" mark is already set. */
  done: number
  total: number
  /** True when any entry in the gameweek differs from what is stored. */
  dirty: boolean
  saving: boolean
  /** Gameweek is open or completed — nothing can be saved. */
  disabled: boolean
  onSaveAll: () => void
  accent?: 'league' | 'cup'
}

/**
 * Sticky progress + bulk-save bar for the result-entry tabs.
 *
 * Per-match "Zapisz wynik" buttons stay for spot fixes; this bar lets the admin
 * fill the whole gameweek — league, cup and extra time alike — and commit it in
 * one request. It sticks directly under the app header (whose live height the
 * shell publishes as --app-header-h) so the save action stays reachable however
 * far down the match list you are.
 */
export function ResultsActionBar({
  done,
  total,
  dirty,
  saving,
  disabled,
  onSaveAll,
  accent = 'league',
}: ResultsActionBarProps) {
  const barColor = accent === 'cup' ? 'bg-yellow-600' : 'bg-[#29544D]'
  const buttonColor =
    accent === 'cup' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-[#29544D] hover:bg-[#1f3d37]'

  return (
    <div
      className="sticky z-30 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-2 bg-gray-50/95 backdrop-blur border-b border-gray-200"
      style={{ top: 'var(--app-header-h, 0px)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">
            <span className="sm:hidden">
              Wpisane: {done}/{total}
            </span>
            <span className="hidden sm:inline">
              Wyniki wpisane dla {done}/{total} zawodników
            </span>
          </p>
          <div className="mt-1 w-28 sm:w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${barColor}`}
              style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dirty && !disabled && (
            <span className="hidden sm:inline text-xs font-medium text-amber-700">
              Niezapisane zmiany
            </span>
          )}
          <button
            type="button"
            onClick={onSaveAll}
            disabled={saving || disabled}
            className={`relative inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-white rounded-lg touch-manipulation disabled:opacity-50 ${buttonColor}`}
          >
            <Save size={16} />
            {saving ? (
              'Zapisywanie...'
            ) : (
              <>
                <span className="sm:hidden">Zapisz wszystko</span>
                <span className="hidden sm:inline">Zapisz wszystkie wyniki</span>
              </>
            )}
            {dirty && !disabled && !saving && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-gray-50" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
