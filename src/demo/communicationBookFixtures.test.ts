import { describe, expect, it } from 'vitest'
import {
  MemoryCommunicationBookRepository,
  type MemoryRepositoryState,
} from '../data/communicationBookRepository'
import { createCommunicationBook, getEffectiveDwellTime } from '../domain/communicationBook'
import { createBookBackup, importBookBackup } from '../features/bookTransfer/bookTransfer'
import {
  DEMO_BOOK_IDS,
  createDemoBookBundles,
  createDemoCommunicationBooks,
  removeDemoBooks,
  seedDemoBooks,
} from './communicationBookFixtures'

const fakeAsset = () => Promise.resolve(new Blob(['synthetic-png'], { type: 'image/png' }))

describe('demo CommunicationBooks', () => {
  it('creates valid and internally consistent fixture graphs', () => {
    const books = createDemoCommunicationBooks()
    const bookIds = new Set<string>()
    const boardIds = new Set<string>()
    const symbolIds = new Set<string>()
    const imageIds = new Set<string>()

    expect(books.map((book) => book.name)).toEqual([
      'Posiłki', 'Szkoła', 'Jak się czuję', 'Zabawa', 'Wizyta u lekarza',
    ])
    for (const book of books) {
      expect(bookIds.has(book.id)).toBe(false)
      bookIds.add(book.id)
      const localBoardIds = new Set(book.boards.map((board) => board.id))
      expect(book.mainBoardId === null || localBoardIds.has(book.mainBoardId)).toBe(true)
      for (const board of book.boards) {
        expect(board.communicationBookId).toBe(book.id)
        expect(boardIds.has(board.id)).toBe(false)
        boardIds.add(board.id)
        for (const symbol of board.symbols) {
          expect(symbol.boardId).toBe(board.id)
          expect(symbol.linkedBoardId === null || localBoardIds.has(symbol.linkedBoardId)).toBe(true)
          expect(symbolIds.has(symbol.id)).toBe(false)
          symbolIds.add(symbol.id)
          if (symbol.image) {
            expect(symbol.image.mimeType).toBe('image/png')
            expect(imageIds.has(symbol.image.id)).toBe(false)
            imageIds.add(symbol.image.id)
          }
        }
      }
    }
    expect(imageIds.size).toBeGreaterThanOrEqual(6)
  })

  it('covers linked navigation and default plus individual dwell in Posiłki', () => {
    const meals = createDemoCommunicationBooks().find((book) => book.name === 'Posiłki')!
    const main = meals.boards.find((board) => board.id === meals.mainBoardId)!
    const foodLink = main.symbols.find((symbol) => symbol.label === 'Jedzenie')!
    const drinks = meals.boards.find((board) => board.name === 'Picie')!
    const water = drinks.symbols.find((symbol) => symbol.label === 'Woda')!
    const custom = main.symbols.find((symbol) => symbol.label === 'Picie')!

    expect(meals.boards.find((board) => board.id === foodLink.linkedBoardId)?.name).toBe('Jedzenie')
    expect(getEffectiveDwellTime(water, drinks)).toBe(drinks.defaultDwellTime)
    expect(getEffectiveDwellTime(custom, main)).toBe(800)
  })

  it('seeds through the repository idempotently and persists across repository instances', async () => {
    const state: MemoryRepositoryState = { books: new Map(), images: new Map() }
    const firstRepository = new MemoryCommunicationBookRepository(state)
    await seedDemoBooks(firstRepository, fakeAsset)
    await seedDemoBooks(firstRepository, fakeAsset)

    const reopenedRepository = new MemoryCommunicationBookRepository(state)
    const books = await reopenedRepository.listBooks()
    expect(books).toHaveLength(5)
    expect(books.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4).map((book) => book.name))
      .toEqual(['Posiłki', 'Szkoła', 'Jak się czuję', 'Zabawa'])
    expect((await reopenedRepository.getImagesForBook('demo-meals-book')).size).toBeGreaterThan(0)
  })

  it('cleanup removes only original fixture IDs and preserves user and imported copies', async () => {
    const repository = new MemoryCommunicationBookRepository()
    const userBook = createCommunicationBook({ id: 'user-book', name: 'Moja książka' })
    const importedCopy = createCommunicationBook({ id: 'imported-demo-copy', name: 'Posiłki' })
    await repository.saveBundles([
      { book: userBook, images: new Map() },
      { book: importedCopy, images: new Map() },
    ])
    await seedDemoBooks(repository, fakeAsset)
    const remaining = await removeDemoBooks(repository)

    expect(remaining.map((book) => book.id).sort()).toEqual(['imported-demo-copy', 'user-book'])
    expect(remaining.some((book) => DEMO_BOOK_IDS.includes(book.id))).toBe(false)
  })

  it('exports and imports Posiłki with its graph and binary demo images', async () => {
    const bundles = await createDemoBookBundles(fakeAsset)
    const meals = bundles.find(({ book }) => book.name === 'Posiłki')!
    const file = new File([await createBookBackup(meals.book, meals.images)], 'Posilki.aacbook', {
      type: 'application/vnd.aacbook+json',
    })
    const imported = await importBookBackup(file, [meals.book], () => crypto.randomUUID())

    expect(imported.book.id).not.toBe(meals.book.id)
    expect(imported.book.boards).toHaveLength(meals.book.boards.length)
    expect(imported.book.mainBoardId).not.toBe(meals.book.mainBoardId)
    expect(imported.book.boards[0].symbols[0].linkedBoardId).toBe(imported.book.boards[1].id)
    expect(imported.images.size).toBe(meals.images.size)
    expect([...imported.images.values()].every((blob) => blob.type === 'image/png')).toBe(true)
  })
})
