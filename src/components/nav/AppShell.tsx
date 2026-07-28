'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useEffect } from 'react'
import { Shirt, Trophy, Award, Calendar, MoreHorizontal, type LucideIcon } from 'lucide-react'

interface AppShellProps {
  leagueId: string
  leagueName: string
  hasCup: boolean
  children: React.ReactNode
}

const COLORS = {
  richGreen: '#29544D',
  collegiateNavy: '#061852',
  white: '#FFFFFF',
}

type TabDef = {
  id: string
  label: string
  icon: LucideIcon
  // Path segment appended to /leagues/[id]; '' means the tab's landing route.
  href: (base: string) => string
  // Which sub-paths (relative to /leagues/[id]) keep this tab active.
  match: string[]
  cupOnly?: boolean
}

const TABS: TabDef[] = [
  { id: 'squad', label: 'Skład', icon: Shirt, href: (b) => `${b}/squad`, match: ['/squad', ''] },
  { id: 'league', label: 'Liga', icon: Trophy, href: (b) => `${b}/league`, match: ['/league'] },
  { id: 'cup', label: 'Puchar', icon: Award, href: (b) => `${b}/cup`, match: ['/cup'], cupOnly: true },
  { id: 'fixtures', label: 'Terminarz', icon: Calendar, href: (b) => `${b}/fixtures`, match: ['/fixtures'] },
  { id: 'more', label: 'Więcej', icon: MoreHorizontal, href: (b) => `${b}/more`, match: ['/more', '/settings', '/manage'] },
]

// Sub-paths that render full-screen without the shell (header + tab bar).
const TAKEOVER_PREFIXES = ['/draft', '/midseason-draft', '/transfers']

export function AppShell({ leagueId, leagueName, hasCup, children }: AppShellProps) {
  const pathname = usePathname()
  const base = `/leagues/${leagueId}`
  const subPath = pathname.startsWith(base) ? pathname.slice(base.length) : ''

  // Reset scroll to top on route change so pages never land mid-scroll with a
  // clipped heading (the previous behaviour preserved scroll position).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const isTakeover = TAKEOVER_PREFIXES.some((p) => subPath.startsWith(p))
  if (isTakeover) {
    // Takeovers own the whole viewport; they render their own exit control.
    return <>{children}</>
  }

  const tabs = TABS.filter((t) => !t.cupOnly || hasCup)

  const isActive = (tab: TabDef) => {
    if (tab.id === 'squad') {
      return subPath === '' || subPath === '/' || subPath.startsWith('/squad')
    }
    return tab.match.some((m) => m !== '' && subPath.startsWith(m))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-white border-b border-gray-200"
        style={{ height: '64px' }}
      >
        <div className="max-w-[1100px] mx-auto h-full flex items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/leagues" className="shrink-0 hover:opacity-80 transition-opacity" aria-label="Piłkarzyki — moje ligi">
              <Image src="/pilkarzyki-logo.png" alt="Piłkarzyki" width={140} height={35} priority />
            </Link>
            <Link
              href="/leagues"
              className="truncate text-sm font-semibold hover:underline"
              style={{ color: COLORS.collegiateNavy }}
              title={`${leagueName} — zmień ligę`}
            >
              {leagueName}
            </Link>
          </div>
          <div className="shrink-0">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Desktop tab bar: directly under header */}
        <nav
          className="hidden md:block border-t border-gray-100 bg-white"
          aria-label="Nawigacja główna"
        >
          <div className="max-w-[1100px] mx-auto px-4 flex items-center gap-1 h-12">
            {tabs.map((tab) => (
              <TabLink key={tab.id} tab={tab} href={tab.href(base)} active={isActive(tab)} variant="top" />
            ))}
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-[1100px] mx-auto w-full px-4 pt-4 pb-24 md:pb-8">{children}</main>

      {/* Mobile tab bar: fixed bottom */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Nawigacja główna"
      >
        <div className="flex items-stretch justify-around">
          {tabs.map((tab) => (
            <TabLink key={tab.id} tab={tab} href={tab.href(base)} active={isActive(tab)} variant="bottom" />
          ))}
        </div>
      </nav>
    </div>
  )
}

function TabLink({
  tab,
  href,
  active,
  variant,
}: {
  tab: TabDef
  href: string
  active: boolean
  variant: 'top' | 'bottom'
}) {
  const Icon = tab.icon
  if (variant === 'bottom') {
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[11px] font-medium transition-colors"
        style={{ color: active ? COLORS.collegiateNavy : '#9ca3af' }}
      >
        <Icon size={22} strokeWidth={active ? 2.4 : 2} />
        <span>{tab.label}</span>
      </Link>
    )
  }
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl text-sm font-medium transition-colors"
      style={
        active
          ? { backgroundColor: COLORS.collegiateNavy, color: COLORS.white }
          : { color: COLORS.richGreen }
      }
    >
      <Icon size={18} strokeWidth={2} />
      {tab.label}
    </Link>
  )
}
