import { createDraftAdminAction } from '@/lib/draft-helpers'

// Admin: defer the on-the-clock manager to the end of the current round.
export const POST = createDraftAdminAction({
  rpc: 'draft_skip',
  forbiddenMessage: 'Tylko administrator może pomijać kolejki.',
  logLabel: 'POST draft skip',
})
