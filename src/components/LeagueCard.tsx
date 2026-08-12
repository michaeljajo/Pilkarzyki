import Link from 'next/link'
import { Trophy, Settings, ArrowRight, Archive } from 'lucide-react'

interface LeagueCardProps {
  league: {
    id: string
    name: string
    season: string | null
    isAdmin: boolean
    isManager: boolean
    is_active?: boolean
  }
}

const RICH_GREEN = '#29544D'
const COLLEGIATE_NAVY = '#061852'

/**
 * Role/status chip. Tinted rather than filled: on the old card three saturated
 * pills (including a blue that exists nowhere else in the app) outshouted the
 * league name they were describing.
 */
function Chip({
  icon,
  label,
  color,
}: {
  icon?: React.ReactNode
  label: string
  color: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ color, backgroundColor: `${color}14` }}
    >
      {icon}
      {label}
    </span>
  )
}

/**
 * A league in the landing grid. Uses the same flat card language as the pages
 * inside a league — white on gray-50, 1px gray-200 border, rounded-xl, hover as
 * a border/background shift — instead of the lifted, heavily shadowed card it
 * used to be, which was the loudest surface anywhere in the app.
 */
export function LeagueCard({ league }: LeagueCardProps) {
  const isArchived = league.is_active === false

  return (
    // Archived cards stay white like every other card: the page sits on gray-50,
    // so a gray card surface simply vanishes into it. The archived state is
    // carried by the muted icon, the chip and the "Tylko do odczytu" line.
    <Link
      href={`/leagues/${league.id}`}
      className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      {/* Identity row. The chips sit *below* this rather than opposite the icon:
          a card with three chips used to wrap them onto a second line, which
          pushed its title down out of line with its neighbours in the row. */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: isArchived ? 'rgba(107,114,128,0.1)' : 'rgba(41,84,77,0.1)',
          }}
        >
          <Trophy size={20} className={isArchived ? 'text-gray-500' : 'text-[#29544D]'} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-gray-900">{league.name}</h2>
          {league.season && (
            <p className="mt-0.5 text-sm text-gray-500">
              Sezon {league.season}
              {isArchived && ' · Tylko do odczytu'}
            </p>
          )}
        </div>
      </div>

      {/* mb-6 here + mt-auto on the footer: the margin guarantees breathing room
          above the rule on the tallest card, while mt-auto pushes the footer down
          on shorter ones so every footer in a row lines up. */}
      <div className="mt-4 mb-6 flex flex-wrap items-center gap-1.5">
        {isArchived && (
          <Chip icon={<Archive size={11} />} label="Zarchiwizowane" color="#6b7280" />
        )}
        {league.isAdmin && (
          <Chip icon={<Settings size={11} />} label="Administrator" color={RICH_GREEN} />
        )}
        {league.isManager && <Chip label="Menedżer" color={COLLEGIATE_NAVY} />}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-600">
        <span>{isArchived ? 'Zobacz archiwum' : 'Zobacz ligę'}</span>
        <ArrowRight
          size={18}
          className={`${
            isArchived ? 'text-gray-500' : 'text-[#29544D]'
          } transition-transform group-hover:translate-x-1`}
        />
      </div>
    </Link>
  )
}
