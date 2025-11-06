import { useState, useEffect } from 'react'

interface Squad {
  id: string
  manager_id: string
  league_id: string
  team_name?: string | null
}

export function useTeamNameModal(leagueId: string) {
  const [squad, setSquad] = useState<Squad | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!leagueId) return

    async function fetchSquad() {
      try {
        const response = await fetch(`/api/manager/leagues/${leagueId}/squad-info`)
        if (response.ok) {
          const data = await response.json()
          if (data.squad) {
            setSquad(data.squad)
            // Show modal if team name is not set
            if (!data.squad.team_name) {
              setShowModal(true)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch squad info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSquad()
  }, [leagueId])

  const handleSuccess = (teamName: string) => {
    if (squad) {
      setSquad({ ...squad, team_name: teamName })
    }
    setShowModal(false)
  }

  return {
    squad,
    showModal,
    loading,
    handleSuccess
  }
}
