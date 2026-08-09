export const untitledBookLabel = 'Księga bez tytułu'

export function getBookDisplayName(name: string) {
  return name.trim() || untitledBookLabel
}

export function getBoardCountLabel(count: number) {
  if (count === 1) return '1 tablica'
  if (count >= 2 && count <= 4) return `${count} tablice`
  return `${count} tablic`
}
