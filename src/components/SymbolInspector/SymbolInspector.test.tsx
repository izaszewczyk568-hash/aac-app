import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createSymbol } from '../../domain/communicationBook'
import { SymbolInspector } from './SymbolInspector'

function makeSymbol() {
  return createSymbol({
    id: 'symbol-1',
    boardId: 'board-current',
    label: 'Woda',
    position: 0,
    image: { id: 'image-1', mimeType: 'image/webp', width: 512, height: 256 },
    createdAt: '2026-08-09T12:00:00.000Z',
  })
}

const boards = [
  { id: 'board-current', name: 'Jedzenie', bookName: 'Posiłki' },
  { id: 'board-drinks', name: 'Picie', bookName: 'Posiłki' },
  { id: 'board-school', name: 'Picie', bookName: 'Szkoła' },
  { id: 'board-empty', name: '   ', bookName: '   ' },
]

describe('SymbolInspector', () => {
  it('uses one name for the visible and future spoken text', () => {
    const onChange = vi.fn()
    render(<SymbolInspector symbol={makeSymbol()} currentBoardId="board-current" boards={boards} onChange={onChange} onClose={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByLabelText('Nazwa symbolu')).toHaveValue('Woda')
    fireEvent.change(screen.getByLabelText('Nazwa symbolu'), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith({ label: '' })
    expect(screen.queryByLabelText('Tekst odczytywany na głos')).not.toBeInTheDocument()
    expect(screen.getByText(/widoczna na kafelku i odczytywana na głos/)).toBeInTheDocument()
  })

  it('updates bounded border and text appearance without image transform controls', () => {
    const onChange = vi.fn()
    const symbol = makeSymbol()
    const { rerender } = render(<SymbolInspector symbol={symbol} currentBoardId="board-current" boards={boards} onChange={onChange} onClose={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /Obróć/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Powiększenie obrazu/)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Grubość obramowania (px)'), { target: { value: '20' } })
    expect(onChange).toHaveBeenCalledWith({ borderWidth: 12 })
    rerender(<SymbolInspector symbol={{ ...symbol, borderWidth: 0 }} currentBoardId="board-current" boards={boards} onChange={onChange} onClose={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByLabelText('Grubość obramowania (px)')).toHaveValue(0)
  })

  it('links by board names, excludes the current board and supports all dwell values', () => {
    const onChange = vi.fn()
    const onCreateLinkedBoard = vi.fn()
    render(<SymbolInspector symbol={makeSymbol()} currentBoardId="board-current" boards={boards} onChange={onChange} onClose={vi.fn()} onDelete={vi.fn()} onCreateLinkedBoard={onCreateLinkedBoard} />)

    const linkSelect = screen.getByLabelText('Połącz z tablicą')
    expect(screen.queryByRole('option', { name: 'Jedzenie' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Picie — Posiłki' })).toHaveValue('board-drinks')
    expect(screen.getByRole('option', { name: 'Picie — Szkoła' })).toHaveValue('board-school')
    expect(screen.getByRole('option', { name: 'Tablica bez tytułu — Księga bez tytułu' })).toHaveValue('board-empty')
    fireEvent.change(linkSelect, { target: { value: 'board-drinks' } })
    fireEvent.change(linkSelect, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith({ linkedBoardId: 'board-drinks' })
    expect(onChange).toHaveBeenCalledWith({ linkedBoardId: null })
    fireEvent.click(screen.getByRole('button', { name: '+ Utwórz nową tablicę' }))
    expect(screen.getByRole('dialog', { name: 'Utwórz nową tablicę' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nazwa tablicy'), { target: { value: 'Nowa tablica' } })
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz tablicę' }))
    expect(onCreateLinkedBoard).toHaveBeenCalledWith('Nowa tablica')

    const dwell = screen.getByLabelText('Czas zatwierdzenia wzrokiem')
    expect(Array.from((dwell as HTMLSelectElement).options).map((option) => option.value)).toEqual(['', '500', '1000', '1500', '2000', '3000'])
    fireEvent.change(dwell, { target: { value: '1500' } })
    fireEvent.change(dwell, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith({ dwellTime: 1500 })
    expect(onChange).toHaveBeenCalledWith({ dwellTime: null })
  })

  it('requires confirmation and supports cancel or deleting only on confirmation', () => {
    const onDelete = vi.fn()
    render(<SymbolInspector symbol={makeSymbol()} currentBoardId="board-current" boards={boards} onChange={vi.fn()} onClose={vi.fn()} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole('button', { name: 'Usuń symbol' }))
    expect(screen.getByRole('alertdialog', { name: 'Usunąć Woda?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anuluj' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }))
    expect(onDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Usuń symbol' }))
    fireEvent.click(screen.getByRole('alertdialog').getElementsByTagName('button')[1])
    expect(onDelete).toHaveBeenCalledOnce()
  })
})
