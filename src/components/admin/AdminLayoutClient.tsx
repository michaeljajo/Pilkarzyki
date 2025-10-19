'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { cn } from '@/utils/cn'
import { LeagueAdminNav } from './LeagueAdminNav'
import { LeagueAdminProvider, useLeagueAdmin } from '@/contexts/LeagueAdminContext'
import Image from 'next/image'

interface AdminLayoutClientProps {
  children: ReactNode
}

const adminNavItems = [
  { href: '/dashboard/admin/leagues', label: 'My Leagues', icon: '🏆' },
]

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  const { leagueId, leagueName } = useLeagueAdmin()

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/pilkarzyki-logo.png"
                  alt="Pilkarzyki"
                  width={200}
                  height={50}
                  priority
                />
              </Link>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-gray-50 min-h-screen border-r border-gray-200">
          <nav className="mt-8">
            {leagueId ? (
              // League-specific navigation
              <LeagueAdminNav leagueId={leagueId} leagueName={leagueName || undefined} />
            ) : (
              // Global admin navigation
              <>
                <div className="px-4 mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </h3>
                </div>
                <ul className="space-y-1 px-3">
                  {adminNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            isActive
                              ? 'bg-[#29544D]/10 text-[#29544D] border-r-2 border-[#29544D]'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          )}
                        >
                          <span className="mr-3 text-lg">{item.icon}</span>
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}

            {/* Exit Admin Button */}
            <div className="px-3 mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/dashboard"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full"
              >
                Powrót do gry
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '32px', paddingBottom: '96px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  return (
    <LeagueAdminProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </LeagueAdminProvider>
  )
}