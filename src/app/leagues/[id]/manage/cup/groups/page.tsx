'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { generateGroupNames, resolveGroupSizes } from '@/utils/cup-scheduling'
import type { CupFormat } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users, Save, RotateCcw, AlertCircle, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

interface Manager {
  id: string
  firstName?: string
  lastName?: string
  displayName?: string
  email?: string
}

interface GroupAssignment {
  [groupName: string]: Manager[]
}

// Helper function to display manager name. Never shows the full email address
// (GDPR) — prefers the handle, then the name, then the email local-part.
function getManagerDisplayName(manager: Manager): string {
  if (manager.displayName) return manager.displayName
  const full = `${manager.firstName ?? ''} ${manager.lastName ?? ''}`.trim()
  if (full) return full
  if (manager.email) return manager.email.split('@')[0]
  return 'Menedżer'
}

export default function CupGroupsPage() {
  const params = useParams()
  const router = useRouter()
  const [cup, setCup] = useState<{ id: string; name: string; league_id: string; format?: CupFormat } | null>(null)
  const [allManagers, setAllManagers] = useState<Manager[]>([])
  const [groups, setGroups] = useState<GroupAssignment>({})
  /**
   * How many managers belong in each group, in group order (A, B, C…).
   *
   * Derived from the cup's saved format, never from the manager count. This
   * page used to compute `managerCount / 4` and reject anything that was not
   * 4/8/16/32 — a rule migration 027 replaced with the configurable format,
   * but which survived here and blocked an 18-manager cup that the format
   * (two_groups_of_nine) handles perfectly well.
   *
   * Sizes are per group rather than a single number because a format can be
   * uneven: 18 into 4 groups is [5, 5, 4, 4].
   */
  const [groupSizes, setGroupSizes] = useState<number[]>([])
  const [unassignedManagers, setUnassignedManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [draggedManager, setDraggedManager] = useState<Manager | null>(null)

  /** Expected size per group name, e.g. { A: 9, B: 9 }. */
  const expectedByGroup = useMemo(() => {
    const names = generateGroupNames(groupSizes.length)
    return Object.fromEntries(names.map((name, i) => [name, groupSizes[i]])) as Record<string, number>
  }, [groupSizes])

  /** Every group the same size? Only then can the UI state one number. */
  const uniformGroupSize = useMemo(
    () => (groupSizes.length > 0 && groupSizes.every(s => s === groupSizes[0]) ? groupSizes[0] : null),
    [groupSizes]
  )

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch cup
      const cupResponse = await fetch(`/api/cups?leagueId=${params.id}`)
      const cupData = await cupResponse.json()

      if (!cupResponse.ok || !cupData.cup) {
        setError('Cup not found. Please create a cup first.')
        router.push(`/leagues/${params.id}/manage/cup`)
        return
      }

      setCup(cupData.cup)

      // Fetch all managers for this league
      const managersResponse = await fetch(`/api/leagues/${params.id}/managers`)
      const managersData = await managersResponse.json()

      if (!managersResponse.ok) {
        throw new Error('Failed to fetch managers')
      }

      const managers: Manager[] = managersData.managers || []
      setAllManagers(managers)

      // Group shape comes from the cup's saved format. Any manager count the
      // format can seat is valid — there is no longer a 4/8/16/32 rule.
      const format = cupData.cup.format as CupFormat | undefined
      if (!format?.groups?.count) {
        setError('Ten puchar nie ma zapisanego formatu grup. Ustaw format w konfiguracji pucharu.')
        return
      }

      const sizes = resolveGroupSizes(managers.length, format)
      const seats = sizes.reduce((a, b) => a + b, 0)
      if (seats !== managers.length) {
        setError(
          `Format przewiduje ${seats} miejsc w grupach, a liga ma ${managers.length} menedżerów. ` +
            'Popraw format pucharu.'
        )
        return
      }

      setGroupSizes(sizes)
      const groupCount = sizes.length

      // Fetch existing group assignments
      const groupsResponse = await fetch(`/api/cups/${cupData.cup.id}/groups`)
      const groupsData = await groupsResponse.json()

      if (groupsResponse.ok && groupsData.groups && Object.keys(groupsData.groups).length > 0) {

        // Transform API data to match component format
        interface GroupManagerData {
          managerId: string
          manager: {
            first_name: string | null
            last_name: string | null
          }
        }

        const transformedGroups: GroupAssignment = {}
        Object.entries(groupsData.groups).forEach(([groupName, groupManagers]) => {
          transformedGroups[groupName] = (groupManagers as GroupManagerData[]).map((m: GroupManagerData) => ({
            id: m.managerId,
            firstName: m.manager.first_name || undefined,
            lastName: m.manager.last_name || undefined,
          }))
        })

        setGroups(transformedGroups)

        // Calculate unassigned managers
        const assignedIds = new Set<string>()
        Object.values(transformedGroups).forEach((groupManagers: Manager[]) => {
          groupManagers.forEach((m: Manager) => assignedIds.add(m.id))
        })
        setUnassignedManagers(managers.filter(m => !assignedIds.has(m.id)))
      } else {
        // Initialize empty groups
        const initialGroups: GroupAssignment = {}
        const groupNames = generateGroupNames(groupCount)
        groupNames.forEach(name => {
          initialGroups[name] = []
        })
        setGroups(initialGroups)
        setUnassignedManagers(managers)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (params.id) {
      fetchData()
    }
  }, [params.id, fetchData])

  function handleDragStart(e: React.DragEvent, manager: Manager, sourceGroup: string | null) {
    setDraggedManager(manager)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ manager, sourceGroup }))
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent, targetGroup: string | null) {
    e.preventDefault()

    if (!draggedManager) return

    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    const { manager, sourceGroup } = data

    // Remove from source
    if (sourceGroup === null) {
      // From unassigned
      setUnassignedManagers(prev => prev.filter(m => m.id !== manager.id))
    } else {
      // From another group
      setGroups(prev => ({
        ...prev,
        [sourceGroup]: prev[sourceGroup].filter(m => m.id !== manager.id)
      }))
    }

    // Add to target
    if (targetGroup === null) {
      // To unassigned
      setUnassignedManagers(prev => [...prev, manager])
    } else {
      // To a group
      setGroups(prev => ({
        ...prev,
        [targetGroup]: [...(prev[targetGroup] || []), manager]
      }))
    }

    setDraggedManager(null)
  }

  async function saveGroupAssignments() {
    try {
      setSaving(true)

      // Check if cup exists
      if (!cup) {
        setError('Cup not found')
        return
      }

      // Validate all managers are assigned
      if (unassignedManagers.length > 0) {
        setError('All managers must be assigned to a group')
        return
      }

      // Each group must match the size its format implies. Sizes can differ
      // between groups, so compare per group rather than against one number.
      const invalidGroups = Object.entries(groups).filter(
        ([name, managers]) => managers.length !== expectedByGroup[name]
      )

      if (invalidGroups.length > 0) {
        const detail = invalidGroups
          .map(([name, managers]) => `${name}: ${managers.length}/${expectedByGroup[name] ?? '?'}`)
          .join(', ')
        setError(`Nieprawidłowa liczba menedżerów w grupach — ${detail}`)
        return
      }

      // Prepare data for API
      const groupsPayload = Object.entries(groups).map(([groupName, managers]) => ({
        groupName,
        managerIds: managers.map(m => m.id)
      }))

      const response = await fetch(`/api/cups/${cup.id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: groupsPayload })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save group assignments')
      }

      setSuccess('Group assignments saved successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save group assignments')
    } finally {
      setSaving(false)
    }
  }

  function autoAssignGroups() {
    // Shuffle managers
    const shuffled = [...allManagers].sort(() => Math.random() - 0.5)

    // Walk the shuffled list, taking each group its own share. A running
    // offset is what allows uneven formats such as [5, 5, 4, 4].
    const newGroups: GroupAssignment = {}
    const groupNames = Object.keys(groups)
    let offset = 0

    groupNames.forEach((groupName, groupIndex) => {
      const size = groupSizes[groupIndex] ?? 0
      newGroups[groupName] = shuffled.slice(offset, offset + size)
      offset += size
    })

    setGroups(newGroups)
    setUnassignedManagers([])
    setSuccess('Managers randomly assigned to groups!')
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-[var(--background-secondary)] rounded-xl w-1/3"></div>
        <div className="h-64 bg-[var(--background-secondary)] rounded-xl"></div>
      </div>
    )
  }

  if (!cup) {
    return (
      <div className="text-center py-12">
        <Alert variant="error">Cup not found</Alert>
      </div>
    )
  }

  // Check if there are no managers in the league
  if (allManagers.length === 0) {
    return (
      <div className="space-y-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <h1 className="text-5xl font-bold text-[var(--foreground)]">
            Przypisanie do Grup
          </h1>
          <p className="text-xl text-[var(--foreground-secondary)]">
            Przeciągnij i upuść menedżerów do grup
          </p>
        </motion.div>

        <Card className="hover-lift">
          <CardContent className="text-center py-20">
            <EmptyState
              icon={<Users size={56} />}
              title="Brak menedżerów w tej lidze"
              description="Musisz dodać menedżerów do ligi, zanim będziesz mógł przypisać ich do grup pucharowych. Wróć do strony szczegółów ligi i najpierw dodaj menedżerów."
              action={{
                label: 'Przejdź do Szczegółów Ligi',
                onClick: () => router.push(`/leagues/${params.id}/manage`),
                icon: <Users size={18} />
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  const groupNames = Object.keys(groups).sort()

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-start"
      >
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push(`/leagues/${params.id}/manage/cup`)}
            variant="ghost"
            icon={<ArrowLeft size={18} />}
            className="mb-2 -ml-2"
          >
            Powrót do Przeglądu Pucharu
          </Button>
          <h1 className="text-5xl font-bold text-[var(--foreground)]">
            Przypisanie do Grup
          </h1>
          <p className="text-xl text-[var(--foreground-secondary)]">
            Przeciągnij i upuść menedżerów do grup{uniformGroupSize ? ` po ${uniformGroupSize}` : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={autoAssignGroups}
            variant="secondary"
            icon={<RotateCcw size={18} />}
            disabled={saving}
          >
            Przypisz Automatycznie
          </Button>
          <Button
            onClick={saveGroupAssignments}
            loading={saving}
            icon={<Save size={18} />}
            disabled={unassignedManagers.length > 0}
          >
            Zapisz Przypisania
          </Button>
        </div>
      </motion.div>

      {/* Messages */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Unassigned Managers Pool */}
      {unassignedManagers.length > 0 && (
        <Card className="border-[var(--warning)]/40">
          <CardHeader className="bg-[var(--warning)]/5">
            <CardTitle className="flex items-center gap-3 text-[var(--warning)]">
              <AlertCircle size={28} />
              Nieprzypisani Menedżerowie ({unassignedManagers.length})
            </CardTitle>
          </CardHeader>
          <CardContent
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
            className="min-h-[100px]"
          >
            <div className="flex flex-wrap gap-3">
              {unassignedManagers.map(manager => (
                <div
                  key={manager.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, manager, null)}
                  className="px-4 py-2 bg-[var(--background-tertiary)] rounded-lg cursor-move hover:bg-[var(--background-tertiary)]/80 transition-colors border border-[var(--navy-border)]/30"
                >
                  <div className="font-medium text-sm">
                    {getManagerDisplayName(manager)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groupNames.map((groupName, index) => (
          <motion.div
            key={groupName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`hover-lift ${
                groups[groupName].length === expectedByGroup[groupName]
                  ? 'border-[var(--success)]/40'
                  : 'border-[var(--navy-border)]/30'
              }`}
            >
              <CardHeader
                className={
                  groups[groupName].length === expectedByGroup[groupName]
                    ? 'bg-[var(--success)]/5'
                    : ''
                }
              >
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--mineral-green)]/20 flex items-center justify-center text-2xl font-bold text-[var(--mineral-green)]">
                      {groupName}
                    </div>
                    Grupa {groupName}
                  </CardTitle>
                  <span className={`text-sm font-semibold ${
                    groups[groupName].length === expectedByGroup[groupName]
                      ? 'text-[var(--success)]'
                      : 'text-[var(--warning)]'
                  }`}>
                    {groups[groupName].length} / {expectedByGroup[groupName] ?? '?'}
                  </span>
                </div>
              </CardHeader>
              <CardContent
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, groupName)}
                className="min-h-[200px]"
              >
                {groups[groupName].length === 0 ? (
                  <EmptyState
                    icon={<Users size={32} />}
                    title="Upuść menedżerów tutaj"
                    description="Przeciągnij menedżerów z nieprzypisanych lub innych grup"
                  />
                ) : (
                  <div className="space-y-3">
                    {groups[groupName].map((manager, idx) => (
                      <div
                        key={manager.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, manager, groupName)}
                        className="p-4 bg-[var(--background-tertiary)] rounded-xl cursor-move hover:bg-[var(--background-tertiary)]/80 transition-colors border border-[var(--navy-border)]/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--mineral-green)]/20 flex items-center justify-center text-sm font-bold text-[var(--mineral-green)]">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold">
                              {getManagerDisplayName(manager)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
