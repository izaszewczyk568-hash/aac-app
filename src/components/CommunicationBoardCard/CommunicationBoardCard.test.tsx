import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createBoard } from '../../domain/communicationBook'
import { CommunicationBoardCard } from './CommunicationBoardCard'

const board = createBoard({
  id: 'board-1',
  communicationBookId: 'book-1',
  name: 'Jedzenie',
  defaultDwellTime: 1200,
})

describe('CommunicationBoardCard', () => {
  it('is a single accessible Board selection control with a cover', () => {
    render(
      <CommunicationBoardCard
        board={board}
        imageSource="blob:board-cover"
        isMainBoard
        onSelect={vi.fn()}
      />,
    )

    const control = screen.getByRole('button', { name: 'Wybierz tablicę Jedzenie' })
    expect(control).toBeInTheDocument()
    expect(screen.getByText('Tablica główna')).toBeInTheDocument()
    expect(document.querySelector('img')).toHaveAttribute('src', 'blob:board-cover')
  })

  it('selects immediately on click and after dwell animation', () => {
    const onSelect = vi.fn()
    const { rerender } = render(
      <CommunicationBoardCard board={board} dwellEnabled onSelect={onSelect} />,
    )
    const control = screen.getByRole('button', { name: 'Wybierz tablicę Jedzenie' })

    fireEvent.click(control)
    expect(onSelect).toHaveBeenCalledTimes(1)

    rerender(<CommunicationBoardCard board={board} dwellEnabled onSelect={onSelect} />)
    fireEvent.pointerLeave(control)
    fireEvent.pointerEnter(control)
    const progress = document.querySelector('.communication-board-card__dwell-progress')!
    fireEvent.animationEnd(progress)
    expect(onSelect).toHaveBeenCalledTimes(2)
  })

  it('uses the untitled fallback without changing the Board name', () => {
    const untitled = createBoard({ ...board, id: 'board-2', name: '   ' })
    render(<CommunicationBoardCard board={untitled} onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Wybierz tablicę Tablica bez tytułu' })).toBeInTheDocument()
    expect(untitled.name).toBe('   ')
  })
})
