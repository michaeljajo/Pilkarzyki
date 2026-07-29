'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UserButton } from '@clerk/nextjs'
import { APP_CONTAINER } from '@/components/layout/appContainer'

interface DashboardNavProps {
  /**
   * Optional context label shown beside the logo. Occupies the same slot, and
   * uses the same treatment, as the league name in the AppShell header — so a
   * page outside a league (e.g. "Utwórz Ligę") reads as the same kind of place
   * as a page inside one.
   */
  title?: string
}

/**
 * Header for pages outside a league (the leagues list, league creation).
 * Deliberately the same object as the AppShell header — same container, same
 * 64px row, same logo size, same avatar menu on the right — minus the tab bar,
 * which has nothing to point at until a league is chosen.
 */
export function DashboardNav({ title }: DashboardNavProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className={`${APP_CONTAINER} h-16 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/leagues"
            className="shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Piłkarzyki — moje ligi"
          >
            <Image
              src="/pilkarzyki-logo.png"
              alt="Piłkarzyki"
              width={140}
              height={35}
              priority
            />
          </Link>
          {title && (
            <span className="truncate text-sm font-semibold" style={{ color: '#061852' }}>
              {title}
            </span>
          )}
        </div>
        <div className="shrink-0">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  )
}
