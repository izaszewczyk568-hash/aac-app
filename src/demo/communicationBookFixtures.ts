import type { BookBundle, CommunicationBookRepository } from '../data/communicationBookRepository'
import {
  createBoard,
  createCommunicationBook,
  createSymbol,
  type Board,
  type CommunicationBook,
} from '../domain/communicationBook'

export type IconKind = 'food' | 'drink' | 'school' | 'feelings' | 'play' | 'doctor'

interface SymbolSpec {
  label: string
  target?: string
  dwellTime?: number | null
  icon?: IconKind
}

export interface DemoAssetSpec {
  label: string
  accent: string
  icon?: IconKind
}

interface BoardSpec {
  key: string
  name: string
  columns: number
  dwellTime: number
  symbols: SymbolSpec[]
}

interface BookSpec {
  key: string
  name: string
  updatedAt: string
  color: string
  textColor?: string
  boards: BoardSpec[]
}

const createdAt = '2026-01-10T10:00:00.000Z'

const bookSpecs: BookSpec[] = [
  {
    key: 'meals', name: 'Posiłki', updatedAt: '2026-01-15T12:00:00.000Z', color: '#8a4b08',
    boards: [
      { key: 'main', name: 'Główna', columns: 3, dwellTime: 1200, symbols: [
        { label: 'Jedzenie', target: 'food', icon: 'food' }, { label: 'Picie', target: 'drinks', icon: 'drink', dwellTime: 800 },
        { label: 'Deser', target: 'dessert', icon: 'food' }, { label: 'Chcę jeszcze' }, { label: 'Już nie chcę' },
      ] },
      { key: 'food', name: 'Jedzenie', columns: 3, dwellTime: 1500, symbols: [
        { label: 'Chcę kanapkę', icon: 'food' }, { label: 'Chcę zupę' }, { label: 'Chcę makaron' },
        { label: 'Chcę jogurt' }, { label: 'Chcę owoc' }, { label: 'Nie chcę tego', dwellTime: 2200 },
      ] },
      { key: 'drinks', name: 'Picie', columns: 2, dwellTime: 1000, symbols: [
        { label: 'Woda', icon: 'drink' }, { label: 'Chcę sok' }, { label: 'Chcę herbatę' }, { label: 'Chcę więcej' },
      ] },
      { key: 'dessert', name: 'Deser', columns: 4, dwellTime: 1300, symbols: [
        { label: 'Lody' }, { label: 'Ciastko' }, { label: 'Owoc' }, { label: 'Nie chcę deseru' },
      ] },
    ],
  },
  {
    key: 'school', name: 'Szkoła', updatedAt: '2026-01-14T12:00:00.000Z', color: '#155e75',
    boards: [
      { key: 'main', name: 'Główna', columns: 3, dwellTime: 1400, symbols: [
        { label: 'Lekcja', target: 'lesson', icon: 'school' }, { label: 'Przerwa', target: 'break' },
        { label: 'Potrzebuję', target: 'needs' }, { label: 'Osoby', target: 'people' }, { label: 'Jak się czuję', target: 'feelings', icon: 'feelings' },
      ] },
      { key: 'lesson', name: 'Lekcja', columns: 5, dwellTime: 1000, symbols: [
        { label: 'Rozumiem' }, { label: 'Nie rozumiem' }, { label: 'Proszę powtórzyć' }, { label: 'Potrzebuję pomocy', dwellTime: 650 }, { label: 'Skończyłem' },
      ] },
      { key: 'break', name: 'Przerwa', columns: 3, dwellTime: 1800, symbols: [
        { label: 'Chcę odpocząć' }, { label: 'Chcę wyjść' }, { label: 'Chcę zostać tutaj' }, { label: 'Chcę się pobawić' }, { label: 'Koniec' },
      ] },
      { key: 'needs', name: 'Potrzebuję', columns: 3, dwellTime: 1250, symbols: [
        { label: 'Toaleta' }, { label: 'Pić' }, { label: 'Pomoc' }, { label: 'Przerwa' }, { label: 'Ciszej' },
      ] },
      { key: 'people', name: 'Osoby', columns: 4, dwellTime: 1500, symbols: [
        { label: 'Nauczyciel' }, { label: 'Kolega' }, { label: 'Koleżanka' }, { label: 'Opiekun' },
      ] },
      { key: 'feelings', name: 'Jak się czuję', columns: 3, dwellTime: 1600, symbols: [
        { label: 'Dobrze' }, { label: 'Smutno' }, { label: 'Jestem zmęczony' }, { label: 'Boję się' },
      ] },
    ],
  },
  {
    key: 'feelings', name: 'Jak się czuję', updatedAt: '2026-01-13T12:00:00.000Z', color: '#7e22ce',
    boards: [
      { key: 'main', name: 'Główna', columns: 4, dwellTime: 1600, symbols: [
        { label: 'Emocje', target: 'emotions', icon: 'feelings' }, { label: 'Samopoczucie', target: 'wellbeing' },
        { label: 'Gdzie boli', target: 'pain' }, { label: 'Czego potrzebuję', target: 'needs' },
      ] },
      { key: 'emotions', name: 'Emocje', columns: 3, dwellTime: 1800, symbols: [
        { label: 'Jest mi dobrze' }, { label: 'Jest mi smutno' }, { label: 'Jestem zły' },
        { label: 'Boję się' }, { label: 'Jestem zmęczony' }, { label: 'Nie wiem, co czuję' },
      ] },
      { key: 'wellbeing', name: 'Samopoczucie', columns: 2, dwellTime: 2000, symbols: [
        { label: 'Dobrze' }, { label: 'Źle' }, { label: 'Lepiej' }, { label: 'Gorzej' },
      ] },
      { key: 'pain', name: 'Gdzie boli', columns: 3, dwellTime: 1450, symbols: [
        { label: 'Boli mnie głowa' }, { label: 'Boli mnie brzuch' }, { label: 'Boli mnie gardło' },
        { label: 'Bolą mnie plecy' }, { label: 'Boli mnie ręka' }, { label: 'Boli mnie noga' },
      ] },
      { key: 'needs', name: 'Czego potrzebuję', columns: 3, dwellTime: 1700, symbols: [
        { label: 'Potrzebuję pomocy' }, { label: 'Potrzebuję przerwy' }, { label: 'Potrzebuję ciszy' },
        { label: 'Chcę być sam' }, { label: 'Chcę, żeby ktoś został' }, { label: 'Chcę wrócić' },
      ] },
    ],
  },
  {
    key: 'play', name: 'Zabawa', updatedAt: '2026-01-12T12:00:00.000Z', color: '#166534',
    boards: [
      { key: 'main', name: 'Główna', columns: 4, dwellTime: 900, symbols: [
        { label: 'Zabawki', target: 'toys', icon: 'play' }, { label: 'Aktywności', target: 'activities' },
        { label: 'Z kim', target: 'with-whom' }, { label: 'Sterowanie zabawą', target: 'controls' },
      ] },
      { key: 'toys', name: 'Zabawki', columns: 5, dwellTime: 1100, symbols: [
        { label: 'Klocki' }, { label: 'Piłka' }, { label: 'Puzzle' }, { label: 'Lalka' }, { label: 'Samochód' },
      ] },
      { key: 'activities', name: 'Aktywności', columns: 3, dwellTime: 1300, symbols: [
        { label: 'Chcę rysować' }, { label: 'Chcę grać' }, { label: 'Chcę oglądać' }, { label: 'Chcę słuchać muzyki' }, { label: 'Chcę wyjść' },
      ] },
      { key: 'with-whom', name: 'Z kim', columns: 3, dwellTime: 1500, symbols: [
        { label: 'Sam' }, { label: 'Z mamą' }, { label: 'Z tatą' }, { label: 'Z kolegą' }, { label: 'Z koleżanką' },
      ] },
      { key: 'controls', name: 'Sterowanie zabawą', columns: 3, dwellTime: 800, symbols: [
        { label: 'Jeszcze', dwellTime: 500 }, { label: 'Stop' }, { label: 'Inaczej' }, { label: 'Moja kolej' }, { label: 'Twoja kolej' },
      ] },
    ],
  },
  {
    key: 'doctor', name: 'Wizyta u lekarza', updatedAt: '2026-01-11T12:00:00.000Z', color: '#9f1239',
    boards: [
      { key: 'main', name: 'Główna', columns: 3, dwellTime: 1900, symbols: [
        { label: 'Tak / Nie', target: 'yes-no', icon: 'doctor' },
        { label: 'Co czuję', target: 'feel' }, { label: 'Gdzie boli', target: 'pain' }, { label: 'Potrzebuję', target: 'needs' },
      ] },
      { key: 'yes-no', name: 'Tak / Nie', columns: 3, dwellTime: 1200, symbols: [
        { label: 'Tak' }, { label: 'Nie' }, { label: 'Nie wiem' },
      ] },
      { key: 'feel', name: 'Co czuję', columns: 3, dwellTime: 1700, symbols: [
        { label: 'Boli' }, { label: 'Piecze' }, { label: 'Swędzi' }, { label: 'Jest mi niedobrze' }, { label: 'Kręci mi się w głowie' },
      ] },
      { key: 'pain', name: 'Gdzie boli', columns: 3, dwellTime: 1600, symbols: [
        { label: 'Głowa' }, { label: 'Brzuch' }, { label: 'Gardło' }, { label: 'Plecy' }, { label: 'Ręka' }, { label: 'Noga' },
      ] },
      { key: 'needs', name: 'Potrzebuję', columns: 2, dwellTime: 2000, symbols: [
        { label: 'Potrzebuję przerwy' }, { label: 'Nie rozumiem' }, { label: 'Proszę powiedzieć jeszcze raz' }, { label: 'Nie chcę odpowiadać' },
      ] },
    ],
  },
]

export const DEMO_BOOK_IDS = bookSpecs.map((spec) => `demo-${spec.key}-book`)

function boardId(bookKey: string, key: string): string {
  return `demo-${bookKey}-${key}-board`
}

export function createDemoCommunicationBooks(): CommunicationBook[] {
  return bookSpecs.map((bookSpec) => {
    const bookId = `demo-${bookSpec.key}-book`
    const boards: Board[] = bookSpec.boards.map((boardSpec) => {
      const id = boardId(bookSpec.key, boardSpec.key)
      return createBoard({
        id,
        communicationBookId: bookId,
        name: boardSpec.name,
        coverSymbolId: boardSpec.symbols.length > 0
          ? `demo-${bookSpec.key}-${boardSpec.key}-symbol-1`
          : null,
        columns: boardSpec.columns,
        defaultDwellTime: boardSpec.dwellTime,
        defaultBorderColor: bookSpec.color,
        defaultTextColor: bookSpec.textColor ?? '#17202a',
        defaultBorderWidth: boardSpec.key === 'main' ? 3 : 2,
        createdAt,
        updatedAt: bookSpec.updatedAt,
        symbols: boardSpec.symbols.map((symbol, position) => {
          const symbolId = `demo-${bookSpec.key}-${boardSpec.key}-symbol-${position + 1}`
          return createSymbol({
            id: symbolId,
            boardId: id,
            label: symbol.label,
            position,
            linkedBoardId: symbol.target ? boardId(bookSpec.key, symbol.target) : null,
            dwellTime: symbol.dwellTime ?? null,
            borderColor: bookSpec.color,
            textColor: bookSpec.textColor ?? '#17202a',
            borderWidth: boardSpec.key === 'main' ? 3 : 2,
            image: {
              id: `${symbolId}-image`,
              mimeType: 'image/png',
              width: 192,
              height: 192,
              rotation: 0,
              scale: 1,
            },
            createdAt,
            updatedAt: bookSpec.updatedAt,
          })
        }),
      })
    })
    return createCommunicationBook({
      id: bookId,
      name: bookSpec.name,
      coverSymbolId: boards[0]?.symbols[0]?.id ?? null,
      mainBoardId: boardId(bookSpec.key, 'main'),
      boards,
      createdAt,
      updatedAt: bookSpec.updatedAt,
    })
  })
}

const exactPictograms: Readonly<Record<string, string>> = {
  'tak / nie': '↔️',
  tak: '✅',
  nie: '❌',
  'nie wiem': '🤷',
  'jeszcze': '➕',
  stop: '🛑',
  inaczej: '🔄',
  'moja kolej': '1️⃣',
  'twoja kolej': '2️⃣',
  sam: '👤',
  'z mamą': '👩',
  'z tatą': '👨',
  'z kolegą': '👦',
  'z koleżanką': '👧',
  dobrze: '🙂',
  źle: '🙁',
  lepiej: '↗️',
  gorzej: '↘️',
  boli: '🩹',
  piecze: '🔥',
  swędzi: '🖐️',
  głowa: '🧠',
  brzuch: '😣',
  gardło: '🗣️',
  plecy: '🧍',
  ręka: '💪',
  noga: '🦵',
}

const pictogramRules: ReadonlyArray<readonly [RegExp, string]> = [
  [/kanapk/, '🥪'], [/zup/, '🍲'], [/makaron/, '🍝'], [/jogurt/, '🥣'], [/owoc/, '🍎'],
  [/jedzeni|posił/, '🍽️'], [/wod/, '💧'], [/sok/, '🧃'], [/herbat/, '🍵'], [/pić|picie/, '🥤'],
  [/lod/, '🍦'], [/ciast/, '🍪'], [/deser/, '🧁'],
  [/lekcj|szkoł/, '📚'], [/nie rozumiem/, '🤔'], [/rozumiem/, '👍'], [/powtórz|jeszcze raz/, '🔁'],
  [/pomoc/, '🆘'], [/skończy|koniec/, '✅'], [/przerw|odpoczą/, '🛋️'], [/wyjść|wrócić/, '🚪'],
  [/zostać tutaj/, '📍'], [/toalet/, '🚻'], [/cisz|ciszej/, '🤫'], [/nauczyciel/, '👩‍🏫'],
  [/kolega/, '👦'], [/koleżanka/, '👧'], [/opiekun/, '🧑'], [/osob|z kim/, '👥'],
  [/smut/, '😢'], [/zmęcz/, '😴'], [/boj|strach/, '😨'], [/zły/, '😠'], [/dobr/, '🙂'],
  [/nie wiem, co czuję/, '🤷'], [/samopoczuc|co czuję|emocj|jak się czuję/, '🙂'],
  [/głow/, '🤕'], [/brzuch/, '😣'], [/gardł/, '🗣️'], [/plec/, '🧍'], [/ręk/, '💪'], [/nog/, '🦵'],
  [/boli|ból|gdzie boli/, '🩹'], [/niedobrze/, '🤢'], [/kręci mi się/, '😵‍💫'],
  [/klock/, '🧱'], [/piłk/, '⚽'], [/puzzle/, '🧩'], [/lalk/, '🪆'], [/samochód/, '🚗'],
  [/zabawk|pobawić|zabawa/, '🧸'], [/rysować/, '🖍️'], [/grać/, '🎲'], [/oglądać/, '📺'],
  [/muzyk/, '🎵'], [/aktywno/, '🎨'], [/sterowanie/, '🎮'], [/więcej|jeszcze/, '➕'],
  [/nie chcę|nie chcę odpowiadać/, '✋'], [/potrzebuję/, '🙋'],
]

const iconPictograms: Readonly<Record<IconKind, string>> = {
  food: '🍽️',
  drink: '🥤',
  school: '📚',
  feelings: '🙂',
  play: '🧸',
  doctor: '🩺',
}

function pictogramFor({ label, icon }: DemoAssetSpec): string {
  if (icon) return iconPictograms[icon]
  const normalized = label.trim().toLocaleLowerCase('pl-PL')
  return exactPictograms[normalized]
    ?? pictogramRules.find(([pattern]) => pattern.test(normalized))?.[1]
    ?? '💬'
}

function colorWithAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex
}

function canvasBlob(spec: DemoAssetSpec): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 192
  canvas.height = 192
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('Canvas is unavailable.'))

  const gradient = context.createLinearGradient(0, 0, 192, 192)
  gradient.addColorStop(0, colorWithAlpha(spec.accent, '20'))
  gradient.addColorStop(1, colorWithAlpha(spec.accent, '45'))
  context.fillStyle = gradient
  context.fillRect(0, 0, 192, 192)

  context.fillStyle = 'rgba(255, 255, 255, 0.88)'
  context.beginPath()
  context.arc(96, 96, 68, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = spec.accent
  context.beginPath()
  context.arc(156, 36, 12, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.arc(34, 158, 8, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#17202a'
  context.font = '84px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(pictogramFor(spec), 96, 101)

  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('Could not create demo asset.')),
    'image/png',
  ))
}

export async function createDemoBookBundles(
  createAsset: (spec: DemoAssetSpec) => Promise<Blob> = canvasBlob,
): Promise<BookBundle[]> {
  const books = createDemoCommunicationBooks()
  const bundles: BookBundle[] = []
  for (const book of books) {
    const images = new Map<string, Blob>()
    for (const board of book.boards) {
      const bookSpec = bookSpecs.find((candidate) => `demo-${candidate.key}-book` === book.id)!
      const boardSpec = bookSpec.boards.find((candidate) => boardId(bookSpec.key, candidate.key) === board.id)!
      for (const [index, symbol] of board.symbols.entries()) {
        if (!symbol.image) continue
        images.set(symbol.image.id, await createAsset({
          label: symbol.label,
          accent: bookSpec.color,
          icon: boardSpec.symbols[index]?.icon,
        }))
      }
    }
    bundles.push({ book, images })
  }
  return bundles
}

export async function seedDemoBooks(
  repository: CommunicationBookRepository,
  createAsset?: (spec: DemoAssetSpec) => Promise<Blob>,
): Promise<CommunicationBook[]> {
  await repository.saveBundles(await createDemoBookBundles(createAsset))
  return repository.listBooks()
}

export async function removeDemoBooks(repository: CommunicationBookRepository): Promise<CommunicationBook[]> {
  await repository.deleteBooks(DEMO_BOOK_IDS)
  return repository.listBooks()
}
