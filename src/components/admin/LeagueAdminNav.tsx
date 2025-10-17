'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/cn'
import { Users, Trophy, Calendar, ClipboardList, BarChart3, Settings, ArrowLeft, Award } from 'lucide-react'

interface LeagueAdminNavProps {
  leagueId: string
  leagueName?: string
}

const getLeagueNavItems = (leagueId: string) => [
  {
    href: `/dashboard/admin/leagues/${leagueId}`,
    label: 'Przegląd',
    icon: Trophy,
    exactMatch: true
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/managers`,
    label: 'Menedżerowie',
    icon: Users
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/players`,
    label: 'Zawodnicy',
    icon: ClipboardList
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/gameweeks`,
    label: 'Kolejki',
    icon: Calendar
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/cup`,
    label: 'Puchar',
    icon: Award
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/results`,
    label: 'Wyniki',
    icon: BarChart3
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/settings`,
    label: 'Ustawienia',
    icon: Settings
  },
]

export function LeagueAdminNav({ leagueId, leagueName }: LeagueAdminNavProps) {
  const pathname = usePathname()
  const navItems = getLeagueNavItems(leagueId)

  return (
    <div className="space-y-12">
      {/* Back to Leagues */}
      <div className="px-3" style={{ marginBottom: '48px' }}>
        <Link
          href="/dashboard/admin/leagues"
          className="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={18} className="mr-3" />
          Wszystkie Ligi
        </Link>
      </div>

      {/* League Navigation */}
      <div className="px-3 pt-8">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exactMatch
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-[var(--mineral-green)]/20 text-[var(--mineral-green)] border-r-2 border-[var(--mineral-green)]'
                      : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]'
                  )}
                >
                  <Icon size={18} className="mr-3 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
