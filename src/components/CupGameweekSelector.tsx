interface CupGameweek {
  id: string
  cup_week: number
  stage: string
  leg: number
  gameweek?: {
    id: string
    week: number
    is_completed: boolean
  }
}

interface CupGameweekSelectorProps {
  gameweeks: CupGameweek[]
  selectedGameweek: string
  onGameweekChange: (gameweekId: string) => void
  disabled?: boolean
}

export function CupGameweekSelector({
  gameweeks,
  selectedGameweek,
  onGameweekChange,
  disabled = false
}: CupGameweekSelectorProps) {
  const getStageLabel = (stage: string) => {
    const stageLabels: Record<string, string> = {
      'group_stage': 'Faza Grupowa',
      'round_of_16': '1/8 finału',
      'quarter_final': 'Ćwierćfinał',
      'semi_final': 'Półfinał',
      'final': 'Finał'
    }
    return stageLabels[stage] || stage
  }

  return (
    <div className="mb-6 flex justify-center">
      <select
        value={selectedGameweek}
        onChange={(e) => onGameweekChange(e.target.value)}
        className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 bg-white"
        disabled={disabled}
      >
        <option value="">Wybierz kolejkę pucharu...</option>
        {gameweeks.map((gw) => {
          const stageLabel = getStageLabel(gw.stage)
          const legInfo = gw.stage !== 'group_stage' && gw.stage !== 'final' ? ` - Mecz ${gw.leg}` : ''
          const completedInfo = gw.gameweek?.is_completed ? ' (Zakończona)' : ''

          return (
            <option key={gw.id} value={gw.id}>
              Kolejka {gw.cup_week} - {stageLabel}{legInfo}{completedInfo}
            </option>
          )
        })}
      </select>
    </div>
  )
}
