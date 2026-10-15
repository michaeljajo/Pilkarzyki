import { NextResponse } from 'next/server'
import { runSofascoreProbes } from '@/lib/score-sync/probe'

// TEMPORARY (Phase 0 spike): can a Vercel function reach SofaScore via impit?
// Probes three fixed public endpoints and reports status codes only.
// Delete together with src/lib/score-sync/probe.ts once hosting is decided.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const results = await runSofascoreProbes()
  return NextResponse.json({
    region: process.env.VERCEL_REGION ?? 'local',
    allOk: results.every((r) => r.ok),
    results,
  })
}
