import { useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import {
  Add01Icon,
  ArrowLeft02Icon,
  Cancel01Icon,
  DatabaseAddIcon,
  Delete02Icon,
  GridViewIcon,
  Home01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Board, type BoardMode, type SaveStatus } from './components/Board/Board'
import { SymbolTile } from './components/SymbolTile/SymbolTile'
import { SymbolInspector } from './components/SymbolInspector/SymbolInspector'
import { Home } from './components/Home/Home'
import { CommunicationBoardCard } from './components/CommunicationBoardCard/CommunicationBoardCard'
import { createBoard, createCommunicationBook, createSymbolForBoard, getEffectiveDwellTime, type CommunicationBook, type Symbol as SymbolModel } from './domain/communicationBook'
import {
  ImageProcessingError,
  processImageFile,
  type ProcessedImage,
} from './features/images/processImage'
import {
  createBookThumbnailPng,
  findBoardCoverImageId,
  findBookThumbnailImageId,
} from './features/images/createBookThumbnail'
import { browserSpeechService, type SpeechService } from './features/speech/speechService'
import {
  BookTransferError,
  createBookBackup,
  createSafeBackupFileName,
  downloadBackup,
  importBookBackup,
} from './features/bookTransfer/bookTransfer'
import {
  createCommunicationBookRepository,
  type CommunicationBookRepository,
} from './data/communicationBookRepository'
import { AutosaveCoordinator } from './data/autosaveCoordinator'
import { PwaStatus } from './components/PwaStatus/PwaStatus'
import { SelectControl } from './components/SelectControl/SelectControl'

const demoBoard = createBoard({
  id: 'demo-board',
  communicationBookId: 'demo-book',
  name: 'Jedzenie',
  columns: 4,
  symbols: [],
  createdAt: '2026-08-09T12:00:00.000Z',
})

const demoBoards = [
  { id: demoBoard.id, name: demoBoard.name },
  { id: 'demo-drinks', name: 'Picie' },
  { id: 'demo-play', name: 'Zabawa' },
  { id: 'demo-untitled', name: '' },
]

interface BoardRoute {
  bookId: string
  boardId: string
  mode: BoardMode
}

export interface OpenedBoardTab {
  navigate: (url: string) => void
  close: () => void
}

function readBoardRoute(): BoardRoute | null {
  if (typeof window === 'undefined') return null
  const parameters = new URLSearchParams(window.location.search)
  const bookId = parameters.get('book')
  const boardId = parameters.get('board')
  if (!bookId || !boardId) return null
  return {
    bookId,
    boardId,
    mode: parameters.get('mode') === 'use' ? 'use' : 'edit',
  }
}

function createBoardUrl(bookId: string, boardId: string): string {
  const url = new URL(window.location.href)
  url.searchParams.delete('pwa')
  url.searchParams.set('book', bookId)
  url.searchParams.set('board', boardId)
  url.searchParams.set('mode', 'edit')
  url.hash = ''
  return url.toString()
}

function openBlankBoardTab(): OpenedBoardTab | null {
  const openedWindow = window.open('about:blank', '_blank')
  if (!openedWindow) return null
  openedWindow.opener = null
  return {
    navigate: (url) => openedWindow.location.replace(url),
    close: () => openedWindow.close(),
  }
}

export interface AppProps {
  imageProcessor?: (file: File) => Promise<ProcessedImage>
  thumbnailProcessor?: (blob: Blob) => Promise<Blob>
  createImageUrl?: (blob: Blob) => string
  speechService?: SpeechService
  onNavigateToBoard?: (boardId: string) => void
  initialView?: 'home' | 'board'
  repository?: CommunicationBookRepository
  openBoardTab?: () => OpenedBoardTab | null
}

export function App({
  imageProcessor = processImageFile,
  thumbnailProcessor = createBookThumbnailPng,
  createImageUrl = (blob) => URL.createObjectURL(blob),
  speechService = browserSpeechService,
  onNavigateToBoard,
  initialView = 'board',
  repository,
  openBoardTab = openBlankBoardTab,
}: AppProps = {}) {
  const [view, setView] = useState<'home' | 'book' | 'board'>(initialView)
  const [books, setBooks] = useState<CommunicationBook[]>([])
  const [openedBookId, setOpenedBookId] = useState<string | null>(null)
  const [boardHistory, setBoardHistory] = useState<Array<{ bookId: string; boardId: string }>>([])
  const [mode, setMode] = useState<BoardMode>('edit')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [board, setBoard] = useState(demoBoard)
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null)
  const [imageSources, setImageSources] = useState<Record<string, string>>({})
  const [thumbnailSources, setThumbnailSources] = useState<Record<string, string>>({})
  const [imageError, setImageError] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [demoMessage, setDemoMessage] = useState<string | null>(null)
  const [transferNotice, setTransferNotice] = useState<{
    type: 'status' | 'success' | 'error'
    message: string
  } | null>(null)
  const [dwellEnabled, setDwellEnabled] = useState(true)
  const [isDwellReady, setIsDwellReady] = useState(true)
  const [isChildFullScreen, setIsChildFullScreen] = useState(false)
  const [isExitFullScreenDwelling, setIsExitFullScreenDwelling] = useState(false)
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null)
  const speechWarningShownRef = useRef(false)
  const navigationTimersRef = useRef<number[]>([])
  const importToastTimerRef = useRef<number | null>(null)
  const dwellCooldownTimerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const appRef = useRef<HTMLDivElement>(null)
  const exitFullScreenDwellConsumedRef = useRef(false)
  const createdImageUrlsRef = useRef<string[]>([])
  const thumbnailUrlsRef = useRef(new Map<string, string>())
  const thumbnailImageIdsRef = useRef(new Map<string, string>())
  const thumbnailRevisionRef = useRef(new Map<string, number>())
  const imageBlobsRef = useRef(new Map<string, Blob>())
  const repositoryRef = useRef(repository ?? createCommunicationBookRepository())
  const autosaveRef = useRef(new AutosaveCoordinator())
  const saveRevisionRef = useRef(0)
  const requestedBoardRouteRef = useRef(readBoardRoute())
  const dataRepository = repositoryRef.current
  const createImageUrlRef = useRef(createImageUrl)

  const refreshBookThumbnail = useCallback(async (book: CommunicationBook) => {
    const imageId = findBookThumbnailImageId(book, new Set(imageBlobsRef.current.keys()))
    if (imageId && thumbnailImageIdsRef.current.get(book.id) === imageId) return

    const revision = (thumbnailRevisionRef.current.get(book.id) ?? 0) + 1
    thumbnailRevisionRef.current.set(book.id, revision)
    const source = imageId ? imageBlobsRef.current.get(imageId) : undefined
    if (!imageId || !source) {
      const oldUrl = thumbnailUrlsRef.current.get(book.id)
      if (oldUrl) URL.revokeObjectURL?.(oldUrl)
      thumbnailUrlsRef.current.delete(book.id)
      thumbnailImageIdsRef.current.delete(book.id)
      setThumbnailSources((current) => {
        const next = { ...current }
        delete next[book.id]
        return next
      })
      return
    }

    try {
      const png = await thumbnailProcessor(source)
      if (thumbnailRevisionRef.current.get(book.id) !== revision) return
      const nextUrl = createImageUrlRef.current(png)
      const oldUrl = thumbnailUrlsRef.current.get(book.id)
      if (oldUrl) URL.revokeObjectURL?.(oldUrl)
      thumbnailUrlsRef.current.set(book.id, nextUrl)
      thumbnailImageIdsRef.current.set(book.id, imageId)
      setThumbnailSources((current) => ({ ...current, [book.id]: nextUrl }))
    } catch {
      // A broken preview must not make the locally stored book unavailable.
    }
  }, [thumbnailProcessor])

  const hydrateBookImages = useCallback(async (storedBooks: CommunicationBook[]) => {
    const nextSources: Record<string, string> = {}
    for (const storedBook of storedBooks) {
      const storedImages = await dataRepository.getImagesForBook(storedBook.id)
      for (const [imageId, blob] of storedImages) {
        imageBlobsRef.current.set(imageId, blob)
        const url = createImageUrlRef.current(blob)
        createdImageUrlsRef.current.push(url)
        nextSources[imageId] = url
      }
      await refreshBookThumbnail(storedBook)
    }
    if (Object.keys(nextSources).length > 0) setImageSources((current) => ({ ...current, ...nextSources }))
  }, [dataRepository, refreshBookThumbnail])

  useEffect(() => {
    let active = true
    void dataRepository.listBooks()
      .then((storedBooks) => {
        if (active) {
          setBooks((current) => {
            const merged = new Map(storedBooks.map((book) => [book.id, book]))
            current.forEach((book) => merged.set(book.id, book))
            return [...merged.values()]
          })
          const requestedRoute = requestedBoardRouteRef.current
          const requestedBook = requestedRoute
            ? storedBooks.find((book) => book.id === requestedRoute.bookId)
            : undefined
          const requestedBoard = requestedBook?.boards.find(
            (candidate) => candidate.id === requestedRoute?.boardId,
          )
          if (requestedRoute && requestedBook && requestedBoard) {
            setOpenedBookId(requestedBook.id)
            setBoard(requestedBoard)
            setMode(requestedRoute.mode)
            setView('board')
          }
          void hydrateBookImages(storedBooks)
        }
      })
      .catch(() => {
        if (active) setDemoMessage('Nie udało się odczytać lokalnych ksiąg.')
      })
    return () => { active = false }
  }, [dataRepository, hydrateBookImages])

  useEffect(
    () => () => {
      createdImageUrlsRef.current.forEach((url) => URL.revokeObjectURL?.(url))
      thumbnailUrlsRef.current.forEach((url) => URL.revokeObjectURL?.(url))
      navigationTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      if (importToastTimerRef.current !== null) window.clearTimeout(importToastTimerRef.current)
      if (dwellCooldownTimerRef.current !== null) window.clearTimeout(dwellCooldownTimerRef.current)
      speechService.stop()
      autosaveRef.current.dispose()
    },
    [speechService],
  )

  useEffect(() => {
    function handleFullScreenChange() {
      const isAppFullScreen = document.fullscreenElement === appRef.current
      setIsChildFullScreen(isAppFullScreen)
      if (!isAppFullScreen) {
        setIsExitFullScreenDwelling(false)
        exitFullScreenDwellConsumedRef.current = false
      }
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    handleFullScreenChange()
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [])

  function openImagePicker() {
    if (isProcessingImage) return
    fileInputRef.current?.click()
  }

  function updateBoardEverywhere(updater: (current: typeof board) => typeof board) {
    const withValidCover = (candidate: typeof board) => {
      const hasCover = candidate.coverSymbolId
        ? candidate.symbols.some((symbol) => symbol.id === candidate.coverSymbolId)
        : false
      return {
        ...candidate,
        coverSymbolId: hasCover ? candidate.coverSymbolId : null,
      }
    }
    setBoard((current) => withValidCover(updater(current)))
    setBooks((current) => current.map((book) => {
      if (!book.boards.some((item) => item.id === board.id)) return book
      const boards = book.boards.map((item) => {
        if (item.id !== board.id) return item
        return withValidCover(updater(item))
      })
      const hasCoverSymbol = book.coverSymbolId
        ? boards.some((item) => item.symbols.some((symbol) => symbol.id === book.coverSymbolId))
        : false
      const updatedBook = {
        ...book,
        boards,
        coverSymbolId: hasCoverSymbol ? book.coverSymbolId : null,
        updatedAt: new Date().toISOString(),
      }
      scheduleBookSave(updatedBook)
      void refreshBookThumbnail(updatedBook)
      return updatedBook
    }))
  }

  function getBookImages(book: CommunicationBook): Map<string, Blob> {
    const imageIds = new Set(
      [
        ...(book.coverImage ? [book.coverImage.id] : []),
        ...book.boards.flatMap((item) => item.symbols.flatMap((symbol) => symbol.image ? [symbol.image.id] : [])),
      ],
    )
    return new Map(
      [...imageBlobsRef.current].filter(([imageId]) => imageIds.has(imageId)),
    )
  }

  function scheduleBookSave(book: CommunicationBook) {
    const revision = ++saveRevisionRef.current
    setSaveStatus('saving')
    autosaveRef.current.schedule(book.id, async () => {
      try {
        await dataRepository.saveBundles([{ book, images: getBookImages(book) }])
        if (revision === saveRevisionRef.current) setSaveStatus('saved')
      } catch (error) {
        if (revision === saveRevisionRef.current) setSaveStatus('error')
        throw error
      }
    })
  }

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImageError(null)
    setIsProcessingImage(true)

    try {
      const processedImage = await imageProcessor(file)
      const symbolId = crypto.randomUUID()
      const imageId = `${symbolId}-image`
      const previewUrl = createImageUrl(processedImage.blob)
      createdImageUrlsRef.current.push(previewUrl)
      imageBlobsRef.current.set(imageId, processedImage.blob)
      updateBoardEverywhere((current) => {
        const symbol = createSymbolForBoard(current, {
          id: symbolId,
          label: '',
          position: current.symbols.length,
          image: {
            id: imageId,
            mimeType: processedImage.mimeType,
            width: processedImage.width,
            height: processedImage.height,
          },
        })
        return { ...current, symbols: [...current.symbols, symbol] }
      })
      setImageSources((current) => ({ ...current, [imageId]: previewUrl }))
      setSelectedSymbolId(symbolId)
    } catch (error) {
      setImageError(
        error instanceof ImageProcessingError
          ? error.message
          : 'Nie udało się przetworzyć obrazu. Spróbuj ponownie.',
      )
    } finally {
      setIsProcessingImage(false)
    }
  }

  const selectedSymbol = board.symbols.find(
    (symbol) => symbol.id === selectedSymbolId,
  )

  function updateSelectedSymbol(changes: Partial<NonNullable<typeof selectedSymbol>>) {
    if (!selectedSymbolId) return
    updateBoardEverywhere((current) => ({
      ...current,
      symbols: current.symbols.map((symbol) =>
        symbol.id === selectedSymbolId
          ? { ...symbol, ...changes, updatedAt: new Date().toISOString() }
          : symbol,
      ),
    }))
  }

  function closeInspector() {
    const symbolId = selectedSymbolId
    setSelectedSymbolId(null)
    window.setTimeout(() => {
      if (symbolId) {
        document
          .querySelector<HTMLButtonElement>(`[data-symbol-id="${symbolId}"]`)
          ?.focus()
      }
    })
  }

  function deleteSelectedSymbol() {
    if (!selectedSymbolId) return
    const removed = board.symbols.find((symbol) => symbol.id === selectedSymbolId)
    if (removed?.image) {
      const imageUrl = imageSources[removed.image.id]
      if (imageUrl) URL.revokeObjectURL?.(imageUrl)
      setImageSources((current) => {
        const next = { ...current }
        delete next[removed.image!.id]
        return next
      })
      imageBlobsRef.current.delete(removed.image.id)
    }
    updateBoardEverywhere((current) => ({
      ...current,
      symbols: current.symbols.filter((symbol) => symbol.id !== selectedSymbolId),
    }))
    setSelectedSymbolId(null)
  }

  function speakSymbolText(text: string) {
    const message = text.trim()
    if (!message) return
    const result = speechService.speak(message)
    if (result === 'spoken') setLastSpokenText(message)
    if ((result === 'unsupported' || result === 'error') && !speechWarningShownRef.current) {
      speechWarningShownRef.current = true
      setDemoMessage(
        result === 'unsupported'
          ? 'Ta przeglądarka nie obsługuje syntezy mowy. Symbole nadal działają wizualnie.'
          : 'Nie udało się odczytać komunikatu. Symbol nadal działa wizualnie.',
      )
    }
  }

  function enterChildFullScreen() {
    const requestFullScreen = appRef.current?.requestFullscreen
    if (requestFullScreen) {
      void requestFullScreen.call(appRef.current).catch(() => undefined)
    }
  }

  function exitFullScreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
    }
  }

  function activateFullScreenExit() {
    exitFullScreenDwellConsumedRef.current = true
    setIsExitFullScreenDwelling(false)
    exitFullScreen()
  }

  function pauseDwellAfterNavigation() {
    if (dwellCooldownTimerRef.current !== null) {
      window.clearTimeout(dwellCooldownTimerRef.current)
    }
    setIsDwellReady(false)
    dwellCooldownTimerRef.current = window.setTimeout(() => {
      setIsDwellReady(true)
      dwellCooldownTimerRef.current = null
    }, 500)
  }

  function activateSymbol(symbol: SymbolModel) {
    speakSymbolText(symbol.label)
    if (!symbol.linkedBoardId) return
    const timer = window.setTimeout(() => {
      const targetBook = visibleBooks.find((book) =>
        book.boards.some((candidate) => candidate.id === symbol.linkedBoardId),
      )
      const targetBoard = targetBook?.boards.find((candidate) => candidate.id === symbol.linkedBoardId)
      const demoTarget = demoBoards.find((candidate) => candidate.id === symbol.linkedBoardId)
      if (targetBook && targetBoard && symbol.linkedBoardId) {
        pauseDwellAfterNavigation()
        onNavigateToBoard?.(symbol.linkedBoardId)
        setBoardHistory((current) => [...current, {
          bookId: openedBookId ?? board.communicationBookId,
          boardId: board.id,
        }])
        setOpenedBookId(targetBook.id)
        setBoard(targetBoard)
      } else if (demoTarget && symbol.linkedBoardId) {
        onNavigateToBoard?.(symbol.linkedBoardId)
        setDemoMessage(`Demonstracyjne przejście do tablicy: ${demoTarget.name.trim() || 'Tablica bez tytułu'}.`)
      } else {
        setDemoMessage('Połączona tablica jest niedostępna.')
      }
    }, 500)
    navigationTimersRef.current.push(timer)
  }

  const visibleBooks = books
  const openedBook = visibleBooks.find((book) => book.id === openedBookId)
  const fullScreenExitDwellTime = openedBook?.boards.find(
    (candidate) => candidate.id === openedBook.mainBoardId,
  )?.defaultDwellTime ?? 1500

  function openBook(bookId: string) {
    pauseDwellAfterNavigation()
    setOpenedBookId(bookId)
    setView('book')
  }

  function selectBookForUse(bookId: string) {
    const selectedBook = visibleBooks.find((candidate) => candidate.id === bookId)
    if (!selectedBook) return
    speakSymbolText(selectedBook.name.trim() || 'Księga bez tytułu')
    openBook(bookId)
  }

  async function createBook(name: string, coverFile: File | null) {
    const bookId = crypto.randomUUID()
    let coverImage: CommunicationBook['coverImage'] = null
    const images = new Map<string, Blob>()

    if (coverFile) {
      const processedImage = await imageProcessor(coverFile)
      const imageId = `${bookId}-cover-image`
      coverImage = {
        id: imageId,
        mimeType: processedImage.mimeType,
        width: processedImage.width,
        height: processedImage.height,
        rotation: 0,
        scale: 1,
      }
      images.set(imageId, processedImage.blob)
    }

    const book = createCommunicationBook({
      id: bookId,
      name,
      coverImage,
      createdAt: new Date().toISOString(),
    })

    try {
      await autosaveRef.current.track(dataRepository.saveBundles([{ book, images }]))
    } catch {
      throw new Error('Nie udało się zapisać nowej księgi lokalnie.')
    }

    images.forEach((blob, imageId) => imageBlobsRef.current.set(imageId, blob))
    setBooks((current) => [book, ...current])
    void refreshBookThumbnail(book)
    setOpenedBookId(book.id)
    setView('book')
  }

  async function openBoardInBook(targetBoard: typeof board, targetMode: BoardMode = 'use') {
    pauseDwellAfterNavigation()
    const storedImages = await dataRepository.getImagesForBook(targetBoard.communicationBookId)
    const nextSources: Record<string, string> = {}
    for (const [imageId, blob] of storedImages) {
      imageBlobsRef.current.set(imageId, blob)
      if (!imageSources[imageId]) {
        const url = createImageUrl(blob)
        createdImageUrlsRef.current.push(url)
        nextSources[imageId] = url
      }
    }
    if (Object.keys(nextSources).length > 0) setImageSources((current) => ({ ...current, ...nextSources }))
    setBoardHistory([])
    setBoard(targetBoard)
    setMode(targetMode)
    setView('board')
  }

  function selectBoardForUse(targetBoard: typeof board) {
    speakSymbolText(targetBoard.name.trim() || 'Tablica bez tytułu')
    void openBoardInBook(targetBoard, 'use')
  }

  async function saveCreatedBoardAndOpen(
    updatedBook: CommunicationBook,
    createdBoardId: string,
    openedTab: OpenedBoardTab | null,
  ) {
    const revision = ++saveRevisionRef.current
    setSaveStatus('saving')
    try {
      await autosaveRef.current.flush()
      await autosaveRef.current.track(
        dataRepository.saveBundles([{ book: updatedBook, images: getBookImages(updatedBook) }]),
      )
      if (revision === saveRevisionRef.current) setSaveStatus('saved')
      if (openedTab) {
        openedTab.navigate(createBoardUrl(updatedBook.id, createdBoardId))
      } else {
        setDemoMessage('Tablica została utworzona, ale przeglądarka zablokowała nową kartę.')
      }
    } catch {
      openedTab?.close()
      if (revision === saveRevisionRef.current) setSaveStatus('error')
      setDemoMessage('Nie udało się zapisać nowej tablicy lokalnie.')
    }
  }

  function createBoardInBook(book: CommunicationBook) {
    const openedTab = openBoardTab()
    const nextBoard = createBoard({
      id: crypto.randomUUID(),
      communicationBookId: book.id,
      name: '',
      createdAt: new Date().toISOString(),
    })
    setBooks((current) => current.map((item) =>
      item.id === book.id
        ? { ...item, boards: [...item.boards, nextBoard], mainBoardId: item.mainBoardId ?? nextBoard.id, updatedAt: new Date().toISOString() }
        : item,
    ))
    const updatedBook = { ...book, boards: [...book.boards, nextBoard], mainBoardId: book.mainBoardId ?? nextBoard.id, updatedAt: new Date().toISOString() }
    void saveCreatedBoardAndOpen(updatedBook, nextBoard.id, openedTab)
  }

  function createLinkedBoard(name: string) {
    if (!openedBook || !selectedSymbolId) return
    const openedTab = openBoardTab()
    const nextBoard = createBoard({
      id: crypto.randomUUID(),
      communicationBookId: openedBook.id,
      name,
      createdAt: new Date().toISOString(),
    })
    const now = new Date().toISOString()
    const updatedCurrentBoard = {
      ...board,
      symbols: board.symbols.map((symbol) => symbol.id === selectedSymbolId
        ? { ...symbol, linkedBoardId: nextBoard.id, updatedAt: now }
        : symbol),
      updatedAt: now,
    }
    const updatedBook = {
      ...openedBook,
      boards: [
        ...openedBook.boards.map((candidate) => candidate.id === board.id ? updatedCurrentBoard : candidate),
        nextBoard,
      ],
      mainBoardId: openedBook.mainBoardId ?? nextBoard.id,
      updatedAt: now,
    }
    setBoard(updatedCurrentBoard)
    setBooks((current) => current.map((book) => book.id === openedBook.id ? updatedBook : book))
    void saveCreatedBoardAndOpen(updatedBook, nextBoard.id, openedTab)
  }

  function goBackFromBoard() {
    const previousLocation = boardHistory.at(-1)
    if (mode === 'use' && previousLocation) {
      const previousBook = visibleBooks.find((candidate) => candidate.id === previousLocation.bookId)
      const previousBoard = previousBook?.boards.find((candidate) => candidate.id === previousLocation.boardId)
      if (previousBook && previousBoard) {
        pauseDwellAfterNavigation()
        setBoardHistory((current) => current.slice(0, -1))
        setOpenedBookId(previousBook.id)
        setBoard(previousBoard)
        return
      }
    }
    pauseDwellAfterNavigation()
    setView(openedBookId ? 'book' : 'home')
  }

  function renameBook(bookId: string, name: string, coverSymbolId: string | null) {
    setBooks((current) => current.map((book) => {
      if (book.id !== bookId) return book
      const updatedBook = { ...book, name, coverSymbolId, updatedAt: new Date().toISOString() }
      scheduleBookSave(updatedBook)
      void refreshBookThumbnail(updatedBook)
      return updatedBook
    }))
  }

  async function deleteBook(bookId: string) {
    try {
      await autosaveRef.current.flush()
      await autosaveRef.current.track(dataRepository.deleteBooks([bookId]))
      const deletedBook = visibleBooks.find((book) => book.id === bookId)
      if (deletedBook?.coverImage) {
        imageBlobsRef.current.delete(deletedBook.coverImage.id)
      }
      deletedBook?.boards.forEach((deletedBoard) => deletedBoard.symbols.forEach((symbol) => {
        if (!symbol.image) return
        const imageUrl = imageSources[symbol.image.id]
        if (imageUrl) URL.revokeObjectURL?.(imageUrl)
        imageBlobsRef.current.delete(symbol.image.id)
      }))
      setImageSources((current) => {
        const next = { ...current }
        if (deletedBook?.coverImage) delete next[deletedBook.coverImage.id]
        deletedBook?.boards.forEach((deletedBoard) => deletedBoard.symbols.forEach((symbol) => {
          if (symbol.image) delete next[symbol.image.id]
        }))
        return next
      })
      const thumbnailUrl = thumbnailUrlsRef.current.get(bookId)
      if (thumbnailUrl) URL.revokeObjectURL?.(thumbnailUrl)
      thumbnailUrlsRef.current.delete(bookId)
      thumbnailImageIdsRef.current.delete(bookId)
      setThumbnailSources((current) => {
        const next = { ...current }
        delete next[bookId]
        return next
      })
      setBooks((current) => current.filter((book) => book.id !== bookId))
    } catch {
      setTransferNotice({ type: 'error', message: 'Nie udało się usunąć księgi.' })
    }
  }

  function goToMainBoard() {
    if (!openedBook?.mainBoardId) return
    const main = openedBook.boards.find((candidate) => candidate.id === openedBook.mainBoardId)
    if (main) {
      pauseDwellAfterNavigation()
      setBoard(main)
    }
  }

  async function loadDemoData() {
    setDemoMessage('Ładowanie syntetycznych danych demo…')
    try {
      const { seedDemoBooks } = await import('./demo/communicationBookFixtures')
      const seededBooks = await seedDemoBooks(dataRepository)
      setBooks(seededBooks)
      await hydrateBookImages(seededBooks)
      setDemoMessage('Dane demo zostały załadowane.')
    } catch {
      setDemoMessage('Nie udało się załadować danych demo.')
    }
  }

  async function clearDemoData() {
    try {
      const { removeDemoBooks } = await import('./demo/communicationBookFixtures')
      setBooks(await removeDemoBooks(dataRepository))
      setDemoMessage('Oryginalne dane demo zostały usunięte.')
    } catch {
      setDemoMessage('Nie udało się usunąć danych demo.')
    }
  }

  async function importBook(file: File) {
    setTransferNotice({ type: 'status', message: 'Sprawdzanie pliku…' })
    try {
      const imported = await importBookBackup(file, visibleBooks, undefined, imageBlobsRef.current.keys())
      setTransferNotice({ type: 'status', message: 'Importowanie księgi…' })

      const nextSources: Record<string, string> = {}
      const nextUrls: string[] = []
      try {
        for (const [imageId, blob] of imported.images) {
          const url = createImageUrl(blob)
          nextUrls.push(url)
          nextSources[imageId] = url
        }
      } catch {
        nextUrls.forEach((url) => URL.revokeObjectURL?.(url))
        throw new Error('image-preview')
      }

      await autosaveRef.current.track(
        dataRepository.saveBundles([{ book: imported.book, images: imported.images }]),
      )
      for (const [imageId, blob] of imported.images) imageBlobsRef.current.set(imageId, blob)
      createdImageUrlsRef.current.push(...nextUrls)
      setImageSources((current) => ({ ...current, ...nextSources }))
      setBooks((current) => [imported.book, ...current])
      void refreshBookThumbnail(imported.book)
      setTransferNotice({ type: 'success', message: 'Księga została zaimportowana' })
      if (importToastTimerRef.current !== null) window.clearTimeout(importToastTimerRef.current)
      importToastTimerRef.current = window.setTimeout(() => {
        setTransferNotice((current) => current?.type === 'success' ? null : current)
        importToastTimerRef.current = null
      }, 4000)
    } catch (error) {
      setTransferNotice({
        type: 'error',
        message: error instanceof BookTransferError
          ? error.userMessage
          : 'Nie udało się zaimportować księgi. Lokalne dane nie zostały zmienione.',
      })
    }
  }

  async function exportBook(bookId: string) {
    const book = visibleBooks.find((candidate) => candidate.id === bookId)
    if (!book) {
      setTransferNotice({ type: 'error', message: 'Nie znaleziono księgi do eksportu.' })
      return
    }
    setTransferNotice({ type: 'status', message: 'Przygotowywanie kopii…' })
    try {
      const storedImages = await dataRepository.getImagesForBook(book.id)
      const images = new Map([...storedImages, ...getBookImages(book)])
      const blob = await createBookBackup(book, images)
      downloadBackup(blob, createSafeBackupFileName(book.name))
      setTransferNotice({ type: 'success', message: 'Kopia księgi jest gotowa do zapisania.' })
    } catch (error) {
      setTransferNotice({
        type: 'error',
        message: error instanceof BookTransferError
          ? error.userMessage
          : 'Nie udało się wyeksportować księgi.',
      })
    }
  }

  const inspectorBoards = openedBookId
    ? visibleBooks.flatMap((book) => book.boards.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        bookName: book.name,
      })))
    : demoBoards.map((candidate) => ({ ...candidate, bookName: 'Podgląd developerski' }))

  return (
    <div ref={appRef} className={`demo${isChildFullScreen ? ' demo--child-fullscreen' : ''}`}>
      <PwaStatus flushPendingWrites={() => autosaveRef.current.flush()} />
      {isChildFullScreen && view !== 'board' && (
        <button
          type="button"
          className="demo__exit-fullscreen"
          aria-label="Zamknij pełnoekranowy tryb dziecka"
          style={{ '--exit-fullscreen-dwell-duration': `${fullScreenExitDwellTime}ms` } as CSSProperties}
          onClick={activateFullScreenExit}
          onPointerEnter={() => {
            if (dwellEnabled && isDwellReady && !exitFullScreenDwellConsumedRef.current) {
              setIsExitFullScreenDwelling(true)
            }
          }}
          onPointerLeave={() => {
            setIsExitFullScreenDwelling(false)
            exitFullScreenDwellConsumedRef.current = false
          }}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={24} strokeWidth={2} aria-hidden="true" />
          {isExitFullScreenDwelling && (
            <span
              className="demo__exit-fullscreen-dwell-progress"
              aria-hidden="true"
              onAnimationEnd={() => {
                if (!exitFullScreenDwellConsumedRef.current) activateFullScreenExit()
              }}
            />
          )}
        </button>
      )}
      {import.meta.env.DEV && <aside className="demo__toolbar" aria-label="Sterowanie demonstracją">
        <p className="demo__label">Podgląd developerski</p>
        <button type="button" onClick={() => {
          pauseDwellAfterNavigation()
          setView('home')
        }}>
          <HugeiconsIcon icon={Home01Icon} size={17} strokeWidth={1.8} aria-hidden="true" />
          Home
        </button>
        <button type="button" onClick={() => {
          pauseDwellAfterNavigation()
          setOpenedBookId(null)
          setBoard(demoBoard)
          setView('board')
        }}>
          <HugeiconsIcon icon={GridViewIcon} size={17} strokeWidth={1.8} aria-hidden="true" />
          Demo Board
        </button>
        {view === 'home' && (
          <div className="demo__data-actions">
            <button type="button" onClick={() => void loadDemoData()}>
              <HugeiconsIcon icon={DatabaseAddIcon} size={17} strokeWidth={1.8} aria-hidden="true" />
              Załaduj dane demo
            </button>
            <button type="button" onClick={() => void clearDemoData()}>
              <HugeiconsIcon icon={Delete02Icon} size={17} strokeWidth={1.8} aria-hidden="true" />
              Usuń dane demo
            </button>
          </div>
        )}
        {view === 'board' && <>
        <fieldset>
          <legend>Tryb demonstracji</legend>
          <label>
            <input
              type="radio"
              name="demo-mode"
              value="edit"
              checked={mode === 'edit'}
              onChange={() => setMode('edit')}
            />
            Edit
          </label>
          <label>
            <input
              type="radio"
              name="demo-mode"
              value="use"
              checked={mode === 'use'}
              onChange={() => setMode('use')}
            />
            Use
          </label>
        </fieldset>

        {mode === 'edit' && (
          <label className="demo__status-control">
            Stan zapisu
            <SelectControl
              value={saveStatus}
              onChange={(event) =>
                setSaveStatus(event.target.value as SaveStatus)
              }
            >
              <option value="saved">Saved</option>
              <option value="saving">Saving</option>
              <option value="error">Error</option>
            </SelectControl>
          </label>
        )}
        {mode === 'use' && (
          <label>
            <input
              type="checkbox"
              checked={dwellEnabled}
              onChange={(event) => setDwellEnabled(event.target.checked)}
            />
            Sterowanie wzrokiem (dwell)
          </label>
        )}
        </>}
      </aside>}

      {view === 'home' && (
        <Home
          books={visibleBooks}
          onCreateBook={createBook}
          onOpenBook={selectBookForUse}
          onManageBook={openBook}
          onRenameBook={renameBook}
          onDeleteBook={deleteBook}
          onImportBook={importBook}
          onExportBook={exportBook}
          thumbnailSources={thumbnailSources}
          dwellEnabled={dwellEnabled && isDwellReady}
          isChildFullScreen={isChildFullScreen}
          onStartChildFullScreen={enterChildFullScreen}
          transferNotice={transferNotice}
        />
      )}

      {view === 'book' && openedBook && (
        <main className="book-view">
          <header className="book-view__header">
            <button className="book-view__back" type="button" aria-label="← Wróć do strony głównej" onClick={() => {
              pauseDwellAfterNavigation()
              setView('home')
            }}>
              <HugeiconsIcon icon={ArrowLeft02Icon} size={18} strokeWidth={2} aria-hidden="true" />
              Wróć do strony głównej
            </button>
            <div className="book-view__heading">
              <span className="book-view__icon" aria-hidden="true">
                <HugeiconsIcon icon={GridViewIcon} size={24} strokeWidth={1.7} />
              </span>
              <div>
                <p>Księga AAC</p>
                <h1>{openedBook.name.trim() || 'Księga bez tytułu'}</h1>
                <span>{openedBook.boards.length} {openedBook.boards.length === 1 ? 'tablica' : 'tablice'}</span>
              </div>
            </div>
            <button className="book-view__primary" type="button" aria-label="+ Dodaj tablicę" onClick={() => createBoardInBook(openedBook)}>
              <HugeiconsIcon icon={Add01Icon} size={19} strokeWidth={2} aria-hidden="true" />
              Dodaj tablicę
            </button>
          </header>
          <section className="book-view__content" aria-labelledby="boards-title">
            <h2 id="boards-title">Tablice w księdze</h2>
            {openedBook.boards.length > 0 ? (
              <ul>{openedBook.boards.map((item) => (
                <li key={item.id}>
                  <CommunicationBoardCard
                    board={item}
                    imageSource={(() => {
                      const imageId = findBoardCoverImageId(item, new Set(Object.keys(imageSources)))
                      return imageId ? imageSources[imageId] : undefined
                    })()}
                    isMainBoard={item.id === openedBook.mainBoardId}
                    dwellEnabled={dwellEnabled && isDwellReady}
                    onSelect={() => selectBoardForUse(item)}
                  />
                </li>
              ))}</ul>
            ) : (
              <div className="book-view__empty">
                <span aria-hidden="true"><HugeiconsIcon icon={GridViewIcon} size={28} strokeWidth={1.5} /></span>
                <p>Ta księga nie ma jeszcze tablic.</p>
              </div>
            )}
          </section>
        </main>
      )}

      {view === 'board' && <Board
        board={board}
        mode={mode}
        saveStatus={saveStatus}
        onNameChange={(name) => updateBoardEverywhere((current) => ({ ...current, name }))}
        onBack={openedBookId ? goBackFromBoard : undefined}
        backLabel={mode === 'use' && boardHistory.length > 0 ? 'Wróć' : openedBookId ? 'Wróć do księgi' : 'Strona główna'}
        onGoToMain={openedBook?.mainBoardId !== board.id ? goToMainBoard : undefined}
        onStartUse={() => setMode('use')}
        onStartEdit={() => setMode('edit')}
        onAddSymbol={openImagePicker}
        onSettingsChange={(changes) => updateBoardEverywhere((current) => ({ ...current, ...changes, updatedAt: new Date().toISOString() }))}
        canRepeat={lastSpokenText !== null}
        onRepeat={() => lastSpokenText && speakSymbolText(lastSpokenText)}
        dwellEnabled={mode === 'use' && dwellEnabled && isDwellReady}
      >
        {[...board.symbols]
          .sort((first, second) => first.position - second.position)
          .map((symbol) => (
            <SymbolTile
              key={symbol.id}
              symbol={symbol}
              imageSource={
                symbol.image ? imageSources[symbol.image.id] : undefined
              }
              mode={mode}
              selected={mode === 'edit' && selectedSymbolId === symbol.id}
              onSelect={setSelectedSymbolId}
              onActivate={activateSymbol}
              dwellEnabled={mode === 'use' && dwellEnabled && isDwellReady}
              dwellTime={getEffectiveDwellTime(symbol, board)}
            />
          ))}
      </Board>}

      {view === 'board' && mode === 'edit' && selectedSymbol && (
        <SymbolInspector
          symbol={selectedSymbol}
          currentBoardId={board.id}
          boards={inspectorBoards}
          onChange={updateSelectedSymbol}
          onClose={closeInspector}
          onDelete={deleteSelectedSymbol}
          onCreateLinkedBoard={openedBook ? createLinkedBoard : undefined}
        />
      )}

      {view === 'board' && <input
        ref={fileInputRef}
        className="demo__file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Wybierz obraz symbolu"
        tabIndex={-1}
        onChange={handleImageSelected}
      />}
      {isProcessingImage && (
        <p className="demo__image-status" role="status" aria-live="polite">
          Przetwarzanie obrazu…
        </p>
      )}
      {imageError && (
        <p className="demo__image-error" role="alert">
          {imageError}
        </p>
      )}
      {demoMessage && (
        <p className="demo__image-status" role="status">
          {demoMessage}
        </p>
      )}
    </div>
  )
}
