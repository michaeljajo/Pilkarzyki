/**
 * The one place that decides how a manager is named in admin screens.
 *
 * The email local-part is the last resort and the full address is never shown:
 * an admin screen lists other people's accounts, and their address is not
 * needed to tell them apart (GDPR — data minimisation).
 */
export interface ManagerRef {
  databaseId: string
  firstName?: string
  lastName?: string
  displayName?: string
  email?: string
}

export function managerLabel(m: ManagerRef): string {
  if (m.displayName) return m.displayName
  const full = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
  return full || m.email?.split('@')[0] || 'Menedżer'
}
