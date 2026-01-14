'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  email: string
}

interface GroupAssignment {
  [groupName: string]: Manager[]
}

// Helper function to display manager name
function getManagerDisplayName(manager: Manager): string {
  return manager.email
}

export default function CupGroupsPage() {
  const params = useParams()
  const router = useRouter()
  const [cup, setCup] = useState<{ id: string; name: string; league_id: string } | null>(null)
  const [allManagers, setAllManagers] = useState<Manager[]>([])
  const [groups, setGroups] = useState<GroupAssignment>({})
  const [unassignedManagers, setUnassignedManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [draggedManager, setDraggedManager] = useState<Manager | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchData()
    }
  }, [params.id])

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

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch cup
      const cupResponse = await fetch(`/api/cups?leagueId=${params.id}`)
      const cupData = await cupResponse.json()

      if (!cupResponse.ok || !cupData.cup) {
        setError('Cup not found. Please create a cup first.')
        router.push(`/dashboard/admin/leagues/${params.id}/cup`)
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

      // Initialize groups based on manager count
      const managerCount = managers.length
      const groupCount = managerCount === 4 ? 2 : managerCount / 4

      if (![1, 2, 4, 8].includes(groupCount)) {
        setError(`Invalid manager count (${managerCount}). Cup requires exactly 4, 8, 16, or 32 managers.`)
        return
      }

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
            email: string
          }
        }

        const transformedGroups: GroupAssignment = {}
        Object.entries(groupsData.groups).forEach(([groupName, groupManagers]) => {
          transformedGroups[groupName] = (groupManagers as GroupManagerData[]).map((m: GroupManagerData) => ({
            id: m.managerId,
            firstName: m.manager.first_name || undefined,
            lastName: m.manager.last_name || undefined,
            email: m.manager.email
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
        const groupNames = Array.from({ length: groupCount }, (_, i) =>
          String.fromCharCode(65 + i) // A, B, C, D, ...
        )
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
  }

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

      // Determine expected group size (2 for 4-team cups, 4 for all others)
      const expectedGroupSize = allManagers.length === 4 ? 2 : 4

      // Validate each group has correct number of managers
      const invalidGroups = Object.entries(groups).filter(
        ([_, managers]) => managers.length !== expectedGroupSize
      )

      if (invalidGroups.length > 0) {
        const groupNames = invalidGroups.map(([name]) => name).join(', ')
        setError(`Each group must have exactly ${expectedGroupSize} managers. Invalid groups: ${groupNames}`)
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

    // Determine managers per group (2 for 4-team cups, 4 for all others)
    const managersPerGroup = allManagers.length === 4 ? 2 : 4

    // Distribute evenly across groups
    const newGroups: GroupAssignment = {}
    const groupNames = Object.keys(groups)

    groupNames.forEach((groupName, groupIndex) => {
      newGroups[groupName] = shuffled.slice(
        groupIndex * managersPerGroup,
        (groupIndex + 1) * managersPerGroup
      )
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
                onClick: () => router.push(`/dashboard/admin/leagues/${params.id}`),
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
            onClick={() => router.push(`/dashboard/admin/leagues/${params.id}/cup`)}
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
            Przeciągnij i upuść menedżerów do grup po {allManagers.length === 4 ? '2' : '4'}
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
                groups[groupName].length === (allManagers.length === 4 ? 2 : 4)
                  ? 'border-[var(--success)]/40'
                  : 'border-[var(--navy-border)]/30'
              }`}
            >
              <CardHeader
                className={
                  groups[groupName].length === (allManagers.length === 4 ? 2 : 4)
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
                    groups[groupName].length === (allManagers.length === 4 ? 2 : 4)
                      ? 'text-[var(--success)]'
                      : 'text-[var(--warning)]'
                  }`}>
                    {groups[groupName].length} / {allManagers.length === 4 ? 2 : 4}
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
                            <div className="text-xs text-[var(--foreground-secondary)]">
                              {manager.email}
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
