'use client'

import { UserButton } from '@clerk/nextjs'
import { Badge } from '@/components/ui/Badge'
import { Settings } from 'lucide-react'
import Image from 'next/image'

interface DashboardNavProps {
  hasAdminAccess: boolean
}

export function DashboardNav({ hasAdminAccess }: DashboardNavProps) {
  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Image
              src="/pilkarzyki-logo.png"
              alt="Pilkarzyki"
              width={200}
              height={50}
              priority
            />
          </div>
          <div className="flex items-center gap-4">
            {hasAdminAccess && (
              <Badge variant="info" size="sm">
                <Settings size={12} />
                Admin
              </Badge>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  )
}
