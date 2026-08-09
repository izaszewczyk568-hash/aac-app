import { fireEvent, render, screen } from '@testing-library/react'
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
    onRenameBook={vi.fn()}
    onDeleteBook={vi.fn()}
    onImportBook={vi.fn()}
    onExportBook={vi.fn()}
    {...overrides}
  />)
}

describe('Home', () => {
  it('uses the approved Księga copy and hides the recent section for an empty library', () => {
    const { container } = renderHome({ books: [] })

    expect(screen.getByRole('heading', { level: 1, name: 'Rozpocznij pracę z Księgą AAC' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Utwórz nową księgę' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Importuj księgę z pliku/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ostatnio używane' })).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/książk/i)
  })

  it('shows a decorative runtime thumbnail and a neutral fallback', () => {
    const { rerender, container } = renderHome({ thumbnailSources: { 'book-1': 'blob:thumbnail-png' } })
    expect(container.querySelector('.book-card__preview img')).toHaveAttribute('src', 'blob:thumbnail-png')
    expect(container.querySelector('.book-card__preview')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.book-card__preview button')).toBeNull()

    rerender(<Home books={[book]} onCreateBook={vi.fn()} onOpenBook={vi.fn()} />)
    expect(container.querySelector('.book-card__placeholder')).toHaveTextContent('AAC')
  })

  it('renders all four menu actions and supports keyboard navigation', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Więcej opcji księgi Posiłki' }))
    const actions = screen.getAllByRole('menuitem')
    expect(actions.map((action) => action.textContent?.trim())).toEqual([
      'Otwórz',
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
    expect(onCreateBook).toHaveBeenCalledWith('')
  })

  it('renames the selected book and keeps an empty name valid', () => {
    const onRenameBook = vi.fn()
    renderHome({ onRenameBook })
    fireEvent.click(screen.getByRole('button', { name: 'Więcej opcji księgi Posiłki' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edytuj księgę Posiłki' }))
    const input = screen.getByLabelText('Nazwa księgi')
    expect(input).toHaveValue('Posiłki')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz nazwę' }))
    expect(onRenameBook).toHaveBeenCalledWith('book-1', '')
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

  it('passes import files and reuses the same card in the added section', () => {
    const onImportBook = vi.fn()
    renderHome({ onImportBook, addedBookId: book.id, transferNotice: { type: 'success', message: 'Księga została zaimportowana' } })
    const file = new File(['backup'], 'Posilki.aacbook', { type: 'application/vnd.aacbook+json' })
    fireEvent.change(screen.getByLabelText('Wybierz plik kopii księgi AAC'), { target: { files: [file] } })
    expect(onImportBook).toHaveBeenCalledWith(file)
    expect(screen.getByRole('status')).toHaveTextContent('Księga została zaimportowana')
    expect(screen.getByRole('heading', { name: 'Dodana księga' })).toBeInTheDocument()
    expect(document.querySelectorAll('.book-card')).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'Więcej opcji księgi Posiłki' })[0])
    expect(screen.getAllByRole('menu')).toHaveLength(1)
  })
})
