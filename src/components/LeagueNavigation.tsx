'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface LeagueNavigationProps {
  leagueId: string
  leagueName: string
  currentPage: 'squad' | 'results' | 'standings' | 'cup-results' | 'cup-standings'
  showSquadTab?: boolean // Some leagues might not have squad access for certain users
}

const navigationTabs = [
  { id: 'squad', label: 'Skład', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/squad`, isCup: false },
  { id: 'results', label: 'Wyniki', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/results`, isCup: false },
  { id: 'standings', label: 'Tabela', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/standings`, isCup: false },
  { id: 'cup-results', label: '🏆 Wyniki Pucharu', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/cup/results`, isCup: true },
  { id: 'cup-standings', label: '🏆 Tabela Pucharu', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/cup/standings`, isCup: true },
] as const

export function LeagueNavigation({
  leagueId,
  leagueName,
  currentPage,
  showSquadTab = true
}: LeagueNavigationProps) {
  const { user } = useUser()
  const [hasCup, setHasCup] = useState(false)
  const [loadingCup, setLoadingCup] = useState(true)

  useEffect(() => {
    // Check if league has a cup
    async function checkForCup() {
      // Don't fetch if leagueId is not available yet
      if (!leagueId) {
        setLoadingCup(false)
        return
      }

      try {
        const response = await fetch(`/api/cups?leagueId=${leagueId}`)
        if (response.ok) {
          const data = await response.json()
          const cupExists = data.cup !== null && data.cup !== undefined
          setHasCup(cupExists)
        }
      } catch (error) {
        console.error('Failed to check for cup:', error)
      } finally {
        setLoadingCup(false)
      }
    }
    checkForCup()
  }, [leagueId])

  // Filter tabs based on squad visibility and cup existence
  let filteredTabs = navigationTabs.filter(tab => {
    if (tab.id === 'squad' && !showSquadTab) return false
    if (tab.isCup && !hasCup) return false
    return true
  })

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
              <Image
                src="/pilkarzyki-logo.png"
                alt="Pilkarzyki"
                width={200}
                height={50}
                priority
              />
            </Link>
          </div>

          {/* Center: Navigation Tabs */}
          <div className="flex items-center gap-1">
            {filteredTabs.map((tab) => {
              const isActive = tab.id === currentPage
              const isCupTab = tab.isCup
              return (
                <Link
                  key={tab.id}
                  href={tab.href(leagueId)}
                  className={`min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center ${
                    isActive
                      ? isCupTab
                        ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-700 hover:shadow-md focus:ring-amber-600'
                        : 'bg-[#061852] text-white shadow-sm hover:bg-[#0a2475] hover:shadow-md focus:ring-[#061852]'
                      : 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300'
                  }`}
                  style={{ paddingLeft: '2em', paddingRight: '2em' }}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>

          {/* Right: Back Button and User Profile */}
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/leagues/${leagueId}`}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#29544D] transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              <span>Wróć</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
