#!/usr/bin/env node
/**
 * backup-draft.js — point-in-time backup of a live draft. READ ONLY.
 *
 * During a draft the assignment exists in exactly one place: draft_picks.
 * `players.manager_id` and the `squad_players` junction are written by
 * _draft_finalize, which runs only when the last pick lands — so until then
 * the admin export (/api/admin/players/draft/export) reports empty squads and
 * is no use as a backup.
 *
 * Those rows are also easy to lose: draft_undo_last hard-deletes them with no
 * history, and draft_picks.draft_id is ON DELETE CASCADE, so removing the
 * draft row takes every pick with it.
 *
 * Writes two files per run, timestamped so snapshots accumulate:
 *   draft-<league>-<stamp>.xlsx   readable — pick order, manager, player
 *   draft-<league>-<stamp>.json   exact rows, including round_before /
 *                                 queue_before / skip_debts_before, which is
 *                                 what a faithful restore needs
 *
 * Usage:
 *   node scripts/backup-draft.js                 # newest live draft
 *   node scripts/backup-draft.js <draftId>
 *   node scripts/backup-draft.js --watch         # re-snapshot when picks change
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'draft-backups')

function readEnv() {
  const file = path.join(ROOT, '.env.local')
  const env = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const i = line.indexOf('=')
    if (i < 0 || line.trim().startsWith('#')) continue
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env = readEnv()
const { createClient } = require(path.join(ROOT, 'node_modules/@supabase/supabase-js'))
const XLSX = require(path.join(ROOT, 'node_modules/xlsx'))

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const slug = (s) => (s || 'league').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function resolveDraft(argId) {
  if (argId) {
    const { data, error } = await db.from('drafts').select('*').eq('id', argId).single()
    if (error) throw new Error(`draft ${argId} not found: ${error.message}`)
    return data
  }
  // Prefer a live draft; fall back to the most recent of any status.
  const { data } = await db
    .from('drafts')
    .select('*')
    .order('created_at', { ascending: false })
  if (!data || !data.length) throw new Error('no drafts found')
  return data.find((d) => d.status === 'live') || data[0]
}

async function snapshot(draft) {
  const { data: league } = await db
    .from('leagues')
    .select('id, name, is_active')
    .eq('id', draft.league_id)
    .single()

  const { data: picks } = await db
    .from('draft_picks')
    .select('*')
    .eq('draft_id', draft.id)
    .order('pick_number')

  const { data: squads } = await db
    .from('squads')
    .select('id, manager_id, team_name, league_id')
    .eq('league_id', draft.league_id)

  const managerIds = [...new Set(squads.map((s) => s.manager_id).filter(Boolean))]
  const { data: users } = managerIds.length
    ? await db.from('users').select('id, first_name, last_name, email').in('id', managerIds)
    : { data: [] }

  // Player lookups are chunked: `in` on a few hundred ids is fine, but this
  // pool is thousands and a single request would be refused on URL length.
  const playerIds = [...new Set(picks.map((p) => p.player_id))]
  const players = []
  for (let i = 0; i < playerIds.length; i += 200) {
    const { data } = await db
      .from('players')
      .select('id, name, surname, club, position, football_league, manager_id')
      .in('id', playerIds.slice(i, i + 200))
    players.push(...(data || []))
  }

  return { league, picks, squads, users, players }
}

function build({ draft, league, picks, squads, users, players }) {
  const squadById = new Map(squads.map((s) => [s.id, s]))
  const userById = new Map(users.map((u) => [u.id, u]))
  const playerById = new Map(players.map((p) => [p.id, p]))

  const managerName = (id) => {
    const u = userById.get(id)
    if (!u) return '—'
    return [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email || '—'
  }

  const rows = picks.map((p) => {
    const sq = squadById.get(p.squad_id)
    const pl = playerById.get(p.player_id) || {}
    return {
      Pick: p.pick_number,
      Runda: p.round,
      Menedzer: managerName(p.manager_id),
      Druzyna: (sq && sq.team_name) || '—',
      Zawodnik: [pl.name, pl.surname].filter(Boolean).join(' ').trim() || '—',
      Pozycja: pl.position || '',
      Klub: pl.club || '',
      Liga: pl.football_league || '',
      Czas: p.created_at || '',
      player_id: p.player_id,
      squad_id: p.squad_id,
    }
  })

  // Per-manager view: what each squad actually holds, in pick order.
  const bySquad = new Map()
  for (const r of rows) {
    if (!bySquad.has(r.squad_id)) bySquad.set(r.squad_id, [])
    bySquad.get(r.squad_id).push(r)
  }
  const squadRows = []
  for (const [squadId, list] of bySquad) {
    const sq = squadById.get(squadId)
    list.forEach((r, i) =>
      squadRows.push({
        Druzyna: (sq && sq.team_name) || '—',
        Menedzer: r.Menedzer,
        Nr: i + 1,
        Zawodnik: r.Zawodnik,
        Pozycja: r.Pozycja,
        Klub: r.Klub,
        Pick: r.Pick,
        Runda: r.Runda,
      })
    )
  }
  squadRows.sort((a, b) => a.Druzyna.localeCompare(b.Druzyna) || a.Nr - b.Nr)

  return { rows, squadRows, league, draft }
}

function write({ rows, squadRows, league, draft }, raw) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const base = `draft-${slug(league && league.name)}-${stamp()}`

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Picks (kolejnosc)')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(squadRows), 'Sklady')
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { pole: 'draft_id', wartosc: draft.id },
      { pole: 'liga', wartosc: (league && league.name) || '' },
      { pole: 'league_id', wartosc: draft.league_id },
      { pole: 'status', wartosc: draft.status },
      { pole: 'runda', wartosc: `${draft.round}/${draft.total_rounds}` },
      { pole: 'squad_size', wartosc: draft.squad_size },
      { pole: 'picks', wartosc: rows.length },
      { pole: 'snapshot', wartosc: new Date().toISOString() },
    ]),
    'Info'
  )

  const xlsxPath = path.join(OUT_DIR, `${base}.xlsx`)
  const jsonPath = path.join(OUT_DIR, `${base}.json`)
  XLSX.writeFile(wb, xlsxPath)
  fs.writeFileSync(jsonPath, JSON.stringify(raw, null, 2))
  return { xlsxPath, jsonPath }
}

async function runOnce(argId) {
  const draft = await resolveDraft(argId)
  const snap = await snapshot(draft)
  const built = build({ draft, ...snap })
  const raw = {
    snapshot_at: new Date().toISOString(),
    draft,
    league: snap.league,
    squads: snap.squads,
    draft_picks: snap.picks,
  }
  const out = write(built, raw)
  console.log(
    `[${new Date().toLocaleTimeString()}] ${snap.league && snap.league.name} — ` +
      `${snap.picks.length} picks, status=${draft.status}, round ${draft.round}/${draft.total_rounds}`
  )
  console.log(`  ${out.xlsxPath}`)
  console.log(`  ${out.jsonPath}`)
  return snap.picks.length
}

async function main() {
  const args = process.argv.slice(2)
  const watch = args.includes('--watch')
  const argId = args.find((a) => !a.startsWith('--'))

  if (!watch) {
    await runOnce(argId)
    return
  }

  console.log('Watching — a new snapshot is written whenever the pick count changes. Ctrl-C to stop.')
  let last = -1
  for (;;) {
    try {
      const draft = await resolveDraft(argId)
      const { count } = await db
        .from('draft_picks')
        .select('*', { count: 'exact', head: true })
        .eq('draft_id', draft.id)
      if (count !== last) {
        last = await runOnce(argId)
      }
    } catch (e) {
      console.error('  (retrying)', e.message)
    }
    await new Promise((r) => setTimeout(r, 15000))
  }
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
