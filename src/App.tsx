import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Board, type BoardMode, type SaveStatus } from './components/Board/Board'
import { SymbolTile } from './components/SymbolTile/SymbolTile'
import { SymbolInspector } from './components/SymbolInspector/SymbolInspector'
import { createBoard, createSymbol } from './domain/communicationBook'
import {
  ImageProcessingError,
  processImageFile,
  type ProcessedImage,
} from './features/images/processImage'

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
}

export function App({
  imageProcessor = processImageFile,
  createImageUrl = (blob) => URL.createObjectURL(blob),
}: AppProps = {}) {
  const [mode, setMode] = useState<BoardMode>('edit')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [board, setBoard] = useState(demoBoard)
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null)
  const [imageSources, setImageSources] = useState<Record<string, string>>({})
  const [imageError, setImageError] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [demoMessage, setDemoMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createdImageUrlsRef = useRef<string[]>([])

  useEffect(
    () => () => {
      createdImageUrlsRef.current.forEach((url) => URL.revokeObjectURL?.(url))
    },
    [],
  )

  function openImagePicker() {
    if (isProcessingImage) return
    fileInputRef.current?.click()
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
      setBoard((current) => {
        const symbol = createSymbol({
          id: symbolId,
          boardId: current.id,
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
    setBoard((current) => ({
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
    }
    setBoard((current) => ({
      ...current,
      symbols: current.symbols.filter((symbol) => symbol.id !== selectedSymbolId),
    }))
    setSelectedSymbolId(null)
  }

  return (
    <div className="demo">
      <aside className="demo__toolbar" aria-label="Sterowanie demonstracją">
        <p className="demo__label">Podgląd developerski Board</p>
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
      </aside>

      <Board
        board={board}
        mode={mode}
        saveStatus={saveStatus}
        onNameChange={(name) => setBoard((current) => ({ ...current, name }))}
        onStartUse={() => setMode('use')}
        onAddSymbol={openImagePicker}
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
            />
          ))}
      </Board>

      {mode === 'edit' && selectedSymbol && (
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

      <input
        ref={fileInputRef}
        className="demo__file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Wybierz obraz symbolu"
        tabIndex={-1}
        onChange={handleImageSelected}
      />
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
