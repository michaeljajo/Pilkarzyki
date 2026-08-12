'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import {
  Shirt,
  Trophy,
  Award,
  Calendar,
  MoreHorizontal,
  Wrench,
  Settings,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react'
import { APP_CONTAINER, APP_CONTENT_Y } from '@/components/layout/appContainer'

interface AppShellProps {
  leagueId: string
  leagueName: string
  hasCup: boolean
  isAdmin: boolean
  children: React.ReactNode
}

const COLORS = {
  richGreen: '#29544D',
  collegiateNavy: '#061852',
  textSecondary: '#6b7280',
  white: '#FFFFFF',
}

// One source of truth for the horizontal container, shared by the header, the
// desktop tab bar and the content region so their left edges line up. Full-bleed
// backgrounds, constrained contents: the coloured/bordered surfaces span the
// window, this centres what sits on top of them. Lives in layout/appContainer so
// the leagues landing page lines up with the shell too.
const CONTAINER = APP_CONTAINER

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

// Primary destinations — rendered as tabs on every breakpoint.
const PRIMARY_TABS: TabDef[] = [
  { id: 'squad', label: 'Skład', icon: Shirt, href: (b) => `${b}/squad`, match: ['/squad', ''] },
  { id: 'league', label: 'Liga', icon: Trophy, href: (b) => `${b}/league`, match: ['/league'] },
  { id: 'cup', label: 'Puchar', icon: Award, href: (b) => `${b}/cup`, match: ['/cup'], cupOnly: true },
  { id: 'fixtures', label: 'Terminarz', icon: Calendar, href: (b) => `${b}/fixtures`, match: ['/fixtures'] },
]

// "Więcej" is a phone affordance: it buckets account/utility actions that don't
// fit a narrow bottom bar. It renders on mobile (bottom bar) and tablet (top
// bar), but NOT on desktop — there its contents live in the avatar menu (top
// right) and the admin link (right of the tab row).
const MORE_TAB: TabDef = {
  id: 'more',
  label: 'Więcej',
  icon: MoreHorizontal,
  href: (b) => `${b}/more`,
  match: ['/more', '/settings', '/manage'],
}

// Sub-paths that render full-screen without the shell (header + tab bar).
const TAKEOVER_PREFIXES = ['/draft', '/midseason-draft', '/transfers']

export function AppShell({ leagueId, leagueName, hasCup, isAdmin, children }: AppShellProps) {
  const pathname = usePathname()
  const base = `/leagues/${leagueId}`
  const subPath = pathname.startsWith(base) ? pathname.slice(base.length) : ''

  // Reset scroll to top on route change so pages never land mid-scroll with a
  // clipped heading (the previous behaviour preserved scroll position).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Publish the sticky header's height as --app-header-h so descendants can pin
  // themselves just below it (e.g. the squad bench). Measured rather than
  // hardcoded: the header is one row on mobile and two on desktop, so any fixed
  // number is wrong at one breakpoint — which is how the bench ended up sliding
  // under the bar. Falls back to 0 on takeover routes, which render no header.
  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = headerRef.current
    const root = document.documentElement
    if (!el) {
      root.style.setProperty('--app-header-h', '0px')
      return
    }
    const apply = () => root.style.setProperty('--app-header-h', `${el.offsetHeight}px`)
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
    // Route changes can add/remove the header (takeovers render none); the
    // observer covers height changes within a route, e.g. crossing a breakpoint.
  }, [pathname])

  const isTakeover = TAKEOVER_PREFIXES.some((p) => subPath.startsWith(p))
  if (isTakeover) {
    // Takeovers own the whole viewport; they render their own exit control.
    return <>{children}</>
  }

  const primaryTabs = PRIMARY_TABS.filter((t) => !t.cupOnly || hasCup)

  const isActive = (tab: TabDef) => {
    if (tab.id === 'squad') {
      return subPath === '' || subPath === '/' || subPath.startsWith('/squad')
    }
    return tab.match.some((m) => m !== '' && subPath.startsWith(m))
  }
  const onManage = subPath.startsWith('/manage')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — sticky and in normal flow, so it reserves its own height and
          content is never rendered underneath it. The border/background is
          full-bleed; the rows inside sit in the shared container. */}
      <header ref={headerRef} className="sticky top-0 z-50 bg-white border-b border-gray-200">
        {/* Row 1: logo + league name (left), avatar menu (right). */}
        <div className={`${CONTAINER} h-16 flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/leagues"
              className="shrink-0 hover:opacity-80 transition-opacity"
              aria-label="Piłkarzyki — moje ligi"
            >
              <Image src="/pilkarzyki-logo.png" alt="Piłkarzyki" width={140} height={35} priority />
            </Link>
            <span className="truncate text-sm font-semibold" style={{ color: COLORS.collegiateNavy }}>
              {leagueName}
            </span>
          </div>
          {/* Avatar dropdown holds the desktop-only account/utility actions:
              Ustawienia, Zmień ligę, plus Clerk's built-in Wyloguj (visually
              separated at the foot of the menu). These are additive on mobile —
              the bottom-bar "Więcej" flow is untouched. */}
          <div className="shrink-0">
            <UserButton afterSignOutUrl="/">
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Ustawienia"
                  labelIcon={<Settings size={16} />}
                  href={`${base}/settings`}
                />
                <UserButton.Link
                  label="Zmień ligę"
                  labelIcon={<ArrowLeftRight size={16} />}
                  href="/leagues"
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>

        {/* Row 2 (top bar, ≥768px): primary tabs left-aligned. "Więcej" shows on
            tablet only (md–lg); on desktop (≥1024px) its contents move to the
            avatar menu and the admin link. "Zarządzaj ligą" is right-aligned,
            visually distinct (it's a mode, not a destination), admin-only, and
            desktop-only. */}
        <nav className="hidden md:block border-t border-gray-100 bg-white" aria-label="Nawigacja główna">
          <div className={`${CONTAINER} flex items-center py-1.5`}>
            <div className="flex items-center gap-1">
              {primaryTabs.map((tab) => (
                <DesktopTab key={tab.id} tab={tab} href={tab.href(base)} active={isActive(tab)} />
              ))}
              {/* Tablet-only bucket; hidden once the desktop layout kicks in. */}
              <DesktopTab
                tab={MORE_TAB}
                href={MORE_TAB.href(base)}
                active={isActive(MORE_TAB)}
                className="lg:hidden"
              />
            </div>
            {isAdmin && <AdminModeLink href={`${base}/manage`} active={onManage} />}
          </div>
        </nav>
      </header>

      {/* Content — same container as the header/tab bar (one left edge). */}
      <main className={`${CONTAINER} ${APP_CONTENT_Y}`}>{children}</main>

      {/* Mobile tab bar: fixed bottom, equal-width tabs, icon over label. Keeps
          the full set including "Więcej". Unchanged from before this fix. */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Nawigacja główna"
      >
        <div className="flex items-stretch justify-around">
          {primaryTabs.map((tab) => (
            <MobileTab key={tab.id} tab={tab} href={tab.href(base)} active={isActive(tab)} />
          ))}
          <MobileTab tab={MORE_TAB} href={MORE_TAB.href(base)} active={isActive(MORE_TAB)} />
        </div>
      </nav>
    </div>
  )
}

// Desktop: comfortable horizontal pill. Filled accent when active; transparent
// with a subtle hover fill when inactive.
function DesktopTab({
  tab,
  href,
  active,
  className = '',
}: {
  tab: TabDef
  href: string
  active: boolean
  className?: string
}) {
  const Icon = tab.icon
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-2 rounded-xl text-[15px] transition-colors ${
        active ? '' : 'hover:bg-gray-100'
      } ${className}`}
      style={{
        padding: '8px 16px',
        ...(active
          ? { backgroundColor: COLORS.collegiateNavy, color: COLORS.white, fontWeight: 500 }
          : { color: COLORS.textSecondary, fontWeight: 400 }),
      }}
    >
      <Icon size={20} strokeWidth={2} />
      {tab.label}
    </Link>
  )
}

// Desktop admin entry: not a primary tab. It's the doorway to a contextual mode,
// so it gets its own green treatment and sits apart (pushed right) from the
// destination tabs. Filled when inside the admin area, outlined otherwise.
function AdminModeLink({ href, active }: { href: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className="ml-auto hidden lg:inline-flex items-center gap-2 rounded-xl text-[15px] transition-colors"
      style={{
        padding: '8px 16px',
        fontWeight: 500,
        ...(active
          ? { backgroundColor: COLORS.richGreen, color: COLORS.white }
          : { color: COLORS.richGreen, boxShadow: `inset 0 0 0 1px ${COLORS.richGreen}55` }),
      }}
    >
      <Wrench size={18} strokeWidth={2} />
      Zarządzaj ligą
    </Link>
  )
}

// Mobile: equal-width, bottom-fixed, icon above label. Unchanged.
function MobileTab({ tab, href, active }: { tab: TabDef; href: string; active: boolean }) {
  const Icon = tab.icon
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
