import type { CupFormat, CupPreset, CupStage } from '@/types'

/**
 * The legacy cup shape, identical to how pre-configurable cups were generated:
 * 4 groups, double round-robin, top 2 per group, two-legged QF/SF and a
 * single-leg final. Mirrors the DB default in migration 027.
 */
export const DEFAULT_CUP_FORMAT: CupFormat = {
  preset: 'legacy_4x4',
  participantIds: 'all',
  groups: { count: 4, legs: 2, assignment: 'manual' },
  qualification: { topPerGroup: 2, bestRemaining: 0 },
  knockout: [
    { stage: 'quarter_final', legs: 2 },
    { stage: 'semi_final', legs: 2 },
    { stage: 'final', legs: 1 },
  ],
  aggregateTieBreak: 'et_penalties',
}

/** This season's target format: 2 groups of 9, single RR, top 4 → QF/SF/final. */
export const TWO_GROUPS_OF_NINE_FORMAT: CupFormat = {
  preset: 'two_groups_of_nine',
  participantIds: 'all',
  groups: { count: 2, legs: 1, assignment: 'random' },
  qualification: { topPerGroup: 4, bestRemaining: 0 },
  knockout: [
    { stage: 'quarter_final', legs: 2 },
    { stage: 'semi_final', legs: 2 },
    { stage: 'final', legs: 1 },
  ],
  aggregateTieBreak: 'et_penalties',
}

/** Preset → ready-made format (custom starts from the legacy shape). */
export function presetFormat(preset: CupPreset): CupFormat {
  switch (preset) {
    case 'legacy_4x4':
      return structuredClone(DEFAULT_CUP_FORMAT)
    case 'two_groups_of_nine':
      return structuredClone(TWO_GROUPS_OF_NINE_FORMAT)
    case 'custom':
      return { ...structuredClone(DEFAULT_CUP_FORMAT), preset: 'custom' }
  }
}

/** Polish label for a knockout/group stage. */
export function stageLabelPl(stage: CupStage): string {
  switch (stage) {
    case 'group_stage': return 'Faza grupowa'
    case 'round_of_32': return '1/16 finału'
    case 'round_of_16': return '1/8 finału'
    case 'quarter_final': return 'Ćwierćfinał'
    case 'semi_final': return 'Półfinał'
    case 'final': return 'Finał'
  }
}

/** Polish ordinal label for a group position, e.g. "Grupa A – 3. miejsce". */
export function positionLabelPl(groupName: string, position: number): string {
  return `Grupa ${groupName} – ${position}. miejsce`
}

/**
 * All qualifying placeholder positions for a format, e.g. for 2 groups × top 4:
 * A1..A4, B1..B4 (plus, when bestRemaining > 0, the next-placed positions).
 * Group letters are A, B, C… by count; positions run 1..topPerGroup, extended
 * by one when best-remaining spots exist.
 */
export function qualifyingPlaceholders(format: CupFormat): { code: string; label: string }[] {
  const { topPerGroup, bestRemaining } = format.qualification
  const maxPosition = topPerGroup + (bestRemaining > 0 ? 1 : 0)
  const out: { code: string; label: string }[] = []
  for (let g = 0; g < format.groups.count; g++) {
    const letter = String.fromCharCode(65 + g)
    for (let pos = 1; pos <= maxPosition; pos++) {
      out.push({ code: `${letter}${pos}`, label: positionLabelPl(letter, pos) })
    }
  }
  return out
}
