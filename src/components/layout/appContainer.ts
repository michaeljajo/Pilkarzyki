/**
 * One source of truth for the app's horizontal container.
 *
 * Every full-bleed surface (header, tab bar, page content) centres its contents
 * with this class, on the landing page and inside a league alike, so the left
 * edge never shifts as you move between them. Previously the league shell used
 * 1280px/16-24px while the landing page used 1600px/32px for content and
 * 1400px/48px for its nav — three different left edges on two screens.
 */
export const APP_CONTAINER = 'w-full max-w-[1280px] mx-auto px-4 md:px-6'

/**
 * Vertical rhythm for the content region. The generous bottom padding clears the
 * mobile tab bar inside a league; it is harmless where there is no bar.
 */
export const APP_CONTENT_Y = 'pt-6 pb-24 md:pb-8'
