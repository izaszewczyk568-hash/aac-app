import { describe, expect, it } from 'vitest'
import { createBoard, createCommunicationBook, createSymbol } from '../../domain/communicationBook'
import { findBoardCoverImageId, findBookThumbnailImageId } from './createBookThumbnail'

describe('book thumbnail selection', () => {
  it('uses the direct book cover image when no cover symbol is selected', () => {
    const book = createCommunicationBook({
      id: 'book',
      name: 'Posiłki',
      coverImage: {
        id: 'direct-cover',
        mimeType: 'image/webp',
        width: 320,
        height: 240,
        rotation: 0,
        scale: 1,
      },
    })

    expect(findBookThumbnailImageId(book)).toBe('direct-cover')
    expect(findBookThumbnailImageId(book, new Set())).toBeNull()
  })

  it('allows a later cover symbol selection to override the uploaded book cover', () => {
    const board = createBoard({
      id: 'board',
      communicationBookId: 'book',
      name: 'Główna',
      symbols: [createSymbol({
        id: 'selected-cover',
        boardId: 'board',
        label: 'Wybrana okładka',
        position: 0,
        image: { id: 'symbol-cover', mimeType: 'image/png', width: 10, height: 10 },
      })],
    })
    const book = createCommunicationBook({
      id: 'book',
      name: 'Posiłki',
      boards: [board],
      mainBoardId: board.id,
      coverSymbolId: 'selected-cover',
      coverImage: {
        id: 'uploaded-cover',
        mimeType: 'image/webp',
        width: 320,
        height: 240,
        rotation: 0,
        scale: 1,
      },
    })

    expect(findBookThumbnailImageId(book)).toBe('symbol-cover')
  })

  it('uses the selected Board cover and falls back to the first available symbol image', () => {
    const board = createBoard({
      id: 'board',
      communicationBookId: 'book',
      name: 'Jedzenie',
      coverSymbolId: 'cover',
      symbols: [
        createSymbol({ id: 'first', boardId: 'board', label: 'Pierwszy', position: 0, image: { id: 'first-image', mimeType: 'image/png', width: 10, height: 10 } }),
        createSymbol({ id: 'cover', boardId: 'board', label: 'Okładka', position: 1, image: { id: 'cover-image', mimeType: 'image/png', width: 10, height: 10 } }),
      ],
    })

    expect(findBoardCoverImageId(board)).toBe('cover-image')
    expect(findBoardCoverImageId(board, new Set(['first-image']))).toBe('first-image')
  })

  it('uses the first available image by position on the valid main Board', () => {
    const main = createBoard({
      id: 'main',
      communicationBookId: 'book',
      name: 'Główna',
      symbols: [
        createSymbol({ id: 'later', boardId: 'main', label: '', position: 3, image: { id: 'later-image', mimeType: 'image/webp', width: 10, height: 10 } }),
        createSymbol({ id: 'missing', boardId: 'main', label: '', position: 0, image: { id: 'missing-image', mimeType: 'image/webp', width: 10, height: 10 } }),
        createSymbol({ id: 'first', boardId: 'main', label: '', position: 2, image: { id: 'first-image', mimeType: 'image/png', width: 10, height: 10 } }),
      ],
    })
    const other = createBoard({ id: 'other', communicationBookId: 'book', name: '', symbols: [createSymbol({ id: 'other-symbol', boardId: 'other', label: '', position: 0, image: { id: 'other-image', mimeType: 'image/png', width: 10, height: 10 } })] })
    const book = createCommunicationBook({ id: 'book', name: '', boards: [other, main], mainBoardId: main.id })

    expect(findBookThumbnailImageId(book, new Set(['first-image', 'later-image', 'other-image']))).toBe('first-image')
  })

  it('returns null without a valid main Board or available image', () => {
    const book = createCommunicationBook({ id: 'book', name: '' })
    expect(findBookThumbnailImageId(book, new Set())).toBeNull()
  })

  it('prefers the optional cover symbol over the automatic main Board image', () => {
    const main = createBoard({
      id: 'main',
      communicationBookId: 'book',
      name: 'Główna',
      symbols: [createSymbol({ id: 'automatic', boardId: 'main', label: 'Auto', position: 0, image: { id: 'automatic-image', mimeType: 'image/png', width: 10, height: 10 } })],
    })
    const other = createBoard({
      id: 'other',
      communicationBookId: 'book',
      name: 'Inna',
      symbols: [createSymbol({ id: 'cover', boardId: 'other', label: 'Okładka', position: 0, image: { id: 'cover-image', mimeType: 'image/png', width: 10, height: 10 } })],
    })
    const book = createCommunicationBook({ id: 'book', name: '', boards: [main, other], mainBoardId: main.id, coverSymbolId: 'cover' })

    expect(findBookThumbnailImageId(book, new Set(['automatic-image', 'cover-image']))).toBe('cover-image')
  })
})
