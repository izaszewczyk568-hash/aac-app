import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { ImageProcessingError } from './features/images/processImage'

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
  it('przełącza demonstrację Board między trybem edit i use', () => {
    render(<App />)

    expect(screen.getByRole('radio', { name: 'Edit' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: 'Nazwa tablicy' })).toHaveValue(
      'Jedzenie',
    )
    expect(screen.getByText('Zapisano wszystkie zmiany')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Use' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Jedzenie' })).toBeInTheDocument()
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
})
