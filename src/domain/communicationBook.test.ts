import { describe, expect, it } from 'vitest'
import {
  CURRENT_SCHEMA_VERSION,
  createBoard,
  createCommunicationBook,
  createSymbol,
  getEffectiveDwellTime,
  isMainBoard,
  setMainBoard,
} from './communicationBook'

const timestamp = '2026-08-09T12:00:00.000Z'

function makeBoard(
  overrides: Partial<Parameters<typeof createBoard>[0]> = {},
) {
  return createBoard({
    id: 'board-1',
    communicationBookId: 'book-1',
    name: 'Start',
    createdAt: timestamp,
    ...overrides,
  })
}

function makeSymbol(
  overrides: Partial<Parameters<typeof createSymbol>[0]> = {},
) {
  return createSymbol({
    id: 'symbol-1',
    boardId: 'board-1',
    label: 'Pić',
    position: 0,
    createdAt: timestamp,
    ...overrides,
  })
}

describe('communication book domain model', () => {
  it('creates a valid versioned communication book', () => {
    const book = createCommunicationBook({
      id: 'book-1',
      name: 'Moja książka',
      createdAt: timestamp,
    })

    expect(book).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      id: 'book-1',
      name: 'Moja książka',
      mainBoardId: null,
      boards: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  })

  it('creates a board with grid and visual defaults', () => {
    const board = makeBoard()

    expect(board).toMatchObject({
      columns: 4,
      defaultDwellTime: 1000,
      defaultBorderColor: '#000000',
      defaultTextColor: '#000000',
      defaultBorderWidth: 2,
      symbols: [],
    })
    expect(board).not.toHaveProperty('x')
    expect(board).not.toHaveProperty('y')
  })

  it('allows a board name to be blank without replacing its value', () => {
    expect(makeBoard({ name: '' }).name).toBe('')
    expect(makeBoard({ name: '   ' }).name).toBe('   ')
  })

  it('creates an ordered symbol with nullable optional values', () => {
    const symbol = makeSymbol({ position: 3 })

    expect(symbol).toMatchObject({
      position: 3,
      speechText: null,
      image: null,
      linkedBoardId: null,
      dwellTime: null,
      borderColor: '#000000',
      textColor: '#000000',
      borderWidth: 2,
    })
    expect(symbol).not.toHaveProperty('x')
    expect(symbol).not.toHaveProperty('y')
  })

  it('allows an empty symbol label without creating a fallback value', () => {
    expect(makeSymbol({ label: '' }).label).toBe('')
  })

  it('uses mainBoardId as the only source of truth and can replace it', () => {
    const firstBoard = makeBoard()
    const secondBoard = makeBoard({ id: 'board-2' })
    const book = createCommunicationBook({
      id: 'book-1',
      name: 'Moja książka',
      mainBoardId: firstBoard.id,
      boards: [firstBoard, secondBoard],
      createdAt: timestamp,
    })

    expect(isMainBoard(book, firstBoard)).toBe(true)
    expect(isMainBoard(book, secondBoard)).toBe(false)

    const updatedBook = setMainBoard(book, secondBoard.id)

    expect(updatedBook.mainBoardId).toBe(secondBoard.id)
    expect(isMainBoard(updatedBook, firstBoard)).toBe(false)
    expect(isMainBoard(updatedBook, secondBoard)).toBe(true)
  })

  it('rejects a main board from outside the book', () => {
    expect(() =>
      createCommunicationBook({
        id: 'book-1',
        name: 'Niepoprawna książka',
        mainBoardId: 'board-outside-book',
        boards: [makeBoard()],
      }),
    ).toThrow('The main board must belong to its communication book.')
  })

  it('prefers the symbol dwell time', () => {
    const board = makeBoard({ defaultDwellTime: 1200 })
    const symbol = makeSymbol({ dwellTime: 600 })

    expect(getEffectiveDwellTime(symbol, board)).toBe(600)
  })

  it('uses the board dwell time when the symbol has none', () => {
    const board = makeBoard({ defaultDwellTime: 1200 })
    const symbol = makeSymbol({ dwellTime: null })

    expect(getEffectiveDwellTime(symbol, board)).toBe(1200)
  })

  it('supports a symbol without a linked board', () => {
    expect(makeSymbol({ linkedBoardId: null }).linkedBoardId).toBeNull()
  })

  it('keeps image metadata as a storage-independent reference', () => {
    const symbol = makeSymbol({
      image: {
        id: 'image-1',
        mimeType: 'image/webp',
        width: 512,
        height: 512,
        rotation: 0,
        scale: 1,
      },
    })

    expect(symbol.image).toEqual({
      id: 'image-1',
      mimeType: 'image/webp',
      width: 512,
      height: 512,
      rotation: 0,
      scale: 1,
    })
  })
})
