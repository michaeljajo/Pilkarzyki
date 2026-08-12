import { LeagueCard } from '@/components/LeagueCard'

export interface League {
  id: string
  name: string
  season: string | null
  isAdmin: boolean
  isManager: boolean
  created_at: string
  is_active: boolean
}

interface LeaguesGridProps {
  leagues: League[]
}

/**
 * Responsive grid of league cards.
 *
 * Breakpoints are CSS, not a measured window width: the previous version
 * defaulted to 3 columns during SSR and re-measured on mount, so narrow viewports
 * flashed a 3-up layout before snapping to 1-up. It also carried a resize
 * listener for something media queries do for free. Gaps match the league pages
 * (16px / 24px) rather than the old 32px.
 */
export function LeaguesGrid({ leagues }: LeaguesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {leagues.map((league) => (
        <LeagueCard key={league.id} league={league} />
      ))}
    </div>
  )
}
