import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createBoard } from '../../domain/communicationBook'
import { BoardSettings } from './BoardSettings'

const board = createBoard({ id: 'board-1', communicationBookId: 'book-1', name: 'Jedzenie' })

describe('BoardSettings', () => {
  it('updates every supported board setting through native controls', () => {
    const onChange = vi.fn()
    render(<BoardSettings board={board} onChange={onChange} onClose={vi.fn()} />)

    expect(Array.from((screen.getByLabelText('Liczba kolumn') as HTMLSelectElement).options).map((option) => option.value)).toEqual(['2', '3', '4', '5', '6'])
    fireEvent.change(screen.getByLabelText('Liczba kolumn'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Domyślny czas zatwierdzenia wzrokiem'), { target: { value: '1500' } })
    fireEvent.change(screen.getByLabelText('Domyślna grubość obramowania'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('Domyślna grubość obramowania'), { target: { value: '-3' } })
    fireEvent.change(screen.getByLabelText('Domyślny kolor obramowania'), { target: { value: '#123456' } })
    fireEvent.change(screen.getByLabelText('Domyślny kolor tekstu'), { target: { value: '#654321' } })

    expect(onChange).toHaveBeenCalledWith({ columns: 6 })
    expect(onChange).toHaveBeenCalledWith({ defaultDwellTime: 1500 })
    expect(onChange).toHaveBeenCalledWith({ defaultBorderWidth: 12 })
    expect(onChange).toHaveBeenCalledWith({ defaultBorderWidth: 0 })
    expect(onChange).toHaveBeenCalledWith({ defaultBorderColor: '#123456' })
    expect(onChange).toHaveBeenCalledWith({ defaultTextColor: '#654321' })
  })

  it('focuses the first setting and closes with Escape', () => {
    const onClose = vi.fn()
    render(<BoardSettings board={board} onChange={vi.fn()} onClose={onClose} />)
    expect(screen.getByLabelText('Liczba kolumn')).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
