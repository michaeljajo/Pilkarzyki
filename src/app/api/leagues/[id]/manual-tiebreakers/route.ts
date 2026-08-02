import { assertLeagueMutable, requireLeagueAdmin } from '@/lib/auth-helpers'
import { createManualTiebreakerHandlers } from '@/lib/manual-tiebreakers-service'

export const { GET, PUT, DELETE } = createManualTiebreakerHandlers({
  table: 'manual_tiebreakers',
  scopeColumn: 'league_id',
  label: 'manual tiebreakers',
  requireAdmin: requireLeagueAdmin,
  assertMutable: assertLeagueMutable,
})
