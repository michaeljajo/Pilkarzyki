'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { ShieldCheck, ShieldPlus, Trash2, Search, Users } from 'lucide-react'

interface LeagueAdmin {
  id: string
  clerkId: string | null
  databaseId: string
  displayName: string
  isSelf: boolean
  createdAt: string | null
}

interface PickableUser {
  id: string
  displayName: string
}

interface LeagueAdminsCardProps {
  leagueId: string
}

/**
 * Per-league administrator management.
 *
 * There is no global admin in this app — rights are granted league by league.
 * Any admin of this league can promote another registered user here, and can
 * revoke rights from anyone except the last remaining admin (the API enforces
 * that too, so a stale client can't lock a league out of its own admin area).
 */
export function LeagueAdminsCard({ leagueId }: LeagueAdminsCardProps) {
  const [admins, setAdmins] = useState<LeagueAdmin[]>([])
  const [maxAdmins, setMaxAdmins] = useState<number | null>(null)
  const [users, setUsers] = useState<PickableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [pendingRemoval, setPendingRemoval] = useState<LeagueAdmin | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [adminsRes, usersRes] = await Promise.all([
        fetch(`/api/leagues/${leagueId}/admins`),
        fetch('/api/users'),
      ])
      const [adminsData, usersData] = await Promise.all([adminsRes.json(), usersRes.json()])

      if (!adminsRes.ok) {
        throw new Error(adminsData.error || 'Nie udało się wczytać administratorów')
      }

      setAdmins(adminsData.admins || [])
      setMaxAdmins(adminsData.maxAdmins ?? null)
      setUsers(usersRes.ok ? usersData.users || [] : [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się wczytać administratorów')
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  useEffect(() => {
    if (leagueId) load()
  }, [leagueId, load])

  // /api/users identifies people by Clerk ID, and so does the admins list
  // (`id` is the Clerk ID with the database id as fallback), so the two lists
  // can be compared directly.
  const adminIds = useMemo(() => new Set(admins.map((a) => a.id)), [admins])

  const candidates = useMemo(() => {
    const term = query.trim().toLowerCase()
    return users
      .filter((u) => !adminIds.has(u.id))
      .filter((u) => (term ? u.displayName.toLowerCase().includes(term) : true))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'pl'))
  }, [users, adminIds, query])

  const atCapacity = maxAdmins !== null && admins.length >= maxAdmins

  async function grantAdmin() {
    if (!selectedUserId) return
    try {
      setSaving(true)
      const response = await fetch(`/api/leagues/${leagueId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Nie udało się nadać uprawnień')
      }
      closeAdd()
      await load()
      toast.success('Uprawnienia administratora nadane')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się nadać uprawnień')
    } finally {
      setSaving(false)
    }
  }

  async function revokeAdmin(admin: LeagueAdmin) {
    try {
      setSaving(true)
      const response = await fetch(`/api/leagues/${leagueId}/admins`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: admin.id }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Nie udało się odebrać uprawnień')
      }
      setPendingRemoval(null)
      toast.success(`Uprawnienia odebrane: ${admin.displayName}`)
      // Stepping down closes this whole section, so send the user back to the
      // league rather than leaving them on a page they can no longer load.
      if (admin.isSelf) {
        window.location.href = `/leagues/${leagueId}/squad`
        return
      }
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się odebrać uprawnień')
      setPendingRemoval(null)
    } finally {
      setSaving(false)
    }
  }

  function closeAdd() {
    setShowAdd(false)
    setSelectedUserId('')
    setQuery('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-[#29544D]" />
          Administratorzy Ligi
          {!loading && (
            <span className="text-sm font-normal text-gray-500">
              ({admins.length}
              {maxAdmins !== null ? `/${maxAdmins}` : ''})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Uprawnienia dotyczą wyłącznie tej ligi. Administrator może wpisywać wyniki, zarządzać
          składami, terminarzem, pucharem i ustawieniami tego sezonu — i nie ma żadnych uprawnień
          w pozostałych ligach.
        </p>

        {loading ? (
          <div className="space-y-2">
            <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        ) : admins.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title="Brak administratorów"
            description="Ta liga nie ma jeszcze przypisanych administratorów"
          />
        ) : (
          <ul className="space-y-2">
            {admins.map((admin) => (
              <li
                key={admin.databaseId}
                className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar fallback={admin.displayName} size="md" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {admin.displayName}
                      {admin.isSelf && (
                        <span className="ml-2 text-xs font-medium text-[#29544D]">(Ty)</span>
                      )}
                    </div>
                    {admin.createdAt && (
                      <div className="text-xs text-gray-500">
                        Od {new Date(admin.createdAt).toLocaleDateString('pl-PL')}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 shrink-0"
                  icon={<Trash2 size={16} />}
                  disabled={saving || admins.length <= 1}
                  title={
                    admins.length <= 1
                      ? 'Liga musi mieć co najmniej jednego administratora'
                      : undefined
                  }
                  onClick={() => setPendingRemoval(admin)}
                >
                  Odbierz
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Button
            icon={<ShieldPlus size={16} />}
            onClick={() => setShowAdd(true)}
            disabled={loading || atCapacity}
          >
            Dodaj administratora
          </Button>
          {atCapacity && (
            <p className="mt-2 text-xs text-gray-500">
              Osiągnięto maksymalną liczbę administratorów ({maxAdmins}). Odbierz komuś uprawnienia,
              aby dodać kolejną osobę.
            </p>
          )}
        </div>
      </CardContent>

      <Modal
        isOpen={showAdd}
        onClose={closeAdd}
        title="Nadaj uprawnienia administratora"
        description="Wybierz użytkownika, który ma administrować tą ligą"
        icon={<ShieldPlus size={24} />}
        footer={
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={closeAdd}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={grantAdmin}
              loading={saving}
              disabled={!selectedUserId}
              icon={<ShieldPlus size={18} />}
              className="w-full sm:w-auto"
            >
              Nadaj uprawnienia
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Szukaj użytkownika"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wpisz nazwę użytkownika"
            leftIcon={<Search size={18} />}
            fullWidth
          />

          {candidates.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              {query.trim()
                ? 'Brak użytkowników pasujących do wyszukiwania.'
                : 'Wszyscy zarejestrowani użytkownicy są już administratorami tej ligi.'}
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
              {candidates.map((user) => {
                const selected = selectedUserId === user.id
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      aria-pressed={selected}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        selected ? 'bg-[#29544D]/10' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Avatar fallback={user.displayName} size="sm" />
                      <span className="flex-1 min-w-0 truncate text-sm font-medium text-gray-900">
                        {user.displayName}
                      </span>
                      {selected && <ShieldCheck size={18} className="text-[#29544D] shrink-0" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        onConfirm={() => pendingRemoval && revokeAdmin(pendingRemoval)}
        title="Odbierz uprawnienia administratora"
        message={
          pendingRemoval?.isSelf
            ? 'Odbierasz uprawnienia samemu sobie. Stracisz natychmiast dostęp do trybu administratora tej ligi i tylko inny administrator będzie mógł Ci je przywrócić. Kontynuować?'
            : `Czy na pewno odebrać uprawnienia administratora użytkownikowi ${pendingRemoval?.displayName}? Straci dostęp do trybu administratora tej ligi.`
        }
        confirmText="Odbierz uprawnienia"
        cancelText="Anuluj"
        loading={saving}
        variant="danger"
      />
    </Card>
  )
}
