'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Settings, ArrowRight, Archive } from 'lucide-react'
import { useState } from 'react'

interface LeagueCardProps {
  league: {
    id: string
    name: string
    season: string | null
    isAdmin: boolean
    isManager: boolean
    is_active?: boolean
  }
  index: number
}

export function LeagueCard({ league, index }: LeagueCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isArchived = league.is_active === false

  return (
    <Link
      href={`/dashboard/leagues/${league.id}`}
      className="animate-fade-in-up block"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className="rounded-2xl border group cursor-pointer h-full transition-all duration-200"
        style={{
          padding: '32px',
          backgroundColor: isArchived ? '#f9fafb' : 'white',
          borderColor: isArchived ? '#d1d5db' : '#e5e7eb',
          boxShadow: isHovered
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          opacity: isArchived ? 0.85 : 1,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between" style={{ marginBottom: '24px' }}>
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
            style={{ backgroundColor: isArchived ? 'rgba(107, 114, 128, 0.1)' : 'rgba(41, 84, 77, 0.1)' }}
          >
            <Trophy size={24} className={isArchived ? 'text-gray-500' : 'text-[#29544D]'} />
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isArchived && (
              <Badge variant="default" size="sm">
                <Archive size={12} />
                Zarchiwizowane
              </Badge>
            )}
            {league.isAdmin && (
              <Badge variant="info" size="sm">
                <Settings size={12} />
                Administrator
              </Badge>
            )}
            {league.isManager && (
              <Badge variant="success" size="sm">
                Menedżer
              </Badge>
            )}
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900" style={{ marginBottom: '8px' }}>
          {league.name}
        </h3>
        {league.season && (
          <p className="text-sm text-gray-500" style={{ marginBottom: '24px' }}>
            Sezon {league.season}
            {isArchived && ' · Tylko do odczytu'}
          </p>
        )}
        <div className="flex items-center justify-between border-t border-gray-200" style={{ marginTop: '24px', paddingTop: '24px' }}>
          <span className="text-sm text-gray-600">
            {isArchived ? 'Zobacz archiwum' : 'Zobacz ligę'}
          </span>
          <ArrowRight
            size={20}
            className={`${isArchived ? 'text-gray-500' : 'text-[#29544D]'} group-hover:translate-x-1 transition-transform`}
          />
        </div>
      </div>
    </Link>
  )
}
