import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createBoard, createCommunicationBook, createSymbol } from '../../domain/communicationBook'
import { Home } from './Home'

const symbol = createSymbol({
  id: 'symbol-1',
  boardId: 'board-1',
  label: 'Banan',
  position: 0,
  image: { id: 'image-1', mimeType: 'image/webp', width: 320, height: 240 },
})
const board = createBoard({
  id: 'board-1',
  communicationBookId: 'book-1',
  name: 'Jedzenie',
  symbols: [symbol],
})
const book = createCommunicationBook({
  id: 'book-1',
  name: 'Posiłki',
  boards: [board],
  mainBoardId: board.id,
  createdAt: '2026-08-08T12:00:00.000Z',
  updatedAt: '2026-08-09T12:00:00.000Z',
})

function renderHome(overrides: Partial<React.ComponentProps<typeof Home>> = {}) {
  return render(<Home
    books={[book]}
    onCreateBook={vi.fn()}
    onOpenBook={vi.fn()}
    onManageBook={vi.fn()}
    onRenameBook={vi.fn()}
    onDeleteBook={vi.fn()}
    onImportBook={vi.fn()}
    onExportBook={vi.fn()}
    {...overrides}
  />)
}

describe('Home', () => {
  it('keeps a permanent book library with an empty state', () => {
    const { container } = renderHome({ books: [] })

    expect(screen.getByRole('heading', { level: 1, name: 'Rozpocznij pracę z Księgą AAC' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Utwórz nową księgę' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Importuj księgę z pliku/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Wybierz księgę' })).toBeInTheDocument()
    expect(screen.getByText(/Nie ma jeszcze żadnych ksiąg/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ostatnio używane' })).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/książk/i)
  })

  it('starts the full-screen child journey from Home', () => {
    const onStartChildFullScreen = vi.fn()
    const { rerender } = renderHome({ onStartChildFullScreen })

    fireEvent.click(screen.getByRole('button', { name: 'Uruchom pełnoekranowy tryb dziecka' }))
    expect(onStartChildFullScreen).toHaveBeenCalledOnce()

    rerender(
      <Home
        books={[book]}
        onCreateBook={vi.fn()}
        onOpenBook={vi.fn()}
        isChildFullScreen
        onStartChildFullScreen={onStartChildFullScreen}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Uruchom pełnoekranowy tryb dziecka' })).not.toBeInTheDocument()
  })

  it('shows a decorative runtime thumbnail and a neutral fallback', () => {
    const { rerender, container } = renderHome({ thumbnailSources: { 'book-1': 'blob:thumbnail-png' } })
    expect(container.querySelector('.book-card__preview img')).toHaveAttribute('src', 'blob:thumbnail-png')
    expect(container.querySelector('.book-card__preview')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.book-card__preview button')).toBeNull()

    rerender(<Home books={[book]} onCreateBook={vi.fn()} onOpenBook={vi.fn()} />)
    expect(container.querySelector('.book-card__placeholder')).toHaveTextContent('AAC')
  })

  it('selects a whole book cover by click or dwell without opening caregiver actions', () => {
    const onOpenBook = vi.fn()
    const { container } = renderHome({ onOpenBook, dwellEnabled: true })
    const cover = screen.getByRole('button', { name: 'Wybierz księgę Posiłki' })

    fireEvent.pointerEnter(cover)
    const progress = container.querySelector('.book-card__dwell-progress')
    expect(progress).toBeInTheDocument()
    fireEvent.animationEnd(progress!)
    expect(onOpenBook).toHaveBeenCalledOnce()

    fireEvent.pointerLeave(cover)
    fireEvent.pointerEnter(cover)
    fireEvent.click(cover)
    expect(container.querySelector('.book-card__dwell-progress')).not.toBeInTheDocument()
    expect(onOpenBook).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('renders all four menu actions and supports keyboard navigation', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Więcej opcji księgi Posiłki' }))
    const actions = screen.getAllByRole('menuitem')
    expect(actions.map((action) => action.textContent?.trim())).toEqual([
      'Zarządzaj księgą Posiłki',
      'Edytuj księgę Posiłki',
      'Eksportuj księgę Posiłki',
      'Usuń księgę Posiłki',
    ])
    expect(actions[0]).toHaveFocus()
    fireEvent.keyDown(actions[0], { key: 'ArrowDown' })
    expect(actions[1]).toHaveFocus()
    expect(screen.queryByText(/Zmiana nazwy i usuwanie/)).not.toBeInTheDocument()
  })

  it('creates an unnamed book without persisting the fallback', () => {
    const onCreateBook = vi.fn()
    renderHome({ books: [], onCreateBook })
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz nową księgę' }))
    const input = screen.getByLabelText('Nazwa księgi')
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('placeholder', 'Księga bez tytułu')
    expect(input).not.toBeRequired()
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz księgę' }))
    expect(onCreateBook).toHaveBeenCalledWith('', null)
  })

  it('passes an optional cover image while creating a book', async () => {
    const onCreateBook = vi.fn().mockResolvedValue(undefined)
    renderHome({ books: [], onCreateBook })
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz nową księgę' }))
    const cover = new File(['cover'], 'okladka.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/Obraz okładki/), { target: { files: [cover] } })
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz księgę' }))

    await waitFor(() => expect(onCreateBook).toHaveBeenCalledWith('', cover))
  })

  it('edits the selected book name and optional cover symbol', () => {
    const onRenameBook = vi.fn()
    renderHome({ onRenameBook })
    fireEvent.click(screen.getByRole('button', { name: 'Więcej opcji księgi Posiłki' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edytuj księgę Posiłki' }))
    const input = screen.getByLabelText('Nazwa księgi')
    expect(input).toHaveValue('Posiłki')
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByRole('option', { name: 'Banan — Jedzenie' })).toHaveValue('symbol-1')
    fireEvent.change(screen.getByLabelText(/Symbol okładki/), { target: { value: 'symbol-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz zmiany' }))
    expect(onRenameBook).toHaveBeenCalledWith('book-1', '', 'symbol-1')
  })

  it('deletes only after confirmation and names the selected book', () => {
    const onDeleteBook = vi.fn()
    renderHome({ onDeleteBook })
    fireEvent.click(screen.getByRole('button', { name: 'Więcej opcji księgi Posiłki' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Usuń księgę Posiłki' }))
    expect(screen.getByRole('alertdialog', { name: 'Usunąć księgę Posiłki?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anuluj' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Usuń księgę' }))
    expect(onDeleteBook).toHaveBeenCalledWith('book-1')
  })

  it('passes import files and keeps each book once in the permanent library', () => {
    const onImportBook = vi.fn()
    renderHome({ onImportBook, transferNotice: { type: 'success', message: 'Księga została zaimportowana' } })
    const file = new File(['backup'], 'Posilki.aacbook', { type: 'application/vnd.aacbook+json' })
    fireEvent.change(screen.getByLabelText('Wybierz plik kopii księgi AAC'), { target: { files: [file] } })
    expect(onImportBook).toHaveBeenCalledWith(file)
    expect(screen.getByRole('status')).toHaveTextContent('Księga została zaimportowana')
    expect(screen.queryByRole('heading', { name: 'Dodana księga' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Wybierz księgę' })).toBeInTheDocument()
    expect(document.querySelectorAll('.book-card')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Więcej opcji księgi Posiłki' }))
    expect(screen.getAllByRole('menu')).toHaveLength(1)
  })
})
