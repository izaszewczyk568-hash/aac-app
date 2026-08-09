import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createBoard, createCommunicationBook } from '../../domain/communicationBook'
import { Home } from './Home'

const board = createBoard({ id: 'board-1', communicationBookId: 'book-1', name: 'Jedzenie' })
const book = createCommunicationBook({
  id: 'book-1',
  name: 'Posiłki',
  boards: [board],
  mainBoardId: board.id,
  createdAt: '2026-08-08T12:00:00.000Z',
  updatedAt: '2026-08-09T12:00:00.000Z',
})

describe('Home', () => {
  it('renders the main actions and no recent section for an empty library', () => {
    render(<Home books={[]} onCreateBook={vi.fn()} onOpenBook={vi.fn()} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Rozpocznij pracę z książką AAC' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Utwórz nową książkę' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Importuj książkę z pliku/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ostatnio używane' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Nie masz/)).not.toBeInTheDocument()
  })

  it('shows recent books, their board counts and opens the correct book', () => {
    const onOpenBook = vi.fn()
    render(<Home books={[book]} onCreateBook={vi.fn()} onOpenBook={onOpenBook} />)

    expect(screen.getByRole('heading', { name: 'Ostatnio używane' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Posiłki' })).toBeInTheDocument()
    expect(screen.getByText('1 tablica')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Otwórz książkę Posiłki' }))
    expect(onOpenBook).toHaveBeenCalledWith('book-1')
    expect(document.querySelector('.book-card__preview button')).toBeNull()
  })

  it('creates a book using only the optional name and manages dialog focus', () => {
    const onCreateBook = vi.fn()
    render(<Home books={[]} onCreateBook={onCreateBook} onOpenBook={vi.fn()} />)

    const trigger = screen.getByRole('button', { name: '+ Utwórz nową książkę' })
    fireEvent.click(trigger)
    const name = screen.getByLabelText(/Nazwa książki/)
    expect(name).toHaveFocus()
    fireEvent.change(name, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz książkę' }))
    expect(onCreateBook).toHaveBeenCalledWith('')
  })

  it('opens the contextual menu without enabling unfinished operations', () => {
    render(<Home books={[book]} onCreateBook={vi.fn()} onOpenBook={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Więcej opcji książki Posiłki' }))
    expect(screen.getByRole('menu', { name: 'Opcje książki Posiłki' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Eksportuj/ })).not.toBeInTheDocument()
  })

  it('passes a selected .aacbook file to the import flow', () => {
    const onImportBook = vi.fn()
    render(<Home books={[]} onCreateBook={vi.fn()} onOpenBook={vi.fn()} onImportBook={onImportBook} />)
    const file = new File(['backup'], 'Posilki.aacbook', { type: 'application/vnd.aacbook+json' })

    fireEvent.change(screen.getByLabelText('Wybierz plik kopii książki AAC'), { target: { files: [file] } })

    expect(onImportBook).toHaveBeenCalledWith(file)
  })

  it('exports the selected book and supports keyboard navigation in its menu', () => {
    const onExportBook = vi.fn()
    render(<Home books={[book]} onCreateBook={vi.fn()} onOpenBook={vi.fn()} onExportBook={onExportBook} />)
    fireEvent.click(screen.getByRole('button', { name: 'Więcej opcji książki Posiłki' }))
    const open = screen.getByRole('menuitem', { name: 'Otwórz' })
    const exportItem = screen.getByRole('menuitem', { name: 'Eksportuj książkę' })
    expect(open).toHaveFocus()
    fireEvent.keyDown(open, { key: 'ArrowDown' })
    expect(exportItem).toHaveFocus()
    fireEvent.click(exportItem)
    expect(onExportBook).toHaveBeenCalledWith('book-1')
  })

  it('announces import errors and offers a native retry button', () => {
    render(
      <Home
        books={[]}
        onCreateBook={vi.fn()}
        onOpenBook={vi.fn()}
        onImportBook={vi.fn()}
        transferNotice={{ type: 'error', message: 'Plik jest uszkodzony.' }}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Plik jest uszkodzony.')
    expect(screen.getByRole('button', { name: 'Spróbuj ponownie' })).toBeInTheDocument()
  })

  it('announces a successful import without an alert', () => {
    render(
      <Home
        books={[]}
        onCreateBook={vi.fn()}
        onOpenBook={vi.fn()}
        transferNotice={{ type: 'success', message: 'Książka została zaimportowana.' }}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Książka została zaimportowana.')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
