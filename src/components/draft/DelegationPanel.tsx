'use client'

import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { BoardManager, managerName } from '@/components/draft/DraftLiveBoard'
import { Delegation, delegateForSquad } from '@/lib/draft-delegations'

// Nominating a stand-in for the draft. Two audiences, one component:
//   * every manager gets a card for his own squad;
//   * admins additionally get a modal covering all managers, because in
//     practice people phone the commissioner instead of clicking.
//
// Nominating is a *before the draft* activity, so once picking is under way the
// panel collapses to `variant="adminOnly"`: a single button that opens the same
// modal, shown to the admin alone. Managers have nothing left to decide there.
//
// Shared by the pre-season and mid-season drafts.

function Select({
  value,
  options,
  placeholder,
  disabled,
  className = 'w-56 max-w-full',
  onChange,
}: {
  value: string
  options: BoardManager[]
  placeholder: string
  disabled?: boolean
  /** Width is set by the caller — a bare select sizes itself to its selected
   *  option, which made rows without a delegate render narrower than the rest. */
  className?: string
  onChange: (managerId: string) => void
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`${className} shrink-0 px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md disabled:opacity-50`}
    >
      <option value="">{placeholder}</option>
      {options.map((m) => (
        <option key={m.managerId} value={m.managerId}>
          {managerName(m)}
        </option>
      ))}
    </select>
  )
}

export function DelegationPanel({
  managers,
  delegations,
  mySquadId,
  myUserId,
  isAdmin,
  disabled,
  variant = 'full',
  onSetDelegate,
}: {
  managers: BoardManager[]
  delegations: Delegation[]
  mySquadId: string | null
  myUserId: string | null
  isAdmin: boolean
  /** Draft finished / league archived — show state, block changes. */
  disabled?: boolean
  /** 'adminOnly' collapses the card to the admin's "manage all" button (draft
   *  already under way); renders nothing at all for non-admins. */
  variant?: 'full' | 'adminOnly'
  onSetDelegate: (squadId: string, delegateUserId: string | null) => Promise<boolean>
}) {
  const [pending, setPending] = useState('')
  const [busy, setBusy] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const managersByManagerId = useMemo(() => {
    const map = new Map<string, BoardManager>()
    managers.forEach((m) => map.set(m.managerId, m))
    return map
  }, [managers])

  const myDelegateId = delegateForSquad(delegations, mySquadId)
  const myDelegate = myDelegateId ? managersByManagerId.get(myDelegateId) : undefined

  // Never offer someone their own squad as a stand-in.
  const candidatesFor = (squadId: string) => managers.filter((m) => m.squadId !== squadId)

  const submit = async (squadId: string, delegateUserId: string | null) => {
    setBusy(true)
    const ok = await onSetDelegate(squadId, delegateUserId)
    setBusy(false)
    if (ok) setPending('')
  }

  // Managers I am standing in for — worth stating plainly, since it changes
  // what happens on someone else's turn.
  const iCoverFor = managers.filter(
    (m) => myUserId && delegateForSquad(delegations, m.squadId) === myUserId
  )

  const adminModal = (
    <Modal
      isOpen={adminOpen}
      onClose={() => setAdminOpen(false)}
      title="Zastępstwa"
      description="Wyznacz lub odwołaj zastępcę dla dowolnego menedżera."
      size="lg"
    >
      <div className="space-y-2">
        {managers.map((m) => {
          const delegateId = delegateForSquad(delegations, m.squadId) || ''
          return (
            <div
              key={m.squadId}
              className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_14rem_4rem] items-center gap-2 border-b border-gray-100 pb-2"
            >
              <span className="text-sm font-medium text-gray-900 truncate">{managerName(m)}</span>
              <Select
                value={delegateId}
                options={candidatesFor(m.squadId)}
                placeholder="Brak zastępcy"
                disabled={busy || disabled}
                className="w-full"
                onChange={(managerId) => submit(m.squadId, managerId || null)}
              />
              {delegateId ? (
                <button
                  type="button"
                  disabled={busy || disabled}
                  onClick={() => submit(m.squadId, null)}
                  className="text-sm px-2 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Usuń
                </button>
              ) : (
                <span aria-hidden />
              )}
            </div>
          )
        })}
      </div>
    </Modal>
  )

  // Draft under way: nominating is over, so only the admin keeps a way in — the
  // one case that still comes up is a manager dropping off mid-draft. Rendered
  // bare (no wrapper) so the caller can sit it in a shared action bar rather
  // than giving it a right-aligned row of its own.
  if (variant === 'adminOnly') {
    if (!isAdmin) return null
    return (
      <>
        <button
          type="button"
          onClick={() => setAdminOpen(true)}
          className="text-sm whitespace-nowrap px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Zarządzaj zastępstwami
        </button>
        {adminModal}
      </>
    )
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Zastępstwa</h2>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setAdminOpen(true)}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Zarządzaj wszystkimi
          </button>
        )}
      </div>

      {mySquadId ? (
        myDelegate ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-sm text-amber-900">
              Twoje wybory wykona: <span className="font-semibold">{managerName(myDelegate)}</span>
            </p>
            <button
              type="button"
              disabled={busy || disabled}
              onClick={() => submit(mySquadId, null)}
              className="text-sm px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Przejmij z powrotem
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Nie możesz być na drafcie? Wyznacz zastępcę — będzie wybierał za Ciebie w Twojej
              kolejce. W każdej chwili możesz to cofnąć.
            </p>
            <div className="flex flex-wrap gap-2">
              <Select
                value={pending}
                options={candidatesFor(mySquadId)}
                placeholder="Wybierz zastępcę…"
                disabled={busy || disabled}
                onChange={setPending}
              />
              <button
                type="button"
                disabled={!pending || busy || disabled}
                onClick={() => submit(mySquadId, pending)}
                className="text-sm px-3 py-2 rounded-md bg-[#29544D] text-white hover:bg-[#1f423c] disabled:opacity-50"
              >
                Wyznacz zastępcę
              </button>
            </div>
          </div>
        )
      ) : (
        <p className="text-sm text-gray-500">Nie masz drużyny w tej lidze.</p>
      )}

      {iCoverFor.length > 0 && (
        <p className="text-sm text-gray-600">
          Wybierasz również za:{' '}
          <span className="font-medium text-gray-900">
            {iCoverFor.map(managerName).join(', ')}
          </span>
        </p>
      )}

      {adminModal}
    </div>
  )
}
