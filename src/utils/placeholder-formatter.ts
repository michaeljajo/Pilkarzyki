/**
 * Format placeholder for display (client-safe utility)
 * Supports multiple formats:
 * - Group short: "A1" → { full: "Winner Group A", short: "A1" }
 * - Group long: "winner_group_A" → { full: "Winner Group A", short: "A1" }
 * - Knockout: "QF1" → { full: "Zwycięzca Ćwierćfinału #1", short: "QF1" }
 * - Knockout: "SF1" → { full: "Zwycięzca Półfinału #1", short: "SF1" }
 */
export function formatPlaceholder(placeholder: string): {
  full: string
  short: string
} {
  // Knockout stage format: QF1, QF2, SF1, SF2
  const knockoutMatch = placeholder.match(/^(QF|SF)(\d+)$/i)
  if (knockoutMatch) {
    const stagePrefix = knockoutMatch[1].toUpperCase()
    const matchNumber = knockoutMatch[2]

    const stageNameMap: Record<string, string> = {
      'QF': 'Ćwierćfinału',
      'SF': 'Półfinału'
    }

    const stageName = stageNameMap[stagePrefix] || stagePrefix
    return {
      full: `Zwycięzca ${stageName} #${matchNumber}`,
      short: `${stagePrefix}${matchNumber}`
    }
  }

  // Short group format: A1, B2, etc.
  const shortMatch = placeholder.match(/^([A-Z])([12])$/i)
  if (shortMatch) {
    const group = shortMatch[1].toUpperCase()
    const position = shortMatch[2]
    const positionText = position === '1' ? 'Winner' : 'Runner-up'
    return {
      full: `${positionText} Group ${group}`,
      short: `${group}${position}`
    }
  }

  // Long group format: winner_group_A, runner_up_group_B
  const winnerMatch = placeholder.match(/^winner_group_([A-Z])$/i)
  const runnerUpMatch = placeholder.match(/^runner_up_group_([A-Z])$/i)

  if (winnerMatch) {
    const group = winnerMatch[1].toUpperCase()
    return {
      full: `Winner Group ${group}`,
      short: `${group}1`
    }
  }

  if (runnerUpMatch) {
    const group = runnerUpMatch[1].toUpperCase()
    return {
      full: `Runner-up Group ${group}`,
      short: `${group}2`
    }
  }

  return { full: placeholder, short: placeholder }
}
