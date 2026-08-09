export const CURRENT_SCHEMA_VERSION = 4 as const

export type SchemaVersion = typeof CURRENT_SCHEMA_VERSION
export type IsoDateTime = string

export interface ImageReference {
  id: string
  mimeType: string
  width: number
  height: number
  rotation: 0 | 90 | 180 | 270
  scale: number
}

export interface Symbol {
  id: string
  boardId: string
  label: string
  image: ImageReference | null
  position: number
  borderColor: string
  textColor: string
  borderWidth: number
  linkedBoardId: string | null
  dwellTime: number | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface Board {
  id: string
  communicationBookId: string
  name: string
  columns: number
  defaultDwellTime: number
  defaultBorderColor: string
  defaultTextColor: string
  defaultBorderWidth: number
  symbols: Symbol[]
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface CommunicationBook {
  schemaVersion: SchemaVersion
  id: string
  name: string
  mainBoardId: string | null
  boards: Board[]
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface CreateCommunicationBookInput {
  id: string
  name: string
  mainBoardId?: string | null
  boards?: Board[]
  createdAt?: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface CreateBoardInput {
  id: string
  communicationBookId: string
  name: string
  columns?: number
  defaultDwellTime?: number
  defaultBorderColor?: string
  defaultTextColor?: string
  defaultBorderWidth?: number
  symbols?: Symbol[]
  createdAt?: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface CreateSymbolInput {
  id: string
  boardId: string
  label: string
  position: number
  image?: (Omit<ImageReference, 'rotation' | 'scale'> & {
    rotation?: ImageReference['rotation']
    scale?: number
  }) | null
  borderColor?: string
  textColor?: string
  borderWidth?: number
  linkedBoardId?: string | null
  dwellTime?: number | null
  createdAt?: IsoDateTime
  updatedAt?: IsoDateTime
}

export type CreateSymbolForBoardInput = Omit<
  CreateSymbolInput,
  'boardId' | 'borderColor' | 'textColor' | 'borderWidth'
>

const DEFAULT_COLUMNS = 4
const DEFAULT_DWELL_TIME = 1000
const DEFAULT_BORDER_COLOR = '#000000'
const DEFAULT_TEXT_COLOR = '#000000'
const DEFAULT_BORDER_WIDTH = 2

function currentIsoDateTime(): IsoDateTime {
  return new Date().toISOString()
}

function requireNonBlank(value: string, fieldName: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} cannot be blank.`)
  }
}

function requireNonNegative(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`)
  }
}

function requirePositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${fieldName} must be a positive integer.`)
  }
}

export function createCommunicationBook(
  input: CreateCommunicationBookInput,
): CommunicationBook {
  requireNonBlank(input.id, 'CommunicationBook.id')

  const boards = input.boards ?? []
  if (boards.some((board) => board.communicationBookId !== input.id)) {
    throw new Error('Every board must belong to its communication book.')
  }

  const mainBoardId = input.mainBoardId ?? null
  if (
    mainBoardId !== null &&
    !boards.some((board) => board.id === mainBoardId)
  ) {
    throw new Error('The main board must belong to its communication book.')
  }

  const createdAt = input.createdAt ?? currentIsoDateTime()

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: input.id,
    name: input.name,
    mainBoardId,
    boards: [...boards],
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
  }
}

export function createBoard(input: CreateBoardInput): Board {
  requireNonBlank(input.id, 'Board.id')
  requireNonBlank(input.communicationBookId, 'Board.communicationBookId')

  const columns = input.columns ?? DEFAULT_COLUMNS
  const defaultDwellTime = input.defaultDwellTime ?? DEFAULT_DWELL_TIME
  const defaultBorderWidth = input.defaultBorderWidth ?? DEFAULT_BORDER_WIDTH
  requirePositiveInteger(columns, 'Board.columns')
  requireNonNegative(defaultDwellTime, 'Board.defaultDwellTime')
  requireNonNegative(defaultBorderWidth, 'Board.defaultBorderWidth')

  const symbols = input.symbols ?? []
  if (symbols.some((symbol) => symbol.boardId !== input.id)) {
    throw new Error('Every symbol must belong to its board.')
  }

  const createdAt = input.createdAt ?? currentIsoDateTime()

  return {
    id: input.id,
    communicationBookId: input.communicationBookId,
    name: input.name,
    columns,
    defaultDwellTime,
    defaultBorderColor: input.defaultBorderColor ?? DEFAULT_BORDER_COLOR,
    defaultTextColor: input.defaultTextColor ?? DEFAULT_TEXT_COLOR,
    defaultBorderWidth,
    symbols: [...symbols],
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
  }
}

export function createSymbol(input: CreateSymbolInput): Symbol {
  requireNonBlank(input.id, 'Symbol.id')
  requireNonBlank(input.boardId, 'Symbol.boardId')
  requireNonNegative(input.position, 'Symbol.position')

  const borderWidth = input.borderWidth ?? DEFAULT_BORDER_WIDTH
  requireNonNegative(borderWidth, 'Symbol.borderWidth')
  if (input.dwellTime !== null && input.dwellTime !== undefined) {
    requireNonNegative(input.dwellTime, 'Symbol.dwellTime')
  }

  const createdAt = input.createdAt ?? currentIsoDateTime()

  return {
    id: input.id,
    boardId: input.boardId,
    label: input.label,
    image: input.image
      ? { rotation: 0, scale: 1, ...input.image }
      : null,
    position: input.position,
    borderColor: input.borderColor ?? DEFAULT_BORDER_COLOR,
    textColor: input.textColor ?? DEFAULT_TEXT_COLOR,
    borderWidth,
    linkedBoardId: input.linkedBoardId ?? null,
    dwellTime: input.dwellTime ?? null,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
  }
}

export function createSymbolForBoard(
  board: Board,
  input: CreateSymbolForBoardInput,
): Symbol {
  return createSymbol({
    ...input,
    boardId: board.id,
    borderColor: board.defaultBorderColor,
    textColor: board.defaultTextColor,
    borderWidth: board.defaultBorderWidth,
  })
}

export function addBoard(
  book: CommunicationBook,
  board: Board,
): CommunicationBook {
  if (board.communicationBookId !== book.id) {
    throw new Error('The board belongs to a different communication book.')
  }
  if (book.boards.some((existingBoard) => existingBoard.id === board.id)) {
    throw new Error('A board with this id already exists in the book.')
  }
  return {
    ...book,
    boards: [...book.boards, board],
  }
}

export function setMainBoard(
  book: CommunicationBook,
  mainBoardId: string | null,
): CommunicationBook {
  if (
    mainBoardId !== null &&
    !book.boards.some((board) => board.id === mainBoardId)
  ) {
    throw new Error('The main board must belong to its communication book.')
  }

  return {
    ...book,
    mainBoardId,
  }
}

export function isMainBoard(
  book: CommunicationBook,
  board: Board,
): boolean {
  return board.communicationBookId === book.id && board.id === book.mainBoardId
}

export function getEffectiveDwellTime(
  symbol: Symbol,
  board: Board,
): number {
  if (symbol.boardId !== board.id) {
    throw new Error('The symbol belongs to a different board.')
  }

  return symbol.dwellTime ?? board.defaultDwellTime
}
