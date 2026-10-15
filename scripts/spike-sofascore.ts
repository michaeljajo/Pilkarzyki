/**
 * Phase 0 spike: can this machine reach SofaScore through the impit transport?
 *
 *   npx tsx scripts/spike-sofascore.ts
 *
 * Prints one line per probe and exits non-zero if any probe fails. Run it
 * locally, in GitHub Actions and (via /api/cron/spike-sofascore) on Vercel to
 * decide where the score sync can run. Delete once the decision is made.
 */
import { runSofascoreProbes } from '../src/lib/score-sync/probe'

async function main() {
  const results = await runSofascoreProbes()
  for (const r of results) {
    console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.status ?? '---'} ${r.ms}ms ${r.path} ${r.detail}`)
  }
  if (results.some((r) => !r.ok)) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
