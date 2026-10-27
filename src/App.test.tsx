import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { ImageProcessingError } from './features/images/processImage'
import type { SpeechService } from './features/speech/speechService'
import { MemoryCommunicationBookRepository } from './data/communicationBookRepository'
import { createDemoBookBundles } from './demo/communicationBookFixtures'
import { createBoard, createCommunicationBook, createSymbol } from './domain/communicationBook'
import { AAC_BOOK_MIME_TYPE, createBookBackup } from './features/bookTransfer/bookTransfer'
import type { OpenedBoardTab } from './App'

const processedImage = {
  blob: new Blob(['optimized'], { type: 'image/webp' }),
  width: 512,
  height: 256,
  mimeType: 'image/webp',
}

function selectImage(fileName = 'symbol.png') {
  const input = screen.getByLabelText('Wybierz obraz symbolu')
  fireEvent.change(input, {
    target: {
      files: [new File(['image'], fileName, { type: 'image/png' })],
    },
  })
}

function crossBookFixture() {
  const boardA = createBoard({
    id: 'board-a1',
    communicationBookId: 'book-a',
    name: 'Start A',
    symbols: [createSymbol({
      id: 'symbol-cross',
      boardId: 'board-a1',
      label: 'Przejdź do B',
      position: 0,
      linkedBoardId: 'board-b1',
    })],
  })
  const boardB1 = createBoard({ id: 'board-b1', communicationBookId: 'book-b', name: 'Cel B' })
  const boardB2 = createBoard({ id: 'board-b2', communicationBookId: 'book-b', name: 'Główna B' })
  return [
    createCommunicationBook({ id: 'book-a', name: 'Księga A', boards: [boardA], mainBoardId: boardA.id }),
    createCommunicationBook({ id: 'book-b', name: 'Księga B', boards: [boardB1, boardB2], mainBoardId: boardB2.id }),
  ]
}

function boardTabMock() {
  const tab: OpenedBoardTab = {
    navigate: vi.fn(),
    close: vi.fn(),
  }
  return { tab, openBoardTab: vi.fn(() => tab) }
}

describe('App', () => {
  function speechMock(): SpeechService {
    return { speak: vi.fn<SpeechService['speak']>(() => 'spoken'), stop: vi.fn(), isSupported: vi.fn(() => true) }
  }

  it('creates and opens an unnamed CommunicationBook from Home', async () => {
    const { tab, openBoardTab } = boardTabMock()
    render(<App initialView="home" openBoardTab={openBoardTab} />)
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz nową księgę' }))
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz księgę' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Księga bez tytułu' })).toBeInTheDocument()
    expect(screen.getByText('Ta księga nie ma jeszcze tablic.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '← Wróć do strony głównej' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ Dodaj tablicę' }))
    await waitFor(() => expect(tab.navigate).toHaveBeenCalledOnce())
    expect(openBoardTab).toHaveBeenCalledOnce()
    expect(vi.mocked(tab.navigate).mock.calls[0][0]).toMatch(/[?&]book=.+&board=.+&mode=edit/)
    expect(screen.getByRole('heading', { level: 1, name: 'Księga bez tytułu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wybierz tablicę Tablica bez tytułu' })).toBeInTheDocument()
  })

  it('processes and persists an optional cover while creating a CommunicationBook', async () => {
    const repository = new MemoryCommunicationBookRepository()
    const coverBlob = new Blob(['optimized-cover'], { type: 'image/webp' })
    const imageProcessor = vi.fn().mockResolvedValue({
      blob: coverBlob,
      width: 320,
      height: 240,
      mimeType: 'image/webp',
    })
    render(
      <App
        initialView="home"
        repository={repository}
        imageProcessor={imageProcessor}
        thumbnailProcessor={(blob) => Promise.resolve(blob)}
        createImageUrl={() => 'blob:book-cover'}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Utwórz nową księgę' }))
    const coverFile = new File(['cover'], 'okladka.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/Obraz okładki/), {
      target: { files: [coverFile] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz księgę' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Księga bez tytułu' })).toBeInTheDocument()
    expect(imageProcessor).toHaveBeenCalledWith(coverFile)
    const [savedBook] = await repository.listBooks()
    expect(savedBook.coverImage).toMatchObject({
      mimeType: 'image/webp',
      width: 320,
      height: 240,
    })
    expect(
      (await repository.getImagesForBook(savedBook.id)).get(savedBook.coverImage!.id),
    ).toBe(coverBlob)
  })

  it('shows a transient import toast and adds the book once to the permanent library', async () => {
    const repository = new MemoryCommunicationBookRepository()
    const importedBook = createCommunicationBook({ id: 'imported-book', name: 'Import test' })
    const backup = await createBookBackup(importedBook, new Map())
    render(<App initialView="home" repository={repository} />)
    fireEvent.change(screen.getByLabelText('Wybierz plik kopii księgi AAC'), {
      target: { files: [new File([backup], 'import.aacbook', { type: AAC_BOOK_MIME_TYPE })] },
    })

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Księga została zaimportowana'))
    expect(screen.getByRole('heading', { name: 'Wybierz księgę' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Import test' })).toHaveLength(1)
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), { timeout: 5000 })
    expect((await repository.listBooks()).some((book) => book.id === 'imported-book')).toBe(true)
  })

  it('renames immediately and safely deletes the selected book through Repository', async () => {
    const repository = new MemoryCommunicationBookRepository()
    const original = createCommunicationBook({ id: 'rename-book', name: 'Stara nazwa' })
    const other = createCommunicationBook({ id: 'other-book', name: 'Inna księga' })
    await repository.saveBundles([{ book: original, images: new Map() }, { book: other, images: new Map() }])
    render(<App initialView="home" repository={repository} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Więcej opcji księgi Stara nazwa' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edytuj księgę Stara nazwa' }))
    fireEvent.change(screen.getByLabelText('Nazwa księgi'), { target: { value: 'Nowa nazwa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz zmiany' }))
    expect(screen.getByRole('heading', { name: 'Nowa nazwa' })).toBeInTheDocument()
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    expect((await repository.listBooks()).find((book) => book.id === original.id)?.name).toBe('Nowa nazwa')

    fireEvent.click(screen.getByRole('button', { name: 'Więcej opcji księgi Nowa nazwa' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Usuń księgę Nowa nazwa' }))
    fireEvent.click(screen.getByRole('button', { name: 'Usuń księgę' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Nowa nazwa' })).not.toBeInTheDocument())
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    expect((await repository.listBooks()).map((book) => book.id)).toEqual(['other-book'])
  })

  it('keeps the add Board action and opens existing Boards in use mode', async () => {
    const repository = new MemoryCommunicationBookRepository()
    const boards = ['A', 'B', 'C'].map((name, index) => createBoard({
      id: `board-${index}`,
      communicationBookId: 'book-abc',
      name,
    }))
    const book = createCommunicationBook({ id: 'book-abc', name: 'Księga ABC', boards, mainBoardId: boards[0].id })
    await repository.saveBundles([{ book, images: new Map() }])
    const { tab, openBoardTab } = boardTabMock()
    render(<App initialView="home" repository={repository} openBoardTab={openBoardTab} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Więcej opcji księgi Księga ABC' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Zarządzaj księgą Księga ABC' }))
    expect(screen.getByRole('button', { name: '+ Dodaj tablicę' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ Dodaj tablicę' }))
    await waitFor(() => expect(tab.navigate).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: '+ Dodaj tablicę' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Wybierz tablicę A' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'A' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Nazwa tablicy' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edytuj tablicę' }))
    expect(screen.getByRole('textbox', { name: 'Nazwa tablicy' })).toHaveValue('A')
    expect(screen.queryByRole('button', { name: 'Cofnij' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ponów' })).not.toBeInTheDocument()
  })

  it('loads seeded books through the repository and navigates the Posiłki graph in use mode', async () => {
    const repository = new MemoryCommunicationBookRepository()
    await repository.saveBundles(await createDemoBookBundles(() => Promise.resolve(new Blob(['png'], { type: 'image/png' }))))
    const speechService = speechMock()
    render(<App initialView="home" repository={repository} createImageUrl={(blob) => `blob:fixture-${blob.size}`} thumbnailProcessor={(blob) => Promise.resolve(new Blob([blob], { type: 'image/png' }))} speechService={speechService} />)

    const openMeals = await screen.findByRole('button', { name: 'Wybierz księgę Posiłki' })
    fireEvent.click(openMeals)
    expect(speechService.speak).toHaveBeenNthCalledWith(1, 'Posiłki')
    expect(screen.getByRole('heading', { level: 1, name: 'Posiłki' })).toBeInTheDocument()
    const mainBoardCover = await screen.findByRole('button', { name: 'Wybierz tablicę Główna' })
    expect(mainBoardCover.querySelector('img')).toBeInTheDocument()
    fireEvent.click(mainBoardCover)
    expect(speechService.speak).toHaveBeenNthCalledWith(2, 'Główna')
    await screen.findByRole('heading', { level: 1, name: 'Główna' })
    fireEvent.click(screen.getByRole('button', { name: 'Jedzenie' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Jedzenie' }, { timeout: 1500 })).toBeInTheDocument()
    expect(speechService.speak).toHaveBeenNthCalledWith(3, 'Jedzenie')
    fireEvent.click(screen.getByRole('button', { name: '← Wróć' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Główna' })).toBeInTheDocument()
  })

  it('offers cross-book targets and navigates with book-aware Back and Main Board', async () => {
    const repository = new MemoryCommunicationBookRepository()
    const [bookA, bookB] = crossBookFixture()
    await repository.saveBundles([
      { book: bookA, images: new Map() },
      { book: bookB, images: new Map() },
    ])
    render(<App initialView="home" repository={repository} speechService={speechMock()} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Wybierz księgę Księga A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Wybierz tablicę Start A' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Edytuj tablicę' }))
    fireEvent.click(screen.getByRole('button', { name: 'Wybierz symbol: Przejdź do B' }))
    expect(screen.getByRole('option', { name: 'Cel B — Księga B' })).toHaveValue('board-b1')
    expect(screen.getByRole('option', { name: 'Główna B — Księga B' })).toHaveValue('board-b2')
    expect(screen.queryByRole('option', { name: 'Start A — Księga A' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Uruchom tablicę' }))
    fireEvent.click(screen.getByRole('button', { name: 'Przejdź do B' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Cel B' }, { timeout: 1500 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '← Wróć' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Start A' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Przejdź do B' }))
    await screen.findByRole('heading', { level: 1, name: 'Cel B' }, { timeout: 1500 })
    fireEvent.click(screen.getByRole('button', { name: 'Tablica główna' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Główna B' })).toBeInTheDocument()
  })

  it('creates a linked Board in the current book and persists the selected Symbol link', async () => {
    const repository = new MemoryCommunicationBookRepository()
    const [bookA] = crossBookFixture()
    await repository.saveBundles([{ book: bookA, images: new Map() }])
    const { tab, openBoardTab } = boardTabMock()
    render(<App initialView="home" repository={repository} speechService={speechMock()} openBoardTab={openBoardTab} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Wybierz księgę Księga A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Wybierz tablicę Start A' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Edytuj tablicę' }))
    fireEvent.click(screen.getByRole('button', { name: 'Wybierz symbol: Przejdź do B' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Utwórz nową tablicę' }))
    const createDialog = screen.getByRole('dialog', { name: 'Utwórz nową tablicę' })
    fireEvent.change(within(createDialog).getByLabelText('Nazwa tablicy'), { target: { value: 'Nowa tablica' } })
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Utwórz tablicę' }))

    const selectedOption = screen.getByRole('option', { name: 'Nowa tablica — Księga A' })
    expect(selectedOption).toHaveProperty('selected', true)
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    const [stored] = await repository.listBooks()
    const linkedSymbol = stored.boards.find((candidate) => candidate.id === 'board-a1')?.symbols[0]
    const newBoard = stored.boards.find((candidate) => candidate.name === 'Nowa tablica')
    expect(newBoard).toBeDefined()
    expect(linkedSymbol?.linkedBoardId).toBe(newBoard?.id)
    await waitFor(() => expect(tab.navigate).toHaveBeenCalledOnce())
    expect(vi.mocked(tab.navigate).mock.calls[0][0]).toContain(`board=${newBoard?.id}`)
    expect(vi.mocked(tab.navigate).mock.calls[0][0]).toContain('mode=edit')
  })

  it('opens a persisted Board route directly in edit mode', async () => {
    const repository = new MemoryCommunicationBookRepository()
    const directBoard = createBoard({ id: 'direct-board', communicationBookId: 'direct-book', name: 'Nowa karta' })
    const directBook = createCommunicationBook({ id: 'direct-book', name: 'Księga', boards: [directBoard], mainBoardId: directBoard.id })
    await repository.saveBundles([{ book: directBook, images: new Map() }])
    window.history.replaceState({}, '', '/?book=direct-book&board=direct-board&mode=edit')

    try {
      render(<App initialView="home" repository={repository} />)
      expect(await screen.findByRole('textbox', { name: 'Nazwa tablicy' })).toHaveValue('Nowa karta')
      expect(screen.getByRole('button', { name: 'Uruchom tablicę' })).toBeInTheDocument()
    } finally {
      window.history.replaceState({}, '', '/')
    }
  })
  it('przełącza demonstrację Board między trybem edit i use', () => {
    render(<App />)

    expect(screen.getByRole('radio', { name: 'Edit' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: 'Nazwa tablicy' })).toHaveValue(
      'Jedzenie',
    )
    expect(screen.getByText('Zapisano wszystkie zmiany')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Use' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Jedzenie' })).toBeInTheDocument()
    expect(screen.getByLabelText('Sterowanie wzrokiem (dwell)')).toBeChecked()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Stan zapisu')).not.toBeInTheDocument()
  })

  it('keeps demo name changes in local React state', () => {
    render(<App />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Nazwa tablicy' }), {
      target: { value: 'Napoje' },
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Use' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Napoje' })).toBeInTheDocument()
  })

  it('opens the native picker action and creates a selected symbol', async () => {
    const imageProcessor = vi.fn().mockResolvedValue(processedImage)
    render(
      <App
        imageProcessor={imageProcessor}
        createImageUrl={() => 'blob:optimized-image'}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Dodaj symbol/ }))
    selectImage()

    const tile = await screen.findByRole('button', {
      name: 'Wybierz symbol: Symbol bez podpisu',
    })
    expect(imageProcessor).toHaveBeenCalledOnce()
    expect(tile).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('.symbol-tile__image')).toHaveAttribute(
      'src',
      'blob:optimized-image',
    )
    expect(screen.queryByText('Ta tablica nie ma jeszcze symboli.')).not.toBeInTheDocument()
  })

  it('keeps exactly one selected symbol and changes selection', async () => {
    render(
      <App
        imageProcessor={vi.fn().mockResolvedValue(processedImage)}
        createImageUrl={(blob) => `blob:image-${blob.size}-${Math.random()}`}
      />,
    )

    selectImage('first.png')
    await screen.findByRole('button', { name: /Symbol bez podpisu/ })
    selectImage('second.png')
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: /Symbol bez podpisu/ }),
      ).toHaveLength(2),
    )

    const [firstTile, secondTile] = screen.getAllByRole('button', {
      name: /Symbol bez podpisu/,
    })
    expect(firstTile).toHaveAttribute('aria-pressed', 'false')
    expect(secondTile).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(firstTile)

    expect(firstTile).toHaveAttribute('aria-pressed', 'true')
    expect(secondTile).toHaveAttribute('aria-pressed', 'false')
  })

  it('edits only the selected symbol, switches inspector context and deletes after confirmation', async () => {
    render(
      <App
        imageProcessor={vi.fn().mockResolvedValue(processedImage)}
        createImageUrl={(blob) => `blob:inspector-${blob.size}-${Math.random()}`}
      />,
    )

    expect(screen.queryByRole('complementary', { name: 'Ustawienia symbolu' })).not.toBeInTheDocument()
    selectImage('first.png')
    await screen.findByRole('complementary', { name: 'Ustawienia symbolu' })
    fireEvent.change(screen.getByLabelText('Nazwa symbolu'), { target: { value: 'Pierwszy' } })
    selectImage('second.png')
    await waitFor(() => expect(screen.getAllByRole('button', { name: /Wybierz symbol/ })).toHaveLength(2))
    fireEvent.change(screen.getByLabelText('Nazwa symbolu'), { target: { value: 'Drugi' } })

    fireEvent.click(screen.getByRole('button', { name: 'Wybierz symbol: Pierwszy' }))
    expect(screen.getByLabelText('Nazwa symbolu')).toHaveValue('Pierwszy')
    fireEvent.click(screen.getByRole('button', { name: 'Wybierz symbol: Drugi' }))
    expect(screen.getByLabelText('Nazwa symbolu')).toHaveValue('Drugi')

    fireEvent.click(screen.getByRole('button', { name: 'Usuń symbol' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Usunąć Drugi?' })
    fireEvent.click(dialog.getElementsByTagName('button')[1])

    expect(screen.queryByRole('button', { name: 'Wybierz symbol: Drugi' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wybierz symbol: Pierwszy' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Ustawienia symbolu' })).not.toBeInTheDocument()
  })

  it('updates the selected tile appearance immediately in edit mode', async () => {
    render(
      <App
        imageProcessor={vi.fn().mockResolvedValue(processedImage)}
        createImageUrl={() => 'blob:appearance-preview'}
      />,
    )

    selectImage()
    const tile = await screen.findByRole('button', {
      name: 'Wybierz symbol: Symbol bez podpisu',
    })

    fireEvent.change(screen.getByLabelText('Kolor tekstu'), {
      target: { value: '#123456' },
    })
    fireEvent.change(screen.getByLabelText('Kolor obramowania'), {
      target: { value: '#654321' },
    })
    fireEvent.change(screen.getByLabelText('Grubość obramowania (px)'), {
      target: { value: '6' },
    })

    expect(tile.style.getPropertyValue('--symbol-text-color')).toBe('#123456')
    expect(tile.style.getPropertyValue('--symbol-border-color')).toBe('#654321')
    expect(tile.style.getPropertyValue('--symbol-border-width')).toBe('6px')
  })

  it('updates board settings without changing existing symbols and applies defaults to new symbols', async () => {
    render(<App imageProcessor={vi.fn().mockResolvedValue(processedImage)} createImageUrl={() => `blob:settings-${Math.random()}`} />)
    selectImage('first.png')
    const firstTile = await screen.findByRole('button', { name: /Symbol bez podpisu/ })
    fireEvent.change(screen.getByLabelText('Nazwa symbolu'), { target: { value: 'Pierwszy' } })
    fireEvent.change(screen.getByLabelText('Kolor obramowania'), { target: { value: '#aa0000' } })
    fireEvent.change(screen.getByLabelText('Czas zatwierdzenia wzrokiem'), { target: { value: '2000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Zamknij ustawienia symbolu' }))

    fireEvent.click(screen.getByRole('button', { name: 'Więcej opcji tablicy' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ustawienia tablicy' }))
    fireEvent.change(screen.getByLabelText('Liczba kolumn'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Domyślny kolor obramowania'), { target: { value: '#00aa00' } })
    fireEvent.change(screen.getByLabelText('Domyślna grubość obramowania'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Domyślny czas zatwierdzenia wzrokiem'), { target: { value: '1500' } })

    expect(screen.getByRole('list').style.getPropertyValue('--board-columns')).toBe('6')
    expect(firstTile.style.getPropertyValue('--symbol-border-color')).toBe('#aa0000')
    fireEvent.click(screen.getByRole('button', { name: 'Zamknij ustawienia tablicy' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Więcej opcji tablicy' })).toHaveFocus())

    selectImage('second.png')
    await waitFor(() => expect(document.querySelectorAll('.symbol-tile')).toHaveLength(2))
    const tiles = Array.from(document.querySelectorAll<HTMLButtonElement>('.symbol-tile'))
    expect(tiles.map((tile) => tile.getAttribute('aria-label'))).toEqual(['Wybierz symbol: Pierwszy', 'Wybierz symbol: Symbol bez podpisu'])
    expect(tiles[0].style.getPropertyValue('--symbol-border-color')).toBe('#aa0000')
    expect(tiles[1].style.getPropertyValue('--symbol-border-color')).toBe('#00aa00')
    expect(tiles[1].style.getPropertyValue('--symbol-border-width')).toBe('5px')
    fireEvent.click(screen.getByRole('radio', { name: 'Use' }))
    const useTiles = document.querySelectorAll<HTMLElement>('.symbol-tile')
    expect(useTiles[0].style.getPropertyValue('--symbol-dwell-duration')).toBe('2000ms')
    expect(useTiles[1].style.getPropertyValue('--symbol-dwell-duration')).toBe('1500ms')
  })

  it('shows an image error without removing an existing symbol', async () => {
    const imageProcessor = vi
      .fn()
      .mockResolvedValueOnce(processedImage)
      .mockRejectedValueOnce(
        new ImageProcessingError(
          'unsupported-format',
          'Wybierz obraz w formacie JPEG, PNG lub WebP.',
        ),
      )
    render(
      <App
        imageProcessor={imageProcessor}
        createImageUrl={() => 'blob:valid-image'}
      />,
    )

    selectImage('valid.png')
    await screen.findByRole('button', { name: /Symbol bez podpisu/ })
    selectImage('invalid.svg')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wybierz obraz w formacie JPEG, PNG lub WebP.',
    )
    expect(
      screen.getByRole('button', { name: /Symbol bez podpisu/ }),
    ).toBeInTheDocument()
  })

  it('speaks a symbol label and enables repeating the last message', async () => {
    const speechService = speechMock()
    render(
      <App
        imageProcessor={vi.fn().mockResolvedValue(processedImage)}
        createImageUrl={() => 'blob:speech-preview'}
        speechService={speechService}
      />,
    )
    selectImage()
    await screen.findByRole('button', { name: /Symbol bez podpisu/ })
    fireEvent.change(screen.getByLabelText('Nazwa symbolu'), { target: { value: 'Woda' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Use' }))

    const repeat = screen.getByRole('button', { name: 'Powtórz' })
    expect(repeat).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Woda' }))
    expect(speechService.speak).toHaveBeenCalledWith('Woda')
    expect(repeat).toBeEnabled()
    fireEvent.click(repeat)
    expect(speechService.speak).toHaveBeenCalledTimes(2)
  })

  it('does not speak an empty label and reports missing speech support once', async () => {
    const speechService: SpeechService = {
      speak: vi.fn<SpeechService['speak']>(() => 'unsupported'),
      stop: vi.fn(),
      isSupported: vi.fn(() => false),
    }
    render(<App imageProcessor={vi.fn().mockResolvedValue(processedImage)} createImageUrl={() => 'blob:no-speech'} speechService={speechService} />)
    selectImage()
    await screen.findByRole('button', { name: /Symbol bez podpisu/ })
    fireEvent.click(screen.getByRole('radio', { name: 'Use' }))
    fireEvent.click(screen.getByRole('button', { name: 'Symbol bez podpisu' }))
    expect(speechService.speak).not.toHaveBeenCalled()
  })

  it('navigates to the linked board after activation delay', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const onNavigateToBoard = vi.fn()
    render(
      <App
        imageProcessor={vi.fn().mockResolvedValue(processedImage)}
        createImageUrl={() => 'blob:linked'}
        speechService={speechMock()}
        onNavigateToBoard={onNavigateToBoard}
      />,
    )
    selectImage()
    await screen.findByRole('button', { name: /Symbol bez podpisu/ })
    fireEvent.change(screen.getByLabelText('Nazwa symbolu'), { target: { value: 'Picie' } })
    fireEvent.change(screen.getByLabelText('Połącz z tablicą'), { target: { value: 'demo-drinks' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Use' }))
    fireEvent.click(screen.getByRole('button', { name: 'Picie' }))

    expect(onNavigateToBoard).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(500)
    expect(onNavigateToBoard).toHaveBeenCalledWith('demo-drinks')
    vi.useRealTimers()
  })
})
