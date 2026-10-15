import { createImpitTransport, SofascoreHttpError } from './transport'

/** Reachability probes for the Phase 0 spike (temporary). */

export interface ProbeResult {
  path: string
  ok: boolean
  status: number | null
  ms: number
  detail: string
}

const PROBES: Array<{ path: string; describe: (json: unknown) => string }> = [
  {
    path: '/player/41789',
    describe: (j) => (j as { player?: { name?: string } }).player?.name ?? '?',
  },
  {
    path: '/event/15534169/incidents',
    describe: (j) => `${(j as { incidents?: unknown[] }).incidents?.length ?? 0} incidents`,
  },
  {
    path: '/sport/football/events/live',
    describe: (j) => `${(j as { events?: unknown[] }).events?.length ?? 0} live events`,
  },
]

export async function runSofascoreProbes(): Promise<ProbeResult[]> {
  const transport = createImpitTransport()
  const results: ProbeResult[] = []
  for (const probe of PROBES) {
    const started = Date.now()
    try {
      const json = await transport.getJson<unknown>(probe.path)
      results.push({ path: probe.path, ok: true, status: 200, ms: Date.now() - started, detail: probe.describe(json) })
    } catch (error) {
      const status = error instanceof SofascoreHttpError ? error.status : null
      const detail = error instanceof Error ? error.message : String(error)
      results.push({ path: probe.path, ok: false, status, ms: Date.now() - started, detail })
    }
  }
  return results
}
