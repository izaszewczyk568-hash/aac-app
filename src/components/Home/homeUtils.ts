export const untitledBookLabel = 'Książka bez tytułu'

export function getBookDisplayName(name: string) {
  return name.trim() || untitledBookLabel
}
