import {
  CURRENT_SCHEMA_VERSION,
  type Board,
  type CommunicationBook,
  type ImageReference,
  type Symbol as SymbolModel,
} from '../../domain/communicationBook'

export const AAC_BOOK_EXTENSION = '.aacbook'
export const AAC_BOOK_MIME_TYPE = 'application/vnd.aacbook+json'
export const AAC_BOOK_FORMAT_VERSION = 1 as const
export const MAX_IMPORT_FILE_SIZE = 100 * 1024 * 1024

export type TransferErrorCode =
  | 'unsupported-file'
  | 'empty-file'
  | 'file-too-large'
  | 'invalid-json'
  | 'invalid-format'
  | 'missing-schema-version'
  | 'newer-schema-version'
  | 'unsupported-schema-version'
  | 'invalid-relations'
  | 'invalid-image'
  | 'missing-image'
  | 'download-failed'

export class BookTransferError extends Error {
  constructor(
    public readonly code: TransferErrorCode,
    public readonly userMessage: string,
  ) {
    super(userMessage)
    this.name = 'BookTransferError'
  }
}

interface ExportedImage {
  id: string
  mimeType: string
  data: string
}

export interface AacBookBackup {
  format: 'aacbook'
  formatVersion: typeof AAC_BOOK_FORMAT_VERSION
  schemaVersion: number
  communicationBook: CommunicationBook
  images: ExportedImage[]
}

export interface ImportedBook {
  book: CommunicationBook
  images: Map<string, Blob>
}

export interface ExistingIds {
  bookIds: Set<string>
  boardIds: Set<string>
  symbolIds: Set<string>
  imageIds: Set<string>
}

const invalidFormat = () => new BookTransferError(
  'invalid-format',
  'Plik nie zawiera poprawnej kopii księgi AAC.',
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string') throw invalidFormat()
  return value
}

function requireNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) throw invalidFormat()
  return value
}

function requireNonBlankId(record: Record<string, unknown>, key: string): string {
  const value = requireString(record, key)
  if (!value.trim()) throw invalidFormat()
  return value
}

function requireNullableString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  if (value !== null && typeof value !== 'string') throw invalidFormat()
  return value
}

function requireNullableId(record: Record<string, unknown>, key: string): string | null {
  const value = requireNullableString(record, key)
  if (value !== null && !value.trim()) throw invalidFormat()
  return value
}

function validateImageReference(value: unknown): ImageReference {
  if (!isRecord(value)) throw invalidFormat()
  const rotation = requireNumber(value, 'rotation')
  const width = requireNumber(value, 'width')
  const height = requireNumber(value, 'height')
  const scale = requireNumber(value, 'scale')
  if (![0, 90, 180, 270].includes(rotation) || width <= 0 || height <= 0 || scale <= 0) {
    throw invalidFormat()
  }
  return {
    id: requireNonBlankId(value, 'id'),
    mimeType: requireString(value, 'mimeType'),
    width,
    height,
    rotation: rotation as ImageReference['rotation'],
    scale,
  }
}

function validateSymbol(value: unknown): SymbolModel {
  if (!isRecord(value)) throw invalidFormat()
  const position = requireNumber(value, 'position')
  const borderWidth = requireNumber(value, 'borderWidth')
  const dwellTime = value.dwellTime
  if (!Number.isInteger(position) || position < 0 || borderWidth < 0) throw invalidFormat()
  if (dwellTime !== null && (typeof dwellTime !== 'number' || !Number.isFinite(dwellTime) || dwellTime < 0)) {
    throw invalidFormat()
  }
  return {
    id: requireNonBlankId(value, 'id'),
    boardId: requireNonBlankId(value, 'boardId'),
    label: requireString(value, 'label'),
    image: value.image === null ? null : validateImageReference(value.image),
    position,
    borderColor: requireString(value, 'borderColor'),
    textColor: requireString(value, 'textColor'),
    borderWidth,
    linkedBoardId: requireNullableId(value, 'linkedBoardId'),
    dwellTime: dwellTime as number | null,
    createdAt: requireString(value, 'createdAt'),
    updatedAt: requireString(value, 'updatedAt'),
  }
}

function validateBoard(value: unknown): Board {
  if (!isRecord(value) || !Array.isArray(value.symbols)) throw invalidFormat()
  const columns = requireNumber(value, 'columns')
  const defaultDwellTime = requireNumber(value, 'defaultDwellTime')
  const defaultBorderWidth = requireNumber(value, 'defaultBorderWidth')
  if (!Number.isInteger(columns) || columns < 1 || defaultDwellTime < 0 || defaultBorderWidth < 0) {
    throw invalidFormat()
  }
  return {
    id: requireNonBlankId(value, 'id'),
    communicationBookId: requireNonBlankId(value, 'communicationBookId'),
    name: requireString(value, 'name'),
    columns,
    defaultDwellTime,
    defaultBorderColor: requireString(value, 'defaultBorderColor'),
    defaultTextColor: requireString(value, 'defaultTextColor'),
    defaultBorderWidth,
    symbols: value.symbols.map(validateSymbol),
    createdAt: requireString(value, 'createdAt'),
    updatedAt: requireString(value, 'updatedAt'),
  }
}

function validateBook(value: unknown, schemaVersion: number): CommunicationBook {
  if (!isRecord(value) || !Array.isArray(value.boards)) throw invalidFormat()
  if (value.schemaVersion !== schemaVersion) throw invalidFormat()
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: requireNonBlankId(value, 'id'),
    name: requireString(value, 'name'),
    mainBoardId: requireNullableString(value, 'mainBoardId'),
    boards: value.boards.map(validateBoard),
    createdAt: requireString(value, 'createdAt'),
    updatedAt: requireString(value, 'updatedAt'),
  }
}

function assertUnique(values: string[]): void {
  if (new Set(values).size !== values.length) {
    throw new BookTransferError('invalid-relations', 'Plik zawiera powielone identyfikatory.')
  }
}

function validateRelations(book: CommunicationBook): void {
  const boardIds = book.boards.map((board) => board.id)
  const boardIdSet = new Set(boardIds)
  const symbols = book.boards.flatMap((board) => board.symbols)
  assertUnique(boardIds)
  assertUnique(symbols.map((symbol) => symbol.id))
  assertUnique(symbols.flatMap((symbol) => symbol.image ? [symbol.image.id] : []))

  if (book.mainBoardId !== null && !boardIdSet.has(book.mainBoardId)) {
    throw new BookTransferError('invalid-relations', 'Główna tablica nie istnieje w importowanej księdze.')
  }
  for (const board of book.boards) {
    if (board.communicationBookId !== book.id) {
      throw new BookTransferError('invalid-relations', 'Tablica wskazuje inną księgę.')
    }
    for (const symbol of board.symbols) {
      if (symbol.boardId !== board.id) {
        throw new BookTransferError('invalid-relations', 'Plik zawiera uszkodzone połączenie między tablicami.')
      }
    }
  }
}

function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.readAsArrayBuffer(blob)
  })
}

function readBlobAsText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') return blob.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsText(blob)
  })
}

function base64ToBlob(data: string, mimeType: string): Blob {
  if (!data || !/^[A-Za-z0-9+/]*={0,2}$/.test(data) || data.length % 4 !== 0) {
    throw new BookTransferError('invalid-image', 'Plik zawiera uszkodzone dane obrazu.')
  }
  try {
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return new Blob([bytes], { type: mimeType })
  } catch {
    throw new BookTransferError('invalid-image', 'Plik zawiera uszkodzone dane obrazu.')
  }
}

export function collectExistingIds(books: CommunicationBook[]): ExistingIds {
  const boards = books.flatMap((book) => book.boards)
  const symbols = boards.flatMap((board) => board.symbols)
  return {
    bookIds: new Set(books.map((book) => book.id)),
    boardIds: new Set(boards.map((board) => board.id)),
    symbolIds: new Set(symbols.map((symbol) => symbol.id)),
    imageIds: new Set(symbols.flatMap((symbol) => symbol.image ? [symbol.image.id] : [])),
  }
}

function nextAvailableId(used: Set<string>, createId: () => string): string {
  let id = createId()
  while (!id.trim() || used.has(id)) id = createId()
  used.add(id)
  return id
}

export function remapConflictingIds(
  imported: ImportedBook,
  existing: ExistingIds,
  createId: () => string = () => crypto.randomUUID(),
): ImportedBook {
  const bookIds = new Set(existing.bookIds)
  const boardIds = new Set(existing.boardIds)
  const symbolIds = new Set(existing.symbolIds)
  const imageIds = new Set(existing.imageIds)
  const bookId = bookIds.has(imported.book.id) ? nextAvailableId(bookIds, createId) : imported.book.id
  bookIds.add(bookId)
  const boardMap = new Map<string, string>()
  const symbolMap = new Map<string, string>()
  const imageMap = new Map<string, string>()

  for (const board of imported.book.boards) {
    const id = boardIds.has(board.id) ? nextAvailableId(boardIds, createId) : board.id
    boardIds.add(id)
    boardMap.set(board.id, id)
    for (const symbol of board.symbols) {
      const symbolId = symbolIds.has(symbol.id) ? nextAvailableId(symbolIds, createId) : symbol.id
      symbolIds.add(symbolId)
      symbolMap.set(symbol.id, symbolId)
      if (symbol.image) {
        const imageId = imageIds.has(symbol.image.id) ? nextAvailableId(imageIds, createId) : symbol.image.id
        imageIds.add(imageId)
        imageMap.set(symbol.image.id, imageId)
      }
    }
  }

  const boards = imported.book.boards.map((board) => ({
    ...board,
    id: boardMap.get(board.id)!,
    communicationBookId: bookId,
    symbols: board.symbols.map((symbol) => ({
      ...symbol,
      id: symbolMap.get(symbol.id)!,
      boardId: boardMap.get(board.id)!,
      linkedBoardId: symbol.linkedBoardId === null
        ? null
        : boardMap.get(symbol.linkedBoardId) ?? symbol.linkedBoardId,
      image: symbol.image ? { ...symbol.image, id: imageMap.get(symbol.image.id)! } : null,
    })),
  }))
  const images = new Map<string, Blob>()
  for (const [oldId, blob] of imported.images) images.set(imageMap.get(oldId) ?? oldId, blob)

  return {
    book: {
      ...imported.book,
      id: bookId,
      mainBoardId: imported.book.mainBoardId === null ? null : boardMap.get(imported.book.mainBoardId)!,
      boards,
    },
    images,
  }
}

export async function createBookBackup(
  book: CommunicationBook,
  imageBlobs: ReadonlyMap<string, Blob>,
): Promise<Blob> {
  validateRelations(book)
  const images: ExportedImage[] = []
  for (const image of book.boards.flatMap((board) => board.symbols).flatMap((symbol) => symbol.image ? [symbol.image] : [])) {
    const blob = imageBlobs.get(image.id)
    if (!blob) {
      throw new BookTransferError('missing-image', 'Nie można utworzyć kopii, ponieważ brakuje danych obrazu.')
    }
    images.push({ id: image.id, mimeType: image.mimeType, data: bytesToBase64(await readBlobAsArrayBuffer(blob)) })
  }
  const backup: AacBookBackup = {
    format: 'aacbook',
    formatVersion: AAC_BOOK_FORMAT_VERSION,
    schemaVersion: book.schemaVersion,
    communicationBook: book,
    images,
  }
  return new Blob([JSON.stringify(backup)], { type: AAC_BOOK_MIME_TYPE })
}

export function createSafeBackupFileName(name: string): string {
  const normalized = name.trim().replace(/ł/g, 'l').replace(/Ł/g, 'L')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${normalized || 'Ksiega-AAC'}${AAC_BOOK_EXTENSION}`
}

export async function parseBookBackup(file: Blob): Promise<ImportedBook> {
  if (file.size === 0) throw new BookTransferError('empty-file', 'Wybrany plik jest pusty.')
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    throw new BookTransferError('file-too-large', 'Plik jest zbyt duży, aby bezpiecznie go zaimportować.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(await readBlobAsText(file))
  } catch {
    throw new BookTransferError('invalid-json', 'Nie udało się odczytać pliku kopii księgi.')
  }
  if (!isRecord(parsed)) throw invalidFormat()
  if (!Object.hasOwn(parsed, 'schemaVersion')) {
    throw new BookTransferError('missing-schema-version', 'Plik nie zawiera informacji o wersji danych.')
  }
  if (typeof parsed.schemaVersion !== 'number' || !Number.isInteger(parsed.schemaVersion)) throw invalidFormat()
  if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new BookTransferError('newer-schema-version', 'Ta księga została utworzona w nowszej wersji aplikacji.')
  }
  if (parsed.schemaVersion < CURRENT_SCHEMA_VERSION) {
    throw new BookTransferError('unsupported-schema-version', 'Ta wersja kopii księgi nie jest jeszcze obsługiwana.')
  }
  if (parsed.format !== 'aacbook' || parsed.formatVersion !== AAC_BOOK_FORMAT_VERSION || !Array.isArray(parsed.images)) {
    throw invalidFormat()
  }
  const book = validateBook(parsed.communicationBook, parsed.schemaVersion)
  validateRelations(book)
  const imageReferences = new Map(book.boards.flatMap((board) => board.symbols)
    .flatMap((symbol) => symbol.image ? [[symbol.image.id, symbol.image] as const] : []))
  const images = new Map<string, Blob>()
  for (const value of parsed.images) {
    if (!isRecord(value)) throw new BookTransferError('invalid-image', 'Plik zawiera uszkodzone dane obrazu.')
    const id = requireNonBlankId(value, 'id')
    const mimeType = requireString(value, 'mimeType')
    const data = requireString(value, 'data')
    const reference = imageReferences.get(id)
    if (!reference || reference.mimeType !== mimeType || images.has(id)) {
      throw new BookTransferError('invalid-image', 'Metadane obrazu w pliku są niespójne.')
    }
    images.set(id, base64ToBlob(data, mimeType))
  }
  if (images.size !== imageReferences.size) {
    throw new BookTransferError('missing-image', 'Plik nie zawiera wszystkich obrazów księgi.')
  }
  return { book, images }
}

export async function importBookBackup(
  file: File,
  existingBooks: CommunicationBook[],
  createId?: () => string,
  existingImageIds: Iterable<string> = [],
): Promise<ImportedBook> {
  const supportedMimeTypes = ['', AAC_BOOK_MIME_TYPE, 'application/json', 'application/octet-stream']
  if (!file.name.toLowerCase().endsWith(AAC_BOOK_EXTENSION) || !supportedMimeTypes.includes(file.type)) {
    throw new BookTransferError('unsupported-file', 'Wybierz plik kopii księgi z rozszerzeniem .aacbook.')
  }
  const existingIds = collectExistingIds(existingBooks)
  for (const imageId of existingImageIds) existingIds.imageIds.add(imageId)
  return remapConflictingIds(await parseBookBackup(file), existingIds, createId)
}

export function downloadBackup(blob: Blob, fileName: string): void {
  try {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url))
  } catch {
    throw new BookTransferError('download-failed', 'Nie udało się przygotować pliku do pobrania.')
  }
}
