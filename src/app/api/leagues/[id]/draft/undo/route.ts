import { createDraftAdminAction } from '@/lib/draft-helpers'

// Admin: undo the most recent pick (repeatable).
export const POST = createDraftAdminAction({
  rpc: 'draft_undo',
  forbiddenMessage: 'Tylko administrator może cofać wybory.',
  logLabel: 'POST draft undo',
})
