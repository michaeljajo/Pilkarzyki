'use client'

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ListChecks, MessageSquare, SlidersHorizontal, Users, type LucideIcon } from 'lucide-react'
import { LeagueFlag } from '@/components/ui/LeagueFlag'
import { FilterCombo } from '@/components/ui/FilterCombo'
import { Modal } from '@/components/ui/Modal'
import { type Delegation, delegateForSquad, resolveActingForSquadId } from '@/lib/draft-delegations'
import {
  POSITION_LABEL_PL,
  positionLabel,
  foldText,
  EMPTY_PLAYER_FILTERS,
  hasActiveFilters,
  matchesPlayerFilters,
  playerFilterOptions,
  reconcilePlayerFilters,
  type PlayerFilterKey,
  type PlayerFilters,
} from '@/lib/draft-players'

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
  delegations: Delegation[]
}) {
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

  const managersByManagerId = useMemo(() => {
    const map = new Map<string, BoardManager>()
    managers.forEach((m) => map.set(m.managerId, m))
    return map
  }, [managers])

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
    /* Phone: fills whatever height its tab panel hands it, so only the list of
       squads scrolls. Fixed cap from md, where it is a sidebar again. */
    <div className="rounded-xl border border-gray-200 p-4 flex flex-col flex-1 min-h-0 md:block md:flex-none">
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
  /** Active stand-ins for this draft; drives the "acting for" mode. */
  delegations?: Delegation[]
  /** Viewer's internal user id and squad — needed to tell whether the squad on
   *  the clock is one they are standing in for. */
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
  /** Extra controls for the action bar beside the round summary, so the screen
   *  has one row of buttons instead of a staircase of right-aligned ones. */
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
  const [filters, setFilters] = useState<PlayerFilters>(EMPTY_PLAYER_FILTERS)
  const [pending, setPending] = useState<string | null>(null)

  // Phone only: pool, chat and rosters are peers reached from a bottom bar
  // instead of being stacked into one very long scroll behind a thousand
  // players. Ignored from md up, where they all fit on screen at once.
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

  const pickByPlayer = useMemo(() => {
    const map = new Map<string, BoardPick>()
    picks.forEach((p) => map.set(p.player_id, p))
    return map
  }, [picks])

  const poolPlayers = useMemo(
    () => (poolIds ? players.filter((p) => poolIds.has(p.id)) : players),
    [players, poolIds]
  )

  // The dropdowns narrow each other, so they read from the search-matched pool
  // rather than the raw one — "Anglia" then only lists English clubs.
  const searchedPlayers = useMemo(() => {
    const q = foldText(search)
    if (!q) return poolPlayers
    return poolPlayers.filter((p) => foldText(`${p.name} ${p.surname}`).includes(q))
  }, [poolPlayers, search])

  // Memoised: the pool runs to thousands of rows and the board re-renders on
  // every realtime pick.
  const options = useMemo(
    () => ({
      league: playerFilterOptions(searchedPlayers, filters, 'league'),
      club: playerFilterOptions(searchedPlayers, filters, 'club'),
      position: playerFilterOptions(searchedPlayers, filters, 'position'),
    }),
    [searchedPlayers, filters]
  )

  const setFilter = (key: PlayerFilterKey, value: string) =>
    setFilters((prev) => reconcilePlayerFilters(searchedPlayers, { ...prev, [key]: value }, key))

  const filteredPlayers = useMemo(
    () => searchedPlayers.filter((p) => matchesPlayerFilters(p, filters)),
    [searchedPlayers, filters]
  )

  const filtersActive = Boolean(search) || hasActiveFilters(filters)
  // Badge on the phone's Filtry button — the dropdowns themselves are behind a
  // sheet there, so this is the only sign that any are set.
  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const clearFilters = () => {
    setSearch('')
    setFilters(EMPTY_PLAYER_FILTERS)
  }

  const managersBySquad = useMemo(() => {
    const map = new Map<string, BoardManager>()
    managers.forEach((m) => map.set(m.squadId, m))
    return map
  }, [managers])

  const playersById = useMemo(() => {
    const map = new Map<string, BoardPlayer>()
    players.forEach((p) => map.set(p.id, p))
    return map
  }, [players])

  const onClockManager = managersByManagerId.get(onClockManagerId || '')
  const nextManager = nextSquadId ? managersBySquad.get(nextSquadId) : undefined

  // The most recent pick, for the "who just took whom" line.
  const lastPick = useMemo(
    () => picks.reduce<BoardPick | null>((best, p) => (!best || p.pick_number > best.pick_number ? p : best), null),
    [picks]
  )
  const lastPickPlayer = lastPick ? playersById.get(lastPick.player_id) : undefined
  const lastPickManager = lastPick ? managersBySquad.get(lastPick.squad_id) : undefined

  // Whose turn it is decides this, never the viewer: a stand-in can only pick
  // while the squad they cover is actually on the clock, and their own turn
  // stays an ordinary pick. Authorisation itself lives in draft_make_pick.
  const actingForSquadId =
    status === 'live'
      ? resolveActingForSquadId({ delegations, onClockSquadId, myUserId, mySquadId })
      : null
  const actingForName = actingForSquadId
    ? managerName(managers.find((m) => m.squadId === actingForSquadId))
    : ''

  const onClockDelegateId = delegateForSquad(delegations, onClockSquadId)
  const onClockDelegate = onClockDelegateId ? managersByManagerId.get(onClockDelegateId) : undefined

  return (
    /* Phone: the screen is exactly one viewport tall and never scrolls as a
       whole — only the player list and the chat log scroll, inside themselves.
       The height budget is dvh (so Safari's collapsing URL bar is handled) minus
       the 4rem takeover header and the 1rem top padding of <main>; the tab bar is
       the last flex item, so it lands on the viewport edge without any magic
       numbers. From md this reverts to ordinary page flow. */
    <div className="flex flex-col h-[calc(100dvh-5rem)] overflow-hidden space-y-4 md:h-auto md:block md:overflow-visible md:space-y-6">
      {status === 'live' && myTurn && (
        <div className="shrink-0 rounded-xl bg-[#29544D] text-white px-6 py-2.5 text-center text-lg font-bold shadow-lg animate-pulse md:py-4 md:text-xl">
          TWOJA KOLEJ!
        </div>
      )}

      {actingForSquadId && (
        <div className="shrink-0 rounded-xl bg-amber-500 text-white px-6 py-2.5 text-center text-base font-bold shadow-lg md:text-lg">
          WYBIERASZ ZA: {actingForName.toUpperCase()}
          <span className="block text-sm font-normal opacity-90">
            Zastępstwo — zawodnik trafi do składu tego menedżera.
          </span>
        </div>
      )}

      <div className="shrink-0 flex flex-wrap items-start justify-between gap-3">
        {status === 'live' ? (
          /* Chronological: what just happened, what is happening, what is next.
             The middle line stays the loud one — it is the only one anybody has
             to act on. Each line is ordinary inline text rather than flex
             children, so it wraps as a sentence instead of breaking into a
             column of fragments on a narrow screen. */
          <div className="min-w-0 space-y-0.5">
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
                <span className="ml-2 text-amber-700">(zastępstwo: {managerName(onClockDelegate)})</span>
              )}
            </p>

            {/* Phone: previous and next collapse into one truncated line —
                three wrapping sentences ate half the screen above the pool. */}
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
        {/* One action bar for the whole screen, so extra controls (e.g. the
            admin's "Zarządzaj zastępstwami") sit in a row rather than each
            taking a right-aligned line of its own. */}
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

      {/* Two columns only from xl. At lg the pool column resolved to ~696px,
          which the name column had to share with 565px of fixed metadata columns
          — it got the ~80px left over and every player read as "Fr…". Below xl
          the pool takes the full width and chat/rosters stack underneath it. */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: player pool. On a phone it is a flex column that hands all the
            leftover height to the list, so the list scrolls and the page does
            not. */}
        <div
          className={`${
            mobileTab === 'pool' ? 'flex' : 'hidden md:block'
          } flex-col min-h-0 space-y-4 md:block xl:col-span-2`}
        >
          {isAdmin && status === 'live' && (
            <div className="shrink-0 flex flex-wrap gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              {/* The label is a heading for a two-button row; on a phone it only
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
              {/* Instructional, not actionable — costs two lines on a phone above
                  the thing it describes, so it waits for the room. */}
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
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj zawodnika"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md col-span-2 lg:col-span-1"
            />
            <FilterCombo
              label="Liga"
              value={filters.league}
              options={options.league}
              onChange={(v) => setFilter('league', v)}
            />
            <FilterCombo
              label="Klub"
              value={filters.club}
              options={options.club}
              onChange={(v) => setFilter('club', v)}
            />
            <FilterCombo
              label="Pozycja"
              value={filters.position ? positionLabel(filters.position) : ''}
              options={options.position.map(positionLabel)}
              onChange={(pl) => {
                const en = Object.keys(POSITION_LABEL_PL).find((k) => POSITION_LABEL_PL[k] === pl) || ''
                setFilter('position', en)
              }}
            />
          </div>

          {filtersActive && (
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 -mt-2">
              <span className="text-xs text-gray-500">
                Zawodnicy: {filteredPlayers.length} z {poolPlayers.length}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Wyczyść filtry
              </button>
            </div>
          )}

          {/* The pool is a list, not a <table>. Below md each player is a
              two-line card (name + action on top, league/club/position
              underneath); from md the same nodes lay out as columns via
              `md:contents` + `md:order`, so a phone never side-scrolls and there
              is still exactly one DOM node per player — duplicating the markup
              per breakpoint would double a list that runs to thousands of rows. */}
          <div className="flex-1 min-h-0 flex flex-col border border-gray-200 rounded-lg overflow-hidden md:block md:flex-none">
            <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <span className="flex-1 min-w-[150px]">Imię i Nazwisko</span>
              <span className="w-[104px] shrink-0">Liga</span>
              <span className="w-[140px] shrink-0">Klub</span>
              <span className="w-[92px] shrink-0">Pozycja</span>
              <span className="w-[150px] shrink-0" aria-hidden />
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
                const canPick = status === 'live' && !picked && (myTurn || !!actingForSquadId || isAdmin)
                return (
                  <li
                    key={p.id}
                    className={`flex flex-col gap-1 px-3 py-2.5 border-t border-gray-100 md:flex-row md:items-center md:gap-3 md:py-2 ${
                      picked ? 'bg-gray-50 text-gray-400' : isPending ? 'bg-[#29544D]/5' : 'hover:bg-gray-50'
                    } ${canPick ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!canPick) return
                      setPending(isPending ? null : p.id)
                    }}
                  >
                    {/* Phone: first line. From md these two become columns 1 and 5. */}
                    <div className="flex flex-wrap items-center justify-between gap-2 md:contents">
                      <span className={`min-w-0 truncate font-medium md:order-1 md:flex-1 md:min-w-[150px] ${picked ? 'line-through' : ''}`}>
                        {`${p.name} ${p.surname}`.trim()}
                      </span>
                      {/* While confirming, the controls take a full line of their
                          own on a phone: squeezed beside the name they clipped
                          "Wybierz za <menedżer>" to an unreadable stub. */}
                      <span
                        className={`flex items-center justify-end gap-1 md:order-5 md:w-[150px] md:mt-0 md:shrink-0 ${
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
                            className="shrink-0 px-2 py-1 rounded border border-gray-300 text-gray-600 text-xs hover:bg-gray-50"
                          >
                            ✎
                          </button>
                        )}
                        {picked ? (
                          // Capped and truncated: this label used to set the
                          // table's min-content width and pushed the board into
                          // horizontal scroll on a long manager name.
                          <span
                            className="text-xs italic truncate max-w-[120px] md:max-w-[150px]"
                            title={`Wybrany przez ${managerName(pickedBy)}`}
                          >
                            Wybrany przez {managerName(pickedBy)}
                          </span>
                        ) : isPending ? (
                          <span className="flex w-full items-center gap-1 md:w-auto" onClick={(e) => e.stopPropagation()}>
                            {myTurn && (
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
                            {/* Stand-in: the ordinary pick endpoint — the
                                delegation is authorised server-side in
                                draft_make_pick. The manager's name stays in the
                                label at every width; truncating it hid who the
                                pick was actually for. */}
                            {actingForSquadId && !myTurn && (
                              <button
                                onClick={() => onConfirmPick(p.id)}
                                disabled={submitting}
                                className="flex-1 md:flex-none min-w-0 px-2 py-2 min-h-[40px] md:min-h-[36px] rounded bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-50"
                              >
                                <span className="block truncate">Wybierz za {actingForName}</span>
                              </button>
                            )}
                            {isAdmin && !myTurn && !actingForSquadId && (
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
                      <span className="inline-flex items-center gap-1.5 md:order-2 md:w-[104px] md:shrink-0 md:text-sm">
                        <LeagueFlag league={p.football_league} height={11} />
                        {p.football_league || '—'}
                      </span>
                      <span className="md:hidden" aria-hidden>·</span>
                      <span className="truncate md:order-3 md:w-[140px] md:shrink-0 md:text-sm">{p.club || '—'}</span>
                      <span className="md:hidden" aria-hidden>·</span>
                      <span className="whitespace-nowrap md:order-4 md:w-[92px] md:shrink-0 md:text-sm">
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

        {/* Right: chat + rosters. On a phone these are peer tabs rather than a
            continuation of the scroll below thousands of players. */}
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
              delegations={delegations || []}
            />
          </div>
        </div>
      </div>

      {/* Phone-only bottom navigation between the three panels. Mirrors the app's
          own mobile tab bar, which this takeover route otherwise loses. In normal
          flow as the last flex item rather than fixed, so it sits on the viewport
          edge without the content reserving a guessed height for it. The negative
          margin cancels <main>'s px-4 for a full-bleed bar. */}
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
        {/* Tall on purpose. Each dropdown opens as an absolutely-positioned list
            inside this panel, so a panel sized to its three collapsed inputs
            clipped the options to about one visible row. The floor gives the
            open list its full height; the actions sit at the bottom rather than
            floating directly under the inputs. */}
        <div className="flex flex-col min-h-[60vh] md:min-h-0 space-y-3">
          <FilterCombo
            label="Liga"
            value={filters.league}
            options={options.league}
            onChange={(v) => setFilter('league', v)}
          />
          <FilterCombo
            label="Klub"
            value={filters.club}
            options={options.club}
            onChange={(v) => setFilter('club', v)}
          />
          <FilterCombo
            label="Pozycja"
            value={filters.position ? positionLabel(filters.position) : ''}
            options={options.position.map(positionLabel)}
            onChange={(pl) => {
              const en = Object.keys(POSITION_LABEL_PL).find((k) => POSITION_LABEL_PL[k] === pl) || ''
              setFilter('position', en)
            }}
          />
          <div className="flex gap-2 pt-1 mt-auto">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
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
