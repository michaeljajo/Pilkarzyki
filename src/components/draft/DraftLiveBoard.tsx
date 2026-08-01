'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Users, MessageSquare, ListChecks, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { LeagueFlag } from '@/components/ui/LeagueFlag'
import { Modal } from '@/components/ui/Modal'
import { FilterCombo } from '@/components/ui/FilterCombo'
import { fold } from '@/utils/text'
import { positionFromLabel, positionLabel } from '@/lib/positions'
import { Delegation, delegateForSquad, resolveActingForSquadId } from '@/lib/draft-delegations'

// Shared presentational board for the live/finished draft, matching the
// pre-season draft screen exactly. Used by the mid-season draft so the two look
// identical. (The pre-season DraftClient still renders its own copy for now.)

export interface BoardPlayer {
  id: string
  name: string
  surname: string
  club: string | null
  football_league: string | null
  position: string
}
export interface BoardManager {
  squadId: string
  managerId: string
  teamName: string | null
  firstName: string
  lastName: string
  email: string
}
export interface BoardPick {
  id: string
  squad_id: string
  manager_id: string
  player_id: string
  pick_number: number
}

export function managerName(m: BoardManager | undefined | null): string {
  if (!m) return '—'
  const full = [m.firstName, m.lastName].filter(Boolean).join(' ').trim()
  return m.teamName || full || m.email || 'Menedżer'
}

function Roster({
  managers,
  picks,
  players,
  onClockSquadId,
  slotCount,
  delegations,
}: {
  managers: BoardManager[]
  picks: BoardPick[]
  players: BoardPlayer[]
  onClockSquadId: string | null
  slotCount: (squadId: string) => number
  delegations?: Delegation[]
}) {
  const managersByManagerId = useMemo(() => {
    const map = new Map<string, BoardManager>()
    managers.forEach((m) => map.set(m.managerId, m))
    return map
  }, [managers])

  const playersById = useMemo(() => {
    const map = new Map<string, BoardPlayer>()
    players.forEach((p) => map.set(p.id, p))
    return map
  }, [players])

  const picksBySquad = useMemo(() => {
    const map = new Map<string, BoardPick[]>()
    picks.forEach((p) => {
      const arr = map.get(p.squad_id) || []
      arr.push(p)
      map.set(p.squad_id, arr)
    })
    map.forEach((arr) => arr.sort((a, b) => a.pick_number - b.pick_number))
    return map
  }, [picks])

  const delegateOf = (squadId: string) => {
    const id = delegateForSquad(delegations, squadId)
    return id ? managersByManagerId.get(id) : undefined
  }

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (squadId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(squadId)) next.delete(squadId)
      else next.add(squadId)
      return next
    })

  return (
    /* Same deal as the chat: fills the tab panel on a phone, fixed cap from md. */
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 flex flex-col flex-1 min-h-0 md:block md:flex-none">
      <h2 className="shrink-0 text-lg font-semibold text-gray-900 mb-3">Składy</h2>
      <div className="flex-1 min-h-0 space-y-3 overflow-auto overscroll-contain md:max-h-[420px] md:flex-none">
        {managers.map((m) => {
          const mp = picksBySquad.get(m.squadId) || []
          const onClock = m.squadId === onClockSquadId
          const isOpen = expanded.has(m.squadId)
          return (
            <div
              key={m.squadId}
              className={`rounded-lg border p-3 ${onClock ? 'border-[#29544D] bg-[#29544D]/5' : 'border-gray-100'}`}
            >
              <button
                type="button"
                onClick={() => toggle(m.squadId)}
                className="w-full flex items-center justify-between gap-2 text-left"
              >
                <span className="flex items-center gap-1.5 font-medium text-gray-900">
                  <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}>▸</span>
                  {managerName(m)}
                  {delegateOf(m.squadId) && (
                    <span className="text-xs font-normal text-amber-700">
                      zast.: {managerName(delegateOf(m.squadId))}
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-500">
                  {mp.length}/{slotCount(m.squadId)}
                  {onClock && <span className="ml-1 text-[#29544D] font-semibold"> teraz wybiera</span>}
                </span>
              </button>
              {isOpen && mp.length === 0 && <p className="mt-2 text-xs text-gray-400">Brak wyborów.</p>}
              {isOpen && mp.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {mp.map((pick) => {
                    const pl = playersById.get(pick.player_id)
                    return (
                      <li key={pick.id} className="text-xs text-gray-600 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-gray-800">{pl ? `${pl.name} ${pl.surname}` : '—'}</span>
                        {pl?.club && <span className="text-gray-500">{pl.club}</span>}
                        {pl && <LeagueFlag league={pl.football_league} height={11} />}
                        {pl && <span className="text-gray-400">{positionLabel(pl.position)}</span>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface DraftLiveBoardProps {
  /** e.g. "Runda 2" — shown next to who is on the clock. */
  roundLabel: string
  status: 'live' | 'finished'
  players: BoardPlayer[]
  /** Ids eligible for the pool table; omit to show all (pre-season style). */
  poolIds?: Set<string>
  picks: BoardPick[]
  managers: BoardManager[]
  onClockSquadId: string | null
  onClockManagerId: string | null
  /** Squad that picks after the one on the clock — shown in the header. */
  nextSquadId?: string | null
  isAdmin: boolean
  myTurn: boolean
  /** Active stand-ins, so the board can flag whose picks someone else makes. */
  delegations?: Delegation[]
  /** Internal user id of the viewer — needed to spot his own delegations. */
  myUserId?: string | null
  mySquadId?: string | null
  submitting: boolean
  onConfirmPick: (playerId: string) => void
  onAdminPick: (playerId: string) => void
  onSkip: () => void
  onUndo: () => void
  /** Roster denominator per squad (pre-season: squad size; mid-season: quota+picks). */
  slotCount: (squadId: string) => number
  /** Optional right-column content above the roster (e.g. chat). */
  sideTop?: ReactNode
  /** Extra controls for the single action bar beside the round summary, so the
   *  screen has one row of buttons instead of a staircase of right-aligned ones. */
  actions?: ReactNode
  /** Admin: add a free-agent player to the pool live. Renders the button+modal when set. */
  onAddPlayer?: (form: { fullName: string; footballLeague: string; club: string; position: string }) => Promise<boolean>
  /** Admin: edit a player's details live (e.g. a last-minute transfer). Renders a row action when set. */
  onEditPlayer?: (
    playerId: string,
    form: { fullName: string; club: string; footballLeague: string; position: string }
  ) => Promise<boolean>
}

type MobileTab = 'pool' | 'chat' | 'roster'

/** Phone-only sections, in bar order. "Czat" is dropped when there is no chat. */
const MOBILE_TABS: { id: MobileTab; label: string; Icon: LucideIcon }[] = [
  { id: 'pool', label: 'Draft', Icon: Users },
  { id: 'chat', label: 'Czat', Icon: MessageSquare },
  { id: 'roster', label: 'Składy', Icon: ListChecks },
]

const POSITION_OPTIONS_PL = ['Bramkarz', 'Obrońca', 'Pomocnik', 'Napastnik']
const POSITION_EN_BY_PL: Record<string, string> = {
  Bramkarz: 'Goalkeeper',
  Obrońca: 'Defender',
  Pomocnik: 'Midfielder',
  Napastnik: 'Forward',
}

export function DraftLiveBoard({
  roundLabel,
  status,
  players,
  poolIds,
  picks,
  managers,
  onClockSquadId,
  onClockManagerId,
  nextSquadId,
  isAdmin,
  myTurn,
  delegations,
  myUserId,
  mySquadId,
  submitting,
  onConfirmPick,
  onAdminPick,
  onSkip,
  onUndo,
  slotCount,
  sideTop,
  actions,
  onAddPlayer,
  onEditPlayer,
}: DraftLiveBoardProps) {
  const [search, setSearch] = useState('')
  const [fLeague, setFLeague] = useState('')
  const [fClub, setFClub] = useState('')
  const [fPosition, setFPosition] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  // Phone only: the three panels are peers reached from a bottom bar instead of
  // being stacked into one very long scroll. Ignored from md up, where they all
  // fit on screen at once.
  const [mobileTab, setMobileTab] = useState<MobileTab>('pool')
  const [showFilters, setShowFilters] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ fullName: '', footballLeague: '', club: '', position: 'Napastnik' })
  const [addingPlayer, setAddingPlayer] = useState(false)

  const [editing, setEditing] = useState<BoardPlayer | null>(null)
  const [editForm, setEditForm] = useState({ fullName: '', club: '', footballLeague: '', position: 'Forward' })
  const [savingEdit, setSavingEdit] = useState(false)

  const canEdit = isAdmin && !!onEditPlayer
  const canAdd = isAdmin && !!onAddPlayer && status === 'live'

  const openEdit = (p: BoardPlayer) => {
    setEditForm({
      fullName: `${p.name} ${p.surname}`.trim(),
      club: p.club || '',
      footballLeague: p.football_league || '',
      position: p.position,
    })
    setEditing(p)
  }

  const submitAdd = async () => {
    if (!onAddPlayer) return
    setAddingPlayer(true)
    const ok = await onAddPlayer(addForm)
    setAddingPlayer(false)
    if (ok) {
      setShowAdd(false)
      setAddForm({ fullName: '', footballLeague: '', club: '', position: 'Napastnik' })
    }
  }

  const submitEdit = async () => {
    if (!onEditPlayer || !editing) return
    setSavingEdit(true)
    const ok = await onEditPlayer(editing.id, editForm)
    setSavingEdit(false)
    if (ok) setEditing(null)
  }

  const managersByManagerId = useMemo(() => {
    const map = new Map<string, BoardManager>()
    managers.forEach((m) => map.set(m.managerId, m))
    return map
  }, [managers])

  const managersBySquad = useMemo(() => {
    const map = new Map<string, BoardManager>()
    managers.forEach((m) => map.set(m.squadId, m))
    return map
  }, [managers])

  const pickByPlayer = useMemo(() => {
    const map = new Map<string, BoardPick>()
    picks.forEach((p) => map.set(p.player_id, p))
    return map
  }, [picks])

  const poolPlayers = useMemo(
    () => (poolIds ? players.filter((p) => poolIds.has(p.id)) : players),
    [players, poolIds]
  )

  const playersById = useMemo(() => {
    const map = new Map<string, BoardPlayer>()
    players.forEach((p) => map.set(p.id, p))
    return map
  }, [players])

  // One predicate per dropdown, so each option list can re-apply *all but its
  // own* — that is what makes the dropdowns cascade (picking a country leaves
  // only that country's clubs in the club list). The free-text search is
  // deliberately not part of this: typing a name must never silently drop a
  // filter the user set on purpose.
  const matchers = useMemo(
    () => ({
      league: (p: BoardPlayer) => !fLeague || p.football_league === fLeague,
      club: (p: BoardPlayer) => !fClub || p.club === fClub,
      position: (p: BoardPlayer) => !fPosition || p.position === fPosition,
    }),
    [fLeague, fClub, fPosition]
  )

  const options = useMemo(() => {
    const keys = ['league', 'club', 'position'] as const
    const selectors: Record<(typeof keys)[number], (p: BoardPlayer) => string | null> = {
      league: (p) => p.football_league,
      club: (p) => p.club,
      position: (p) => p.position,
    }
    const collected = { league: [] as string[], club: [] as string[], position: [] as string[] }

    keys.forEach((key) => {
      const others = keys.filter((k) => k !== key)
      const set = new Set<string>()
      poolPlayers.forEach((p) => {
        if (!others.every((k) => matchers[k](p))) return
        const v = selectors[key](p)
        if (v) set.add(v)
      })
      collected[key] = Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'))
    })

    return collected
  }, [poolPlayers, matchers])

  const hasFilters = !!(search || fLeague || fClub || fPosition)
  const activeFilterCount = [fLeague, fClub, fPosition].filter(Boolean).length
  const clearFilters = () => {
    setSearch('')
    setFLeague('')
    setFClub('')
    setFPosition('')
  }

  // Narrowing one filter can strand another (club "Arsenal" + country "Niemcy"
  // shows nothing). Drop the stranded selection instead of leaving an empty table.
  useEffect(() => {
    if (fClub && !options.club.includes(fClub)) setFClub('')
  }, [fClub, options.club])
  useEffect(() => {
    if (fPosition && !options.position.includes(fPosition)) setFPosition('')
  }, [fPosition, options.position])

  // Country first, then club, then surname — the order managers scan the pool
  // in. Rows without a country/club sort last rather than to the top.
  const filteredPlayers = useMemo(() => {
    const q = fold(search)
    const byText = (a: string | null, b: string | null) => {
      if (a === b) return 0
      if (!a) return 1
      if (!b) return -1
      return a.localeCompare(b, 'pl')
    }
    return poolPlayers
      .filter(
        (p) =>
          (!q || fold(`${p.name} ${p.surname}`).includes(q)) &&
          matchers.league(p) &&
          matchers.club(p) &&
          matchers.position(p)
      )
      .sort(
        (a, b) =>
          byText(a.football_league, b.football_league) ||
          byText(a.club, b.club) ||
          byText(a.surname, b.surname) ||
          byText(a.name, b.name)
      )
  }, [poolPlayers, search, matchers])

  const onClockManager = managersByManagerId.get(onClockManagerId || '')
  const nextManager = nextSquadId ? managersBySquad.get(nextSquadId) : undefined

  // The most recent pick, for the "who just picked what" line.
  const lastPick = useMemo(
    () => picks.reduce<BoardPick | null>((best, p) => (!best || p.pick_number > best.pick_number ? p : best), null),
    [picks]
  )
  const lastPickPlayer = lastPick ? playersById.get(lastPick.player_id) : undefined
  const lastPickManager = lastPick ? managersBySquad.get(lastPick.squad_id) : undefined

  // Whose turn it is, derived from the queue rather than trusted from the
  // `myTurn` flag alone: the two must never disagree, or an admin picking in his
  // own round gets offered "Wybierz za <himself>" instead of a plain confirm.
  const isMyTurn = status === 'live' && (myTurn || (!!mySquadId && mySquadId === onClockSquadId))

  // Acting-for mode is derived from whose turn it is — never from a toggle the
  // user could leave switched on, which is what would make a pick land in the
  // wrong squad.
  const actingForSquadId =
    status === 'live'
      ? resolveActingForSquadId({ delegations, onClockSquadId, myUserId, mySquadId })
      : null
  const actingFor = actingForSquadId ? managersBySquad.get(actingForSquadId) : undefined
  const actingForName = actingFor ? managerName(actingFor) : ''

  const onClockDelegateId = delegateForSquad(delegations, onClockSquadId)
  const onClockDelegate = onClockDelegateId ? managersByManagerId.get(onClockDelegateId) : undefined

  return (
    /* Phone: the screen is exactly one viewport tall and never scrolls as a
       whole — only the player list and the chat log scroll, inside themselves.
       The height budget is dvh (so Safari's collapsing URL bar is handled)
       minus the 4rem takeover header and the 1rem top padding of <main>; the
       tab bar is the last flex item, so it lands on the viewport edge without
       any magic numbers. From md this all reverts to ordinary page flow. */
    <div className="flex flex-col h-[calc(100dvh-5rem)] overflow-hidden space-y-4 md:h-auto md:block md:overflow-visible md:space-y-6">
      {isMyTurn && (
        <div className="shrink-0 rounded-xl bg-[#29544D] text-white px-6 py-2.5 text-center text-lg font-bold shadow-lg animate-pulse">
          TWOJA KOLEJ!
        </div>
      )}

      {actingForSquadId && (
        <div className="shrink-0 rounded-xl bg-amber-500 text-white px-6 py-2.5 text-center text-base md:text-lg font-bold shadow-lg">
          WYBIERASZ ZA: {actingForName.toUpperCase()}
          <span className="block text-sm font-normal opacity-90">
            Zastępstwo — zawodnik trafi do składu tego menedżera.
          </span>
        </div>
      )}

      {/* Chronological: what just happened, what is happening, what is next.
          The middle line stays the loud one — it is the only one anybody has to
          act on. Each line is ordinary inline text rather than flex children, so
          it wraps as a sentence instead of breaking into a column of fragments
          on a narrow screen. */}
      <div className="shrink-0 flex flex-wrap items-start justify-between gap-3">
        {status === 'live' ? (
          <div className="min-w-0 space-y-0.5">
            {/* Desktop: previous pick on its own line, in full. */}
            {lastPick && (
              <p className="hidden md:block text-sm text-gray-500">
                Poprzedni wybór:{' '}
                <span className="font-medium text-gray-700">{managerName(lastPickManager)}</span>
                {' — '}
                <span className="font-medium text-gray-700">
                  {lastPickPlayer ? `${lastPickPlayer.name} ${lastPickPlayer.surname}`.trim() : '—'}
                </span>
                {lastPickPlayer?.club && <> · {lastPickPlayer.club}</>}
                {lastPickPlayer && (
                  <>
                    {' '}
                    <LeagueFlag league={lastPickPlayer.football_league} height={11} />
                  </>
                )}
                {lastPickPlayer && <> · {positionLabel(lastPickPlayer.position)}</>}
              </p>
            )}

            <p className="text-gray-600 truncate md:whitespace-normal">
              <span className="md:hidden">{roundLabel} · Teraz: </span>
              <span className="hidden md:inline">{roundLabel} · Teraz wybiera: </span>
              <span className="text-lg font-bold text-gray-900">{managerName(onClockManager)}</span>
              {onClockDelegate && (
                <span className="ml-2 text-amber-700">
                  (zastępstwo: {managerName(onClockDelegate)})
                </span>
              )}
            </p>

            {/* Phone: previous and next collapse into one truncated line —
                three wrapping sentences ate half the screen before the pool. */}
            <p className="md:hidden text-xs text-gray-500 truncate">
              {lastPickPlayer && (
                <>
                  ← {`${lastPickPlayer.name} ${lastPickPlayer.surname}`.trim()} ({managerName(lastPickManager)})
                </>
              )}
              {lastPickPlayer && nextManager && ' · '}
              {nextManager && <>→ {managerName(nextManager)}</>}
            </p>

            {nextManager && (
              <p className="hidden md:block text-sm text-gray-500">
                Następny wybiera:{' '}
                <span className="font-medium text-gray-700">{managerName(nextManager)}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Draft zakończony</p>
        )}
        {/* One action bar for the whole screen. Labels shorten on a phone so the
            row stays a row instead of becoming a stack of full-width buttons. */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
          {canAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm whitespace-nowrap px-3 py-2 rounded-md bg-[#29544D] text-white hover:bg-[#1f423c]"
            >
              <span className="md:hidden">+ Dodaj</span>
              <span className="hidden md:inline">+ Dodaj zawodnika</span>
            </button>
          )}
        </div>
      </div>

      {/* Two columns only from xl. Between lg and xl the pool column resolved to
          ~640px, which is narrower than the table's natural width, so the board
          side-scrolled at exactly the sizes a laptop uses. Below xl the pool
          takes the full width and chat/rosters stack underneath it. */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: player pool. On a phone it is a flex column that hands all the
            leftover height to the list, so the list scrolls and the page does not. */}
        <div
          className={`${
            mobileTab === 'pool' ? 'flex' : 'hidden md:block'
          } flex-col min-h-0 space-y-4 md:block xl:col-span-2`}
        >
          {isAdmin && status === 'live' && (
            <div className="shrink-0 flex flex-wrap gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              {/* The label is a heading for a two-button row; on a phone it just
                  forces the buttons onto a second line, so it waits for md. */}
              <span className="hidden md:inline text-sm font-medium text-amber-800 self-center mr-2">
                Panel administratora:
              </span>
              <button
                onClick={onSkip}
                disabled={submitting}
                className="flex-1 md:flex-none text-sm whitespace-nowrap px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Pomiń kolejkę
              </button>
              <button
                onClick={onUndo}
                disabled={submitting || picks.length === 0}
                className="flex-1 md:flex-none text-sm whitespace-nowrap px-3 py-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                <span className="md:hidden">Cofnij wybór</span>
                <span className="hidden md:inline">Cofnij ostatni wybór</span>
              </button>
              {/* Instructional, not actionable — costs two lines on a phone
                  above the thing it is describing, so it waits for the room. */}
              <span className="hidden sm:inline text-xs text-amber-700 self-center">
                Aby wybrać za nieobecnego menedżera, kliknij zawodnika i użyj „Wybierz za menedżera”.
              </span>
            </div>
          )}

          {/* Phone: one row — search plus a Filtry button that opens a sheet.
              Three dropdowns inline cost three whole lines above the pool. */}
          <div className="shrink-0 flex gap-2 md:hidden">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj zawodnika"
              className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
            />
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border ${
                activeFilterCount > 0
                  ? 'border-[#29544D] text-[#29544D] bg-[#29544D]/5 font-medium'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filtry
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#29544D] text-white text-[11px]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop keeps everything inline. */}
          <div className="hidden md:grid grid-cols-2 gap-2 lg:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj zawodnika"
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md col-span-2 lg:col-span-1"
            />
            <FilterCombo label="Liga" value={fLeague} options={options.league} onChange={setFLeague} />
            <FilterCombo label="Klub" value={fClub} options={options.club} onChange={setFClub} />
            <FilterCombo
              label="Pozycja"
              value={fPosition ? positionLabel(fPosition) : ''}
              options={options.position.map(positionLabel)}
              onChange={(pl) => setFPosition(positionFromLabel(pl))}
            />
          </div>

          {/* Only shown once something is actually filtered — that is the only
              moment it means anything, and it doubles as a cue that the list
              on screen is not the whole pool. */}
          {hasFilters && (
            <div className="shrink-0 flex items-center justify-between gap-2 -mt-1">
              <span className="text-xs text-gray-500">
                {filteredPlayers.length} z {poolPlayers.length} zawodników
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Wyczyść filtry
              </button>
            </div>
          )}

          {/* The pool is a list, not a <table>. Below md each player is a two-line
              card (name + action on top, country/club/position underneath); from
              md the same nodes lay out as columns via `md:contents` + `md:order`,
              so a phone never side-scrolls and there is still exactly one DOM
              node per player — duplicating the markup per breakpoint would
              double a list that already runs to a thousand rows. */}
          <div className="flex-1 min-h-0 flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm md:block md:flex-none">
            <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <span className="flex-1 min-w-0">Imię i Nazwisko</span>
              <span className="w-[120px] shrink-0">Liga</span>
              <span className="w-[150px] shrink-0">Klub</span>
              <span className="w-[105px] shrink-0">Pozycja</span>
              <span className="w-[190px] shrink-0" aria-hidden />
            </div>
            {/* The only scroller on the phone screen: fills the leftover height
                rather than a fixed cap, so exactly as many players fit as there
                is room for. The desktop cap stays. */}
            <ul className="flex-1 min-h-0 overflow-y-auto overscroll-contain text-sm md:max-h-[560px] md:flex-none">
              {filteredPlayers.map((p) => {
                const pick = pickByPlayer.get(p.id)
                const picked = !!pick
                const pickedBy = pick ? managersByManagerId.get(pick.manager_id) : undefined
                const isPending = pending === p.id
                const canPick = status === 'live' && !picked && (isMyTurn || !!actingForSquadId || isAdmin)
                return (
                  <li
                    key={p.id}
                    className={`flex flex-col gap-1 px-3 py-2.5 border-t border-gray-100 md:flex-row md:items-center md:gap-3 md:py-2 ${
                      picked
                        ? 'bg-gray-50 text-gray-400'
                        : isPending
                          ? 'bg-emerald-100'
                          : 'hover:bg-gray-50'
                    } ${canPick ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!canPick) return
                      setPending(isPending ? null : p.id)
                    }}
                  >
                    {/* Phone: first line. From md these two become columns 1 and 5. */}
                    <div className="flex flex-wrap items-center justify-between gap-2 md:contents">
                      <span
                        className={`min-w-0 truncate font-medium md:order-1 md:flex-1 ${picked ? 'line-through' : ''}`}
                      >
                        {`${p.name} ${p.surname}`.trim()}
                      </span>
                      {/* While confirming, the controls take a full line of their
                          own on a phone: squeezed beside the name they clipped
                          "Wybierz za <menedżer>" to an unreadable stub. */}
                      <span
                        className={`flex items-center justify-end gap-1 md:order-5 md:w-[190px] md:mt-0 md:shrink-0 ${
                          isPending ? 'w-full mt-1' : 'shrink-0'
                        }`}
                      >
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(p)
                            }}
                            title="Edytuj dane zawodnika"
                            aria-label="Edytuj dane zawodnika"
                            className="px-2 py-1 rounded border border-gray-300 text-gray-600 text-xs hover:bg-gray-50"
                          >
                            ✎
                          </button>
                        )}
                        {picked ? (
                          // Capped and truncated: this label used to set the
                          // table's min-content width and pushed it into
                          // horizontal scroll on a long manager name.
                          <span
                            className="text-xs italic truncate max-w-[120px] md:max-w-[150px]"
                            title={`Wybrany przez ${managerName(pickedBy)}`}
                          >
                            Wybrany przez {managerName(pickedBy)}
                          </span>
                        ) : isPending ? (
                          <span
                            className="flex w-full items-center gap-1 md:w-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isMyTurn && (
                              <button
                                onClick={() => onConfirmPick(p.id)}
                                disabled={submitting}
                                title="Potwierdź"
                                aria-label="Potwierdź wybór"
                                className="flex-1 md:flex-none px-4 py-2 min-h-[40px] md:min-h-[36px] md:min-w-[52px] rounded bg-[#29544D] text-white font-medium hover:bg-[#1f423c] disabled:opacity-50"
                              >
                                ✓ <span className="md:hidden">Wybierz</span>
                              </button>
                            )}
                            {/* Stand-in: the normal pick endpoint — the delegation
                                is authorised server-side in draft_make_pick. The
                                manager's name stays in the label at every width;
                                truncating it hid who the pick was actually for. */}
                            {actingForSquadId && !isMyTurn && (
                              <button
                                onClick={() => onConfirmPick(p.id)}
                                disabled={submitting}
                                className="flex-1 md:flex-none min-w-0 px-2 py-2 min-h-[40px] md:min-h-[36px] rounded bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-50"
                              >
                                <span className="block truncate">Wybierz za {actingForName}</span>
                              </button>
                            )}
                            {isAdmin && !isMyTurn && !actingForSquadId && (
                              <button
                                onClick={() => onAdminPick(p.id)}
                                disabled={submitting}
                                className="flex-1 md:flex-none min-w-0 px-2 py-2 min-h-[40px] md:min-h-[36px] rounded bg-amber-600 text-white text-xs hover:bg-amber-700 disabled:opacity-50"
                              >
                                <span className="block truncate">Wybierz za {managerName(onClockManager)}</span>
                              </button>
                            )}
                            <button
                              onClick={() => setPending(null)}
                              title="Anuluj"
                              aria-label="Anuluj"
                              className="shrink-0 px-4 py-2 min-h-[40px] md:min-h-[36px] min-w-[52px] rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                            >
                              ✕
                            </button>
                          </span>
                        ) : null}
                      </span>
                    </div>

                    {/* Phone: second line. From md these become columns 2–4. */}
                    <div className="flex items-center gap-x-2 text-xs text-gray-500 md:contents">
                      <span className="inline-flex items-center gap-1.5 md:order-2 md:w-[120px] md:shrink-0 md:text-sm">
                        <LeagueFlag league={p.football_league} height={11} />
                        {p.football_league || '—'}
                      </span>
                      <span className="md:hidden" aria-hidden>·</span>
                      <span className="truncate md:order-3 md:w-[150px] md:shrink-0 md:text-sm">{p.club || '—'}</span>
                      <span className="md:hidden" aria-hidden>·</span>
                      <span className="whitespace-nowrap md:order-4 md:w-[105px] md:shrink-0 md:text-sm">
                        {positionLabel(p.position)}
                      </span>
                    </div>
                  </li>
                )
              })}
              {filteredPlayers.length === 0 && (
                <li className="px-3 py-8 text-center text-gray-400">Brak zawodników pasujących do filtrów.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right: optional chat + roster. On a phone these are peer tabs rather
            than a continuation of the scroll below a thousand players. */}
        <div className="min-h-0 flex flex-col space-y-6 md:block">
          {sideTop && (
            <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden md:block'} flex-1 min-h-0 flex-col`}>
              {sideTop}
            </div>
          )}
          <div className={`${mobileTab === 'roster' ? 'flex' : 'hidden md:block'} flex-1 min-h-0 flex-col`}>
            <Roster
              managers={managers}
              picks={picks}
              players={players}
              onClockSquadId={onClockSquadId}
              slotCount={slotCount}
              delegations={delegations}
            />
          </div>
        </div>
      </div>

      {/* Phone-only bottom navigation between the three panels. Mirrors the
          app's own mobile tab bar, which takeover routes otherwise lose. In
          normal flow as the last flex item rather than fixed, so it sits on the
          viewport edge without the content needing to reserve a guessed height
          for it. The negative margin cancels <main>'s px-4 for a full-bleed bar. */}
      <nav
        className="md:hidden shrink-0 -mx-4 bg-white border-t border-gray-200 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Sekcje draftu"
      >
        {MOBILE_TABS.filter((t) => t.id !== 'chat' || !!sideTop).map(({ id, label, Icon }) => {
          const active = mobileTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMobileTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                active ? 'text-[#29544D]' : 'text-gray-500'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Filter sheet (phone) */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtry"
        description="Zawęź listę zawodników."
      >
        <div className="space-y-3">
          <FilterCombo label="Liga" value={fLeague} options={options.league} onChange={setFLeague} />
          <FilterCombo label="Klub" value={fClub} options={options.club} onChange={setFClub} />
          <FilterCombo
            label="Pozycja"
            value={fPosition ? positionLabel(fPosition) : ''}
            options={options.position.map(positionLabel)}
            onChange={(pl) => setFPosition(positionFromLabel(pl))}
          />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="flex-1 px-3 py-2.5 text-sm rounded-md border border-gray-300 text-gray-700 disabled:opacity-40"
            >
              Wyczyść
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="flex-1 px-3 py-2.5 text-sm rounded-md bg-[#29544D] text-white"
            >
              Pokaż {filteredPlayers.length}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add player (admin) */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !addingPlayer && setShowAdd(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Dodaj zawodnika</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
              <input
                value={addForm.fullName}
                onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                placeholder="Imię i nazwisko"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klub</label>
              <input
                value={addForm.club}
                onChange={(e) => setAddForm({ ...addForm, club: e.target.value })}
                placeholder="Klub"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Liga</label>
              <input
                value={addForm.footballLeague}
                onChange={(e) => setAddForm({ ...addForm, footballLeague: e.target.value })}
                placeholder="Liga (opcjonalnie)"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pozycja</label>
              <select
                value={addForm.position}
                onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              >
                {POSITION_OPTIONS_PL.map((pl) => (
                  <option key={pl} value={pl}>{pl}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} disabled={addingPlayer} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                Anuluj
              </button>
              <button onClick={submitAdd} disabled={addingPlayer} className="px-4 py-2 text-sm rounded-md bg-[#29544D] text-white hover:bg-[#1f423c] disabled:opacity-50">
                {addingPlayer ? 'Dodawanie…' : 'Dodaj'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit player (admin) — live detail change */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !savingEdit && setEditing(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Edytuj dane zawodnika</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
              <input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                placeholder="Imię i nazwisko"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klub</label>
              <input
                value={editForm.club}
                onChange={(e) => setEditForm({ ...editForm, club: e.target.value })}
                placeholder="Klub"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Liga</label>
              <input
                value={editForm.footballLeague}
                onChange={(e) => setEditForm({ ...editForm, footballLeague: e.target.value })}
                placeholder="Liga (opcjonalnie)"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pozycja</label>
              <select
                value={editForm.position}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              >
                {POSITION_OPTIONS_PL.map((pl) => (
                  <option key={pl} value={POSITION_EN_BY_PL[pl]}>{pl}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditing(null)} disabled={savingEdit} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                Anuluj
              </button>
              <button onClick={submitEdit} disabled={savingEdit} className="px-4 py-2 text-sm rounded-md bg-[#29544D] text-white hover:bg-[#1f423c] disabled:opacity-50">
                {savingEdit ? 'Zapisywanie…' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
