'use client'

/**
 * Highest own-goal count the toggle cycles through. The database allows up to
 * 9, but more than three own goals by one player in one match does not happen
 * in practice, and a short cycle keeps the control a single tap.
 */
export const MAX_OWN_GOALS = 3

type ToggleAccent = 'league' | 'cup' | 'et'

const IDLE: Record<ToggleAccent, string> = {
  league: 'border-gray-300',
  cup: 'border-gray-300',
  et: 'border-orange-300',
}

interface OwnGoalToggleProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  accent?: ToggleAccent
  /** Accessible name, e.g. "Gole samobójcze — Robert Lewandowski". */
  label?: string
}

/**
 * Own goals, recorded independently of the goal stepper beside it, so a player
 * who scores and also puts one into his own net counts for both teams.
 *
 * Each tap adds one own goal and wraps back to none after MAX_OWN_GOALS, which
 * keeps the control the width of a single button in the tight two-column
 * layout on a phone.
 */
export function OwnGoalToggle({
  value,
  onChange,
  disabled = false,
  accent = 'league',
  label,
}: OwnGoalToggleProps) {
  const active = value > 0
  const next = value >= MAX_OWN_GOALS ? 0 : value + 1
  const name = label ?? 'Gole samobójcze'

  return (
    <button
      type="button"
      aria-label={`${name}: ${value}`}
      title={`Gole samobójcze: ${value} — kliknij, aby zmienić na ${next}`}
      disabled={disabled}
      // Keep focus (and the phone keyboard) where it was, like the stepper.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onChange(next)}
      className={`shrink-0 h-9 sm:h-7 min-w-8 sm:min-w-9 px-1 rounded-md border text-[10px] sm:text-[11px] font-bold
        touch-manipulation select-none transition-colors whitespace-nowrap
        disabled:opacity-50 disabled:cursor-not-allowed
        ${active
          ? 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100'
          : `${IDLE[accent]} bg-gray-50 text-gray-400 hover:bg-gray-200`}`}
    >
      {value > 1 ? `${value}×OG` : 'OG'}
    </button>
  )
}
