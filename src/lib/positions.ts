// Polish display names for the stored (English) position values.
export const POSITION_PL: Record<string, string> = {
  Goalkeeper: 'Bramkarz',
  Defender: 'Obrońca',
  Midfielder: 'Pomocnik',
  Forward: 'Napastnik',
}

/** English position value -> Polish label (unknown values pass through). */
export function positionLabel(position: string): string {
  return POSITION_PL[position] || position
}

/** Polish label -> English position value ('' when there is no match). */
export function positionFromLabel(label: string): string {
  return Object.keys(POSITION_PL).find((key) => POSITION_PL[key] === label) || ''
}
