import { describe, expect, it } from 'vitest'
import { createBoard, createCommunicationBook, createSymbol } from '../../domain/communicationBook'
import { findBookThumbnailImageId } from './createBookThumbnail'

describe('book thumbnail selection', () => {
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
})
