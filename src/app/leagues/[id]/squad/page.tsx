import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import SquadSelection from '@/components/SquadSelection'
import { SkladStatusHeader } from '@/components/sklad/SkladStatusHeader'
import { TakeoverBanner } from '@/components/sklad/TakeoverBanner'

interface SquadPageProps {
  params: Promise<{ id: string }>
}

export default async function SquadPage({ params }: SquadPageProps) {
  const user = await currentUser()
  const { id: leagueId } = await params

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div>
      {/* Status header above the pitch: live deadline countdown, lineup status
          for both competitions, next fixture, and the competition switcher.
          The lineup picker below is unchanged. */}
      <TakeoverBanner leagueId={leagueId} />
      <Suspense fallback={null}>
        <SkladStatusHeader leagueId={leagueId} />
      </Suspense>
      <SquadSelection leagueId={leagueId} />
    </div>
  )
}
