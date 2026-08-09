import type { CommunicationBook } from '../domain/communicationBook'

export interface BookBundle {
  book: CommunicationBook
  images: Map<string, Blob>
}

export interface CommunicationBookRepository {
  listBooks(): Promise<CommunicationBook[]>
  getImagesForBook(bookId: string): Promise<Map<string, Blob>>
  saveBundles(bundles: BookBundle[]): Promise<void>
  deleteBooks(bookIds: string[]): Promise<void>
}

interface StoredImage {
  id: string
  bookId: string
  blob: Blob
}

const DATABASE_NAME = 'aac-app'
const DATABASE_VERSION = 1
const BOOKS_STORE = 'communicationBooks'
const IMAGES_STORE = 'images'

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'))
  })
}

export class IndexedDbCommunicationBookRepository implements CommunicationBookRepository {
  private databasePromise: Promise<IDBDatabase> | null = null

  private open(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise
    this.databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(BOOKS_STORE)) {
          database.createObjectStore(BOOKS_STORE, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(IMAGES_STORE)) {
          const images = database.createObjectStore(IMAGES_STORE, { keyPath: 'id' })
          images.createIndex('bookId', 'bookId', { unique: false })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return this.databasePromise
  }

  async listBooks(): Promise<CommunicationBook[]> {
    const database = await this.open()
    const transaction = database.transaction(BOOKS_STORE, 'readonly')
    return requestResult(transaction.objectStore(BOOKS_STORE).getAll())
  }

  async getImagesForBook(bookId: string): Promise<Map<string, Blob>> {
    const database = await this.open()
    const transaction = database.transaction(IMAGES_STORE, 'readonly')
    const records = await requestResult<StoredImage[]>(
      transaction.objectStore(IMAGES_STORE).index('bookId').getAll(bookId),
    )
    return new Map(records.map((record) => [record.id, record.blob]))
  }

  async saveBundles(bundles: BookBundle[]): Promise<void> {
    if (bundles.length === 0) return
    const database = await this.open()
    const transaction = database.transaction([BOOKS_STORE, IMAGES_STORE], 'readwrite')
    const booksStore = transaction.objectStore(BOOKS_STORE)
    const imagesStore = transaction.objectStore(IMAGES_STORE)
    for (const { book, images } of bundles) {
      booksStore.put(book)
      for (const [id, blob] of images) imagesStore.put({ id, bookId: book.id, blob } satisfies StoredImage)
    }
    await transactionComplete(transaction)
  }

  async deleteBooks(bookIds: string[]): Promise<void> {
    if (bookIds.length === 0) return
    const database = await this.open()
    const transaction = database.transaction([BOOKS_STORE, IMAGES_STORE], 'readwrite')
    const booksStore = transaction.objectStore(BOOKS_STORE)
    const imageIndex = transaction.objectStore(IMAGES_STORE).index('bookId')
    for (const bookId of bookIds) {
      booksStore.delete(bookId)
      const keys = await requestResult<IDBValidKey[]>(imageIndex.getAllKeys(bookId))
      keys.forEach((key) => transaction.objectStore(IMAGES_STORE).delete(key))
    }
    await transactionComplete(transaction)
  }
}

export interface MemoryRepositoryState {
  books: Map<string, CommunicationBook>
  images: Map<string, { bookId: string; blob: Blob }>
}

export class MemoryCommunicationBookRepository implements CommunicationBookRepository {
  constructor(private readonly state: MemoryRepositoryState = { books: new Map(), images: new Map() }) {}

  async listBooks(): Promise<CommunicationBook[]> {
    return [...this.state.books.values()]
  }

  async getImagesForBook(bookId: string): Promise<Map<string, Blob>> {
    return new Map([...this.state.images].flatMap(([id, value]) => value.bookId === bookId ? [[id, value.blob]] : []))
  }

  async saveBundles(bundles: BookBundle[]): Promise<void> {
    const nextBooks = new Map(this.state.books)
    const nextImages = new Map(this.state.images)
    for (const { book, images } of bundles) {
      nextBooks.set(book.id, book)
      for (const [id, blob] of images) nextImages.set(id, { bookId: book.id, blob })
    }
    this.state.books = nextBooks
    this.state.images = nextImages
  }

  async deleteBooks(bookIds: string[]): Promise<void> {
    const ids = new Set(bookIds)
    const nextBooks = new Map(this.state.books)
    bookIds.forEach((id) => nextBooks.delete(id))
    this.state.books = nextBooks
    this.state.images = new Map([...this.state.images].filter(([, value]) => !ids.has(value.bookId)))
  }
}

export function createCommunicationBookRepository(): CommunicationBookRepository {
  return typeof indexedDB === 'undefined'
    ? new MemoryCommunicationBookRepository()
    : new IndexedDbCommunicationBookRepository()
}
