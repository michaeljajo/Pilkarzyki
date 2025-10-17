'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Settings, ArrowRight } from 'lucide-react'
import { useState } from 'react'

interface LeagueCardProps {
  league: {
    id: string
    name: string
    season: string | null
    isAdmin: boolean
    isManager: boolean
  }
  index: number
}

export function LeagueCard({ league, index }: LeagueCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={`/dashboard/leagues/${league.id}`}
      className="animate-fade-in-up block"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className="bg-white rounded-2xl border border-gray-200 group cursor-pointer h-full transition-all duration-200"
        style={{
          padding: '32px',
          boxShadow: isHovered
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between" style={{ marginBottom: '24px' }}>
          <div className="w-12 h-12 rounded-lg bg-[#29544D]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Trophy size={24} className="text-[#29544D]" />
          </div>
          <div className="flex items-center gap-2">
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
          </p>
        )}
        <div className="flex items-center justify-between border-t border-gray-200" style={{ marginTop: '24px', paddingTop: '24px' }}>
          <span className="text-sm text-gray-600">
            Zobacz ligę
          </span>
          <ArrowRight
            size={20}
            className="text-[#29544D] group-hover:translate-x-1 transition-transform"
          />
        </div>
      </div>
    </Link>
  )
}
