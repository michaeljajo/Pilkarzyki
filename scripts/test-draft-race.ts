/**
 * Race-condition test for the draft pick path.
 *
 * Fires two concurrent picks of the SAME player and asserts that exactly one
 * succeeds — the other must be rejected (PLAYER_TAKEN or the
 * UNIQUE(draft_id, player_id) constraint). Also exercises start / skip / undo.
 *
 * Requires a seeded league (see scripts/seed-test-draft.ts) and migration 022
 * applied.
 *
 * Usage: npx tsx scripts/test-draft-race.ts <leagueName>
 *   default leagueName = "Draft Test League"
 */

import { supabaseAdmin } from '../src/lib/supabase'

const LEAGUE_NAME = process.argv[2] || 'Draft Test League'

async function main() {
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name')
    .eq('name', LEAGUE_NAME)
    .maybeSingle()
  if (!league) throw new Error(`League "${LEAGUE_NAME}" not found — run seed-test-draft.ts first.`)

  const { data: draft } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('league_id', league.id)
    .single()
  if (!draft) throw new Error('No draft for this league.')

  // Ensure the draft is live.
  if (draft.status === 'setup') {
    const { data: squads } = await supabaseAdmin.from('squads').select('id').eq('league_id', league.id)
    const order = (squads || []).map(s => s.id)
    const { error } = await supabaseAdmin.rpc('draft_start', { p_draft_id: draft.id, p_pick_order: order })
    if (error) throw new Error(`draft_start failed: ${error.message}`)
    console.log(`▶️  Started draft with ${order.length} managers`)
  }

  // Two available players.
  const { data: players } = await supabaseAdmin
    .from('players')
    .select('id, surname')
    .eq('league', league.name)
    .limit(5)
  const takenIds = new Set(
    ((await supabaseAdmin.from('draft_picks').select('player_id').eq('draft_id', draft.id)).data || []).map(p => p.player_id)
  )
  const available = (players || []).filter(p => !takenIds.has(p.id))
  if (available.length === 0) throw new Error('No available players to test with.')
  const target = available[0]

  console.log(`\n🏁 Racing two concurrent picks for player ${target.surname} (${target.id})...`)
  const results = await Promise.allSettled([
    supabaseAdmin.rpc('draft_admin_pick', { p_draft_id: draft.id, p_player_id: target.id }),
    supabaseAdmin.rpc('draft_admin_pick', { p_draft_id: draft.id, p_player_id: target.id }),
  ])

  let ok = 0
  let rejected = 0
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && !r.value.error) {
      ok++
      console.log(`  call ${i + 1}: ✅ succeeded`)
    } else {
      rejected++
      const msg = r.status === 'fulfilled' ? r.value.error?.message : (r.reason as Error).message
      console.log(`  call ${i + 1}: 🚫 rejected -> ${msg}`)
    }
  })

  const pass = ok === 1 && rejected === 1
  console.log(`\n${pass ? '✅ PASS' : '❌ FAIL'}: exactly one pick should succeed (got ok=${ok}, rejected=${rejected})`)

  // Verify only one pick row exists for the player.
  const { count } = await supabaseAdmin
    .from('draft_picks')
    .select('id', { count: 'exact', head: true })
    .eq('draft_id', draft.id)
    .eq('player_id', target.id)
  console.log(`   draft_picks rows for player: ${count} (expected 1)`)

  // Exercise undo (repeatable) to leave state clean-ish.
  const { error: undoErr } = await supabaseAdmin.rpc('draft_undo', { p_draft_id: draft.id })
  console.log(undoErr ? `   undo error: ${undoErr.message}` : '   ↩️  undo of the successful pick OK')

  process.exit(pass && count === 1 ? 0 : 1)
}

main().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
