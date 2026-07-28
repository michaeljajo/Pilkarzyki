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
    <nav aria-label={ariaLabel} className="mb-5 border-b border-gray-200 -mx-4 px-4 overflow-x-auto">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href}>
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
