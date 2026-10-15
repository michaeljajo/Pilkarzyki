'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'

/** Goals only — own goals are a separate count, entered with OwnGoalToggle. */
export const MIN_GOALS = 0
export const MAX_GOALS = 9

type StepperAccent = 'league' | 'cup' | 'et'

const ACCENT: Record<StepperAccent, { border: string; ring: string }> = {
  league: { border: 'border-gray-300', ring: 'focus:ring-[#29544D]' },
  cup: { border: 'border-gray-300', ring: 'focus:ring-yellow-600' },
  et: { border: 'border-orange-300', ring: 'focus:ring-orange-500' },
}

interface GoalStepperProps {
  value: number
  /** Kept string-based so it drops straight into the existing goal handlers. */
  onChange: (value: string) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  disabled?: boolean
  accent?: StepperAccent
  /**
   * Away-column rows are mirrored (name, control, checkbox), so the arrows move
   * to the left of the field and their extra touch area grows leftwards — it
   * must never reach over the neighbouring "rozegrał mecz" checkbox.
   */
  mirrored?: boolean
  /** Accessible name, e.g. "Gole — Robert Lewandowski". */
  label?: string
}

/**
 * Goal entry as a number field with its own, finger-sized step buttons.
 *
 * The native number spinners are ~9px tall and effectively untappable on a
 * phone (Safari on iOS hides them altogether), so they are suppressed and
 * replaced with a stacked ▲/▼ column. Each button is a full half of a 36px
 * control and carries a transparent ::after that pushes its hit area 8px
 * sideways into the gutter — roughly four times the native target — while the
 * field itself stays typeable for fast entry.
 */
export function GoalStepper({
  value,
  onChange,
  onFocus,
  disabled = false,
  accent = 'league',
  mirrored = false,
  label,
}: GoalStepperProps) {
  const colors = ACCENT[accent]
  const borderColor = colors.border

  const step = (delta: number) => {
    const next = Math.min(MAX_GOALS, Math.max(MIN_GOALS, value + delta))
    if (next !== value) onChange(String(next))
  }

  const arrows = (
    <div className={`flex flex-col w-6 sm:w-5 border-y ${mirrored ? 'border-l' : 'border-r'} ${borderColor}`}>
      <StepButton
        direction="up"
        mirrored={mirrored}
        borderColor={borderColor}
        disabled={disabled || value >= MAX_GOALS}
        label={label ? `${label}: więcej` : 'Więcej goli'}
        onStep={() => step(1)}
      />
      <StepButton
        direction="down"
        mirrored={mirrored}
        borderColor={borderColor}
        disabled={disabled || value <= MIN_GOALS}
        label={label ? `${label}: mniej` : 'Mniej goli'}
        onStep={() => step(-1)}
      />
    </div>
  )

  const field = (
    <input
      type="number"
      inputMode="numeric"
      min={MIN_GOALS}
      max={MAX_GOALS}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      disabled={disabled}
      aria-label={label}
      className={`w-8 sm:w-11 h-full px-0 text-xs sm:text-sm font-medium text-center border
        focus:outline-none focus:ring-1 focus:relative focus:z-10
        disabled:bg-gray-100 disabled:text-gray-500
        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
        ${mirrored ? 'rounded-r-md' : 'rounded-l-md'}
        ${colors.border} ${colors.ring}`}
    />
  )

  return (
    <div className="inline-flex items-stretch shrink-0 h-9 sm:h-7">
      {mirrored ? (
        <>
          {arrows}
          {field}
        </>
      ) : (
        <>
          {field}
          {arrows}
        </>
      )}
    </div>
  )
}

function StepButton({
  direction,
  mirrored,
  borderColor,
  disabled,
  label,
  onStep,
}: {
  direction: 'up' | 'down'
  mirrored: boolean
  borderColor: string
  disabled: boolean
  label: string
  onStep: () => void
}) {
  const Icon = direction === 'up' ? ChevronUp : ChevronDown

  // Rounded corners live on the buttons rather than on an overflow-hidden
  // wrapper, because clipping would also cut away the ::after touch area.
  const corner =
    direction === 'up'
      ? mirrored
        ? 'rounded-tl-md'
        : 'rounded-tr-md'
      : mirrored
        ? 'rounded-bl-md'
        : 'rounded-br-md'

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      disabled={disabled}
      // Keep focus (and the phone keyboard) exactly where it was when stepping.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onStep}
      className={`relative flex-1 flex items-center justify-center bg-gray-50 text-gray-600
        touch-manipulation select-none transition-colors
        hover:bg-gray-200 active:bg-gray-300
        disabled:opacity-40 disabled:hover:bg-gray-50 disabled:cursor-not-allowed
        ${direction === 'up' ? `border-b ${borderColor}` : ''} ${corner}
        after:content-[''] after:absolute
        ${direction === 'up' ? 'after:-top-0.5 after:bottom-0' : 'after:top-0 after:-bottom-0.5'}
        ${mirrored ? 'after:right-0 after:-left-2' : 'after:left-0 after:-right-2'}`}
    >
      <Icon size={14} strokeWidth={3} className="pointer-events-none" />
    </button>
  )
}
