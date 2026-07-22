import { Position } from '@/types'

// Goalkeepers ("Bramkarz") are intentionally NOT supported in the draft pool.
// Only outfield positions are allowed for the 2026/27 season.
const POSITION_MAP: Record<string, Position> = {
  obronca: 'Defender',
  pomocnik: 'Midfielder',
  napastnik: 'Forward',
  defender: 'Defender',
  midfielder: 'Midfielder',
  forward: 'Forward',
}

export const ALLOWED_POSITIONS_PL = 'Obrońca, Pomocnik, Napastnik'

// Lowercase + strip diacritics so "Obrońca" / "obronca" both resolve.
function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/** Maps a Polish (or English) position name to the English enum, or null. */
export function resolvePosition(raw: string): Position | null {
  return POSITION_MAP[normalizeKey(raw)] ?? null
}

/** Splits a full name into { name, surname } — first token is the first name. */
export function splitFullName(full: string): { name: string; surname: string } {
  const parts = full.trim().split(/\s+/)
  const name = parts[0] || ''
  const surname = parts.length > 1 ? parts.slice(1).join(' ') : ''
  return { name, surname }
}
