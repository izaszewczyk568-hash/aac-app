import { describe, expect, it } from 'vitest'
import {
  CURRENT_SCHEMA_VERSION,
  createBoard,
  createCommunicationBook,
  createSymbol,
  type CommunicationBook,
} from '../../domain/communicationBook'
import {
  AAC_BOOK_MIME_TYPE,
  BookTransferError,
  collectExistingIds,
  createBookBackup,
  createSafeBackupFileName,
  importBookBackup,
  parseBookBackup,
  remapConflictingIds,
} from './bookTransfer'

function fixture(): { book: CommunicationBook; images: Map<string, Blob> } {
  const foodSymbol = createSymbol({
    id: 'symbol-food',
    boardId: 'board-main',
    label: 'Jedzenie',
    position: 0,
    linkedBoardId: 'board-food',
    dwellTime: 1750,
    image: {
      id: 'image-food',
      mimeType: 'image/webp',
      width: 320,
      height: 240,
      rotation: 90,
      scale: 1.25,
    },
  })
  const main = createBoard({
    id: 'board-main',
    communicationBookId: 'book-meals',
    name: 'Start',
    columns: 5,
    defaultDwellTime: 1400,
    defaultBorderColor: '#112233',
    defaultTextColor: '#334455',
    defaultBorderWidth: 4,
    symbols: [foodSymbol],
  })
  const food = createBoard({
    id: 'board-food',
    communicationBookId: 'book-meals',
    name: 'Jedzenie',
  })
  return {
    book: createCommunicationBook({
      id: 'book-meals',
      name: 'Posiłki',
      boards: [main, food],
      mainBoardId: main.id,
    }),
    images: new Map([['image-food', new Blob(['image-binary'], { type: 'image/webp' })]]),
  }
}

async function asFile(blob: Blob, name = 'Posilki.aacbook'): Promise<File> {
  return new File([blob], name, { type: AAC_BOOK_MIME_TYPE })
}

function readText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsText(blob)
  })
}

describe('CommunicationBook import/export', () => {
  it('exports the complete graph, settings and binary image without blob URLs', async () => {
    const { book, images } = fixture()
    const blob = await createBookBackup(book, images)
    const raw = await readText(blob)
    const backup = JSON.parse(raw)

    expect(backup.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(backup.communicationBook.boards).toHaveLength(2)
    expect(backup.communicationBook.boards[0].symbols).toHaveLength(1)
    expect(backup.communicationBook.mainBoardId).toBe('board-main')
    expect(backup.communicationBook.boards[0].symbols[0].linkedBoardId).toBe('board-food')
    expect(backup.communicationBook.boards[0]).toMatchObject({
      columns: 5,
      defaultDwellTime: 1400,
      defaultBorderColor: '#112233',
      defaultTextColor: '#334455',
      defaultBorderWidth: 4,
    })
    expect(backup.communicationBook.boards[0].symbols[0].image).toMatchObject({ rotation: 90, scale: 1.25 })
    expect(backup.images[0].data).toBeTruthy()
    expect(raw).not.toContain('blob:')
  })

  it('round-trips a complete book and restores images as Blob values', async () => {
    const original = fixture()
    const restored = await parseBookBackup(await createBookBackup(original.book, original.images))

    expect(restored.book).toEqual(original.book)
    expect([...restored.images.keys()]).toEqual(['image-food'])
    expect(await readText(restored.images.get('image-food')!)).toBe('image-binary')
    expect(restored.images.get('image-food')?.type).toBe('image/webp')
  })

  it('remaps colliding book, board, symbol and image IDs while preserving references', async () => {
    const original = fixture()
    const imported = await parseBookBackup(await createBookBackup(original.book, original.images))
    const ids = collectExistingIds([original.book])
    const generated = ['book-copy', 'main-copy', 'symbol-copy', 'image-copy', 'food-copy'][Symbol.iterator]()
    const remapped = remapConflictingIds(imported, ids, () => generated.next().value ?? 'fallback')

    expect(remapped.book.id).toBe('book-copy')
    expect(remapped.book.mainBoardId).toBe('main-copy')
    expect(remapped.book.boards.map((board) => board.id)).toEqual(['main-copy', 'food-copy'])
    expect(remapped.book.boards[0].communicationBookId).toBe('book-copy')
    expect(remapped.book.boards[0].symbols[0]).toMatchObject({
      id: 'symbol-copy',
      boardId: 'main-copy',
      linkedBoardId: 'food-copy',
      image: { id: 'image-copy' },
    })
    expect(remapped.images.has('image-copy')).toBe(true)
    expect(original.book.boards[0].id).toBe('board-main')
  })

  it('allows duplicate import as an independent remapped copy', async () => {
    const original = fixture()
    const file = await asFile(await createBookBackup(original.book, original.images))
    let sequence = 0
    const imported = await importBookBackup(file, [original.book], () => `new-${sequence++}`)
    expect(imported.book.name).toBe('Posiłki')
    expect(imported.book.id).not.toBe(original.book.id)
    expect(imported.book.mainBoardId).not.toBe(original.book.mainBoardId)
  })

  it('preserves a cross-book link whose target is not part of this backup', async () => {
    const { book, images } = fixture()
    const backup = JSON.parse(await readText(await createBookBackup(book, images)))
    backup.communicationBook.boards[0].symbols[0].linkedBoardId = 'outside-book'

    const imported = await parseBookBackup(new Blob([JSON.stringify(backup)]))
    expect(imported.book.boards[0].symbols[0].linkedBoardId).toBe('outside-book')
  })

  it('rejects a missing or corrupted image before returning imported data', async () => {
    const { book, images } = fixture()
    const backup = JSON.parse(await readText(await createBookBackup(book, images)))
    backup.images[0].data = 'not base64!'
    await expect(parseBookBackup(new Blob([JSON.stringify(backup)]))).rejects.toMatchObject({ code: 'invalid-image' })

    backup.images = []
    await expect(parseBookBackup(new Blob([JSON.stringify(backup)]))).rejects.toMatchObject({ code: 'missing-image' })
  })

  it('rejects newer schema versions with the required user-facing message', async () => {
    const { book, images } = fixture()
    const backup = JSON.parse(await readText(await createBookBackup(book, images)))
    backup.schemaVersion = CURRENT_SCHEMA_VERSION + 1
    await expect(parseBookBackup(new Blob([JSON.stringify(backup)]))).rejects.toEqual(
      new BookTransferError('newer-schema-version', 'Ta księga została utworzona w nowszej wersji aplikacji.'),
    )
  })

  it('rejects unsupported files, empty files and malformed JSON', async () => {
    await expect(importBookBackup(new File(['x'], 'book.txt', { type: 'text/plain' }), [])).rejects.toMatchObject({ code: 'unsupported-file' })
    await expect(parseBookBackup(new Blob([]))).rejects.toMatchObject({ code: 'empty-file' })
    await expect(parseBookBackup(new Blob(['{']))).rejects.toMatchObject({ code: 'invalid-json' })
  })

  it('creates safe download names', () => {
    expect(createSafeBackupFileName('  Posiłki / lato  ')).toBe('Posilki-lato.aacbook')
    expect(createSafeBackupFileName('   ')).toBe('Ksiega-AAC.aacbook')
  })
})
