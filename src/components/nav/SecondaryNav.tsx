'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface SecondaryNavItem {
  label: string
  href: string
}

interface SecondaryNavProps {
  items: SecondaryNavItem[]
  ariaLabel: string
}

/**
 * The app's only second-level navigation (Liga / Puchar sections, and the admin
 * manage area). Deliberately subordinate to the main tab bar: smaller text, no
 * filled pill — an underline marks the active item.
 */
export function SecondaryNav({ items, ariaLabel }: SecondaryNavProps) {
  const pathname = usePathname()
  return (
    // overflow-y-hidden is required: setting only overflow-x to auto computes
    // overflow-y to auto as well, which showed a stray vertical scrollbar here.
    <nav
      aria-label={ariaLabel}
      className="mb-5 border-b border-gray-200 -mx-4 px-4 overflow-x-auto overflow-y-hidden"
    >
      {/* globals.css styles `ul`/`li` for prose (24px list indent, 8px bottom
          margin, last-child 0). In a centred flex row that indent pushes the nav
          off the content's left edge, and the uneven bottom margins drop the last
          item 4px below its siblings. Reset all three here — this is a nav, not
          prose. */}
      <ul className="flex items-center gap-1 list-none p-0 m-0">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href} className="m-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="inline-flex items-center min-h-[40px] px-3 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px"
                style={
                  active
                    ? { color: '#061852', fontWeight: 600, borderColor: '#061852' }
                    : { color: '#6b7280', fontWeight: 500, borderColor: 'transparent' }
                }
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
