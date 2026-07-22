/**
 * Generate the player-pool import Excel template (2026/27 draft format).
 *
 * Produces an .xlsx with the five Polish columns the import parser expects:
 *   Imię i Nazwisko, Kraj, Liga, Klub, Pozycja
 * (Kraj and Liga are optional; Pozycja is Obrońca / Pomocnik / Napastnik —
 * goalkeepers are not supported.)
 *
 * This mirrors the on-the-fly template served by GET /api/admin/players/import.
 *
 * Usage: npx tsx scripts/generate-import-template.ts
 * Output: migrations/player-import-template.xlsx
 */

import * as XLSX from 'xlsx'
import * as path from 'path'

const templateData = [
  { 'Imię i Nazwisko': 'Lionel Messi', 'Kraj': 'Argentyna', 'Liga': 'MLS', 'Klub': 'Inter Miami', 'Pozycja': 'Napastnik' },
  { 'Imię i Nazwisko': 'Virgil van Dijk', 'Kraj': 'Holandia', 'Liga': 'Premier League', 'Klub': 'Liverpool FC', 'Pozycja': 'Obrońca' },
  { 'Imię i Nazwisko': 'Luka Modrić', 'Kraj': 'Chorwacja', 'Liga': 'La Liga', 'Klub': 'Real Madrid', 'Pozycja': 'Pomocnik' },
  { 'Imię i Nazwisko': 'Robert Lewandowski', 'Kraj': 'Polska', 'Liga': 'La Liga', 'Klub': 'FC Barcelona', 'Pozycja': 'Napastnik' },
]

const workbook = XLSX.utils.book_new()
const worksheet = XLSX.utils.json_to_sheet(templateData, {
  header: ['Imię i Nazwisko', 'Kraj', 'Liga', 'Klub', 'Pozycja'],
})
worksheet['!cols'] = [
  { width: 26 }, // Imię i Nazwisko
  { width: 16 }, // Kraj
  { width: 20 }, // Liga
  { width: 20 }, // Klub
  { width: 14 }, // Pozycja
]
XLSX.utils.book_append_sheet(workbook, worksheet, 'Zawodnicy')

const outPath = path.join(__dirname, '../migrations/player-import-template.xlsx')
XLSX.writeFile(workbook, outPath)
console.log(`✅ Wrote ${outPath}`)
