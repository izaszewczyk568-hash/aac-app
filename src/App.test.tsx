import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { ImageProcessingError } from './features/images/processImage'
import type { SpeechService } from './features/speech/speechService'
import { MemoryCommunicationBookRepository } from './data/communicationBookRepository'
import { createDemoBookBundles } from './demo/communicationBookFixtures'

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

describe('App', () => {
  function speechMock(): SpeechService {
    return { speak: vi.fn<SpeechService['speak']>(() => 'spoken'), stop: vi.fn(), isSupported: vi.fn(() => true) }
  }

  it('creates and opens an unnamed CommunicationBook from Home', async () => {
    render(<App initialView="home" />)
    fireEvent.click(screen.getByRole('button', { name: '+ Utwórz nową książkę' }))
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz książkę' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Książka bez tytułu' })).toBeInTheDocument()
    expect(screen.getByText('Ta książka nie ma jeszcze tablic.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '← Wróć do strony głównej' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ Utwórz pierwszą tablicę' }))
    const backToBook = await screen.findByRole('button', { name: '← Wróć do książki' })
    fireEvent.click(backToBook)
    expect(screen.getByRole('heading', { level: 1, name: 'Książka bez tytułu' })).toBeInTheDocument()
  })

  it('loads seeded books through the repository and navigates the Posiłki graph in use mode', async () => {
    const repository = new MemoryCommunicationBookRepository()
    await repository.saveBundles(await createDemoBookBundles(() => Promise.resolve(new Blob(['png'], { type: 'image/png' }))))
    const speechService = speechMock()
    render(<App initialView="home" repository={repository} createImageUrl={(blob) => `blob:fixture-${blob.size}`} speechService={speechService} />)

    const openMeals = await screen.findByRole('button', { name: 'Otwórz książkę Posiłki' })
    fireEvent.click(openMeals)
    fireEvent.click(screen.getByRole('button', { name: 'Główna' }))
    await screen.findByRole('textbox', { name: 'Nazwa tablicy' })
    fireEvent.click(screen.getByRole('radio', { name: 'Use' }))
    fireEvent.click(screen.getByRole('button', { name: 'Jedzenie' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Jedzenie' }, { timeout: 1500 })).toBeInTheDocument()
    expect(speechService.speak).toHaveBeenCalledWith('Jedzenie')
    fireEvent.click(screen.getByRole('button', { name: '← Wróć' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Główna' })).toBeInTheDocument()
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
