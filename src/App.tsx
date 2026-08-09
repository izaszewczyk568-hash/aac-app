import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Board, type BoardMode, type SaveStatus } from './components/Board/Board'
import { SymbolTile } from './components/SymbolTile/SymbolTile'
import { SymbolInspector } from './components/SymbolInspector/SymbolInspector'
import { Home } from './components/Home/Home'
import { createBoard, createCommunicationBook, createSymbolForBoard, getEffectiveDwellTime, type CommunicationBook, type Symbol as SymbolModel } from './domain/communicationBook'
import {
  ImageProcessingError,
  processImageFile,
  type ProcessedImage,
} from './features/images/processImage'
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

export interface AppProps {
  imageProcessor?: (file: File) => Promise<ProcessedImage>
  createImageUrl?: (blob: Blob) => string
  speechService?: SpeechService
  onNavigateToBoard?: (boardId: string) => void
  initialView?: 'home' | 'board'
  repository?: CommunicationBookRepository
}

export function App({
  imageProcessor = processImageFile,
  createImageUrl = (blob) => URL.createObjectURL(blob),
  speechService = browserSpeechService,
  onNavigateToBoard,
  initialView = 'board',
  repository,
}: AppProps = {}) {
  const [view, setView] = useState<'home' | 'book' | 'board'>(initialView)
  const [books, setBooks] = useState<CommunicationBook[]>([])
  const [openedBookId, setOpenedBookId] = useState<string | null>(null)
  const [boardHistory, setBoardHistory] = useState<string[]>([])
  const [mode, setMode] = useState<BoardMode>('edit')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [board, setBoard] = useState(demoBoard)
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null)
  const [imageSources, setImageSources] = useState<Record<string, string>>({})
  const [imageError, setImageError] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [demoMessage, setDemoMessage] = useState<string | null>(null)
  const [transferNotice, setTransferNotice] = useState<{
    type: 'status' | 'success' | 'error'
    message: string
  } | null>(null)
  const [dwellEnabled, setDwellEnabled] = useState(true)
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null)
  const speechWarningShownRef = useRef(false)
  const navigationTimersRef = useRef<number[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createdImageUrlsRef = useRef<string[]>([])
  const imageBlobsRef = useRef(new Map<string, Blob>())
  const repositoryRef = useRef(repository ?? createCommunicationBookRepository())
  const autosaveRef = useRef(new AutosaveCoordinator())
  const saveRevisionRef = useRef(0)
  const dataRepository = repositoryRef.current
  const createImageUrlRef = useRef(createImageUrl)

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
    }
    if (Object.keys(nextSources).length > 0) setImageSources((current) => ({ ...current, ...nextSources }))
  }, [dataRepository])

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
          void hydrateBookImages(storedBooks)
        }
      })
      .catch(() => {
        if (active) setDemoMessage('Nie udało się odczytać lokalnych książek.')
      })
    return () => { active = false }
  }, [dataRepository, hydrateBookImages])

  useEffect(
    () => () => {
      createdImageUrlsRef.current.forEach((url) => URL.revokeObjectURL?.(url))
      navigationTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      speechService.stop()
      autosaveRef.current.dispose()
    },
    [speechService],
  )

  function openImagePicker() {
    if (isProcessingImage) return
    fileInputRef.current?.click()
  }

  function updateBoardEverywhere(updater: (current: typeof board) => typeof board) {
    setBoard(updater)
    setBooks((current) => current.map((book) => {
      if (!book.boards.some((item) => item.id === board.id)) return book
      const updatedBook = {
        ...book,
        boards: book.boards.map((item) => item.id === board.id ? updater(item) : item),
        updatedAt: new Date().toISOString(),
      }
      scheduleBookSave(updatedBook)
      return updatedBook
    }))
  }

  function getBookImages(book: CommunicationBook): Map<string, Blob> {
    const imageIds = new Set(
      book.boards.flatMap((item) => item.symbols.flatMap((symbol) => symbol.image ? [symbol.image.id] : [])),
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

  function activateSymbol(symbol: SymbolModel) {
    speakSymbolText(symbol.label)
    if (!symbol.linkedBoardId) return
    const timer = window.setTimeout(() => {
      const targetBoard = openedBook?.boards.find((candidate) => candidate.id === symbol.linkedBoardId)
      const demoTarget = demoBoards.find((candidate) => candidate.id === symbol.linkedBoardId)
      if (targetBoard && symbol.linkedBoardId) {
        onNavigateToBoard?.(symbol.linkedBoardId)
        setBoardHistory((current) => [...current, board.id])
        setBoard(targetBoard)
      } else if (demoTarget && symbol.linkedBoardId) {
        onNavigateToBoard?.(symbol.linkedBoardId)
        setDemoMessage(`Demonstracyjne przejście do tablicy: ${demoTarget.name.trim() || 'Tablica bez tytułu'}.`)
      } else {
        setDemoMessage('Powiązana tablica nie istnieje w książce.')
      }
    }, 500)
    navigationTimersRef.current.push(timer)
  }

  const visibleBooks = books
  const openedBook = visibleBooks.find((book) => book.id === openedBookId)

  function openBook(bookId: string) {
    setOpenedBookId(bookId)
    setView('book')
  }

  function createBook(name: string) {
    const book = createCommunicationBook({
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    })
    setBooks((current) => [book, ...current])
    void autosaveRef.current
      .track(dataRepository.saveBundles([{ book, images: new Map() }]))
      .catch(() => setDemoMessage('Nie udało się zapisać nowej książki lokalnie.'))
    setOpenedBookId(book.id)
    setView('book')
  }

  async function openBoardInBook(targetBoard: typeof board) {
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
    setView('board')
  }

  function createBoardInBook(book: CommunicationBook) {
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
    scheduleBookSave(updatedBook)
    void openBoardInBook(nextBoard)
  }

  function goBackFromBoard() {
    const previousId = boardHistory.at(-1)
    if (mode === 'use' && previousId && openedBook) {
      const previous = openedBook.boards.find((candidate) => candidate.id === previousId)
      if (previous) {
        setBoardHistory((current) => current.slice(0, -1))
        setBoard(previous)
        return
      }
    }
    setView(openedBookId ? 'book' : 'home')
  }

  function goToMainBoard() {
    if (!openedBook?.mainBoardId) return
    const main = openedBook.boards.find((candidate) => candidate.id === openedBook.mainBoardId)
    if (main) {
      setBoardHistory([])
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
      setTransferNotice({ type: 'status', message: 'Importowanie książki…' })

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
      setTransferNotice({ type: 'success', message: 'Książka została zaimportowana.' })
    } catch (error) {
      setTransferNotice({
        type: 'error',
        message: error instanceof BookTransferError
          ? error.userMessage
          : 'Nie udało się zaimportować książki. Lokalne dane nie zostały zmienione.',
      })
    }
  }

  async function exportBook(bookId: string) {
    const book = visibleBooks.find((candidate) => candidate.id === bookId)
    if (!book) {
      setTransferNotice({ type: 'error', message: 'Nie znaleziono książki do eksportu.' })
      return
    }
    setTransferNotice({ type: 'status', message: 'Przygotowywanie kopii…' })
    try {
      const storedImages = await dataRepository.getImagesForBook(book.id)
      const images = new Map([...storedImages, ...imageBlobsRef.current])
      const blob = await createBookBackup(book, images)
      downloadBackup(blob, createSafeBackupFileName(book.name))
      setTransferNotice({ type: 'success', message: 'Kopia książki jest gotowa do zapisania.' })
    } catch (error) {
      setTransferNotice({
        type: 'error',
        message: error instanceof BookTransferError
          ? error.userMessage
          : 'Nie udało się wyeksportować książki.',
      })
    }
  }

  return (
    <div className="demo">
      <PwaStatus flushPendingWrites={() => autosaveRef.current.flush()} />
      {import.meta.env.DEV && <aside className="demo__toolbar" aria-label="Sterowanie demonstracją">
        <p className="demo__label">Podgląd developerski</p>
        <button type="button" onClick={() => setView('home')}>Home</button>
        <button type="button" onClick={() => {
          setOpenedBookId(null)
          setBoard(demoBoard)
          setView('board')
        }}>Demo Board</button>
        {view === 'home' && (
          <div className="demo__data-actions">
            <button type="button" onClick={() => void loadDemoData()}>Załaduj dane demo</button>
            <button type="button" onClick={() => void clearDemoData()}>Usuń dane demo</button>
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
            <select
              value={saveStatus}
              onChange={(event) =>
                setSaveStatus(event.target.value as SaveStatus)
              }
            >
              <option value="saved">Saved</option>
              <option value="saving">Saving</option>
              <option value="error">Error</option>
            </select>
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
          onOpenBook={openBook}
          onImportBook={importBook}
          onExportBook={exportBook}
          imageSources={imageSources}
          transferNotice={transferNotice}
        />
      )}

      {view === 'book' && openedBook && (
        <main className="book-view">
          <button type="button" onClick={() => setView('home')}>← Wróć do strony głównej</button>
          <h1>{openedBook.name.trim() || 'Książka bez tytułu'}</h1>
          <p>{openedBook.boards.length} {openedBook.boards.length === 1 ? 'tablica' : 'tablice'}</p>
          {openedBook.boards.length > 0 ? (
            <ul>{openedBook.boards.map((item) => <li key={item.id}><button type="button" onClick={() => void openBoardInBook(item)}>{item.name.trim() || 'Tablica bez tytułu'}</button></li>)}</ul>
          ) : (
            <>
              <p>Ta książka nie ma jeszcze tablic.</p>
              <button type="button" onClick={() => createBoardInBook(openedBook)}>+ Utwórz pierwszą tablicę</button>
            </>
          )}
        </main>
      )}

      {view === 'board' && <Board
        board={board}
        mode={mode}
        saveStatus={saveStatus}
        onNameChange={(name) => updateBoardEverywhere((current) => ({ ...current, name }))}
        onBack={openedBookId ? goBackFromBoard : undefined}
        backLabel={mode === 'use' && boardHistory.length > 0 ? 'Wróć' : openedBookId ? 'Wróć do książki' : 'Strona główna'}
        onGoToMain={openedBook?.mainBoardId !== board.id ? goToMainBoard : undefined}
        onStartUse={() => setMode('use')}
        onAddSymbol={openImagePicker}
        onSettingsChange={(changes) => updateBoardEverywhere((current) => ({ ...current, ...changes, updatedAt: new Date().toISOString() }))}
        canRepeat={lastSpokenText !== null}
        onRepeat={() => lastSpokenText && speakSymbolText(lastSpokenText)}
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
              dwellEnabled={mode === 'use' && dwellEnabled}
              dwellTime={getEffectiveDwellTime(symbol, board)}
            />
          ))}
      </Board>}

      {view === 'board' && mode === 'edit' && selectedSymbol && (
        <SymbolInspector
          symbol={selectedSymbol}
          currentBoardId={board.id}
          boards={demoBoards}
          onChange={updateSelectedSymbol}
          onClose={closeInspector}
          onDelete={deleteSelectedSymbol}
          onCreateLinkedBoard={() =>
            setDemoMessage('Wywołano akcję tworzenia nowej tablicy.')
          }
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
