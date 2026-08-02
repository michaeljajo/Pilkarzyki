import { assertLeagueMutableByCup, requireLeagueAdminByCup } from '@/lib/auth-helpers'
import { createManualTiebreakerHandlers } from '@/lib/manual-tiebreakers-service'

export const { GET, PUT, DELETE } = createManualTiebreakerHandlers({
  table: 'cup_manual_tiebreakers',
  scopeColumn: 'cup_id',
  label: 'cup manual tiebreakers',
  requireAdmin: requireLeagueAdminByCup,
  assertMutable: assertLeagueMutableByCup,
})
