/** Lowercases and strips diacritics so "Zieliński" matches a "zielinski" query. */
export function fold(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}
