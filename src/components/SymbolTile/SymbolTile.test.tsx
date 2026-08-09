import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createSymbol } from '../../domain/communicationBook'
import { SymbolTile } from './SymbolTile'

function makeSymbol(label = 'Banan') {
  return createSymbol({
    id: 'symbol-1',
    boardId: 'board-1',
    label,
    position: 0,
    image: {
      id: 'image-1',
      mimeType: 'image/webp',
      width: 512,
      height: 320,
    },
    createdAt: '2026-08-09T12:00:00.000Z',
  })
}

describe('SymbolTile', () => {
  it('renders the label and image without duplicating alternative text', () => {
    const { container } = render(
      <SymbolTile
        symbol={makeSymbol()}
        imageSource="blob:preview"
        mode="use"
      />,
    )

    expect(screen.getByText('Banan')).toBeInTheDocument()
    const image = container.querySelector('img')
    expect(image).toHaveAttribute('src', 'blob:preview')
    expect(image).toHaveAttribute('alt', '')
  })

  it('handles an empty label with an edit-only presentation fallback', () => {
    const { rerender } = render(
      <SymbolTile symbol={makeSymbol('')} mode="edit" />,
    )

    expect(screen.getByText('Bez podpisu')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Wybierz symbol: Symbol bez podpisu' }),
    ).toBeInTheDocument()

    rerender(<SymbolTile symbol={makeSymbol('')} mode="use" />)
    expect(screen.queryByText('Bez podpisu')).not.toBeInTheDocument()
  })

  it('uses a focusable native button with built-in keyboard activation', () => {
    const onSelect = vi.fn()
    render(
      <SymbolTile symbol={makeSymbol()} mode="edit" onSelect={onSelect} />,
    )
    const tile = screen.getByRole('button', { name: /Wybierz symbol: Banan/ })

    tile.focus()
    expect(tile).toHaveFocus()
    expect(tile.tagName).toBe('BUTTON')
    expect(tile).toHaveAttribute('type', 'button')
    expect(tile.tabIndex).toBe(0)
    fireEvent.click(tile)

    expect(onSelect).toHaveBeenCalledWith('symbol-1')
  })

  it('announces and marks the selected state independently from its border', () => {
    render(<SymbolTile symbol={makeSymbol()} mode="edit" selected />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Wybrano')).toBeInTheDocument()
  })

  it('activates in use mode through a native button', () => {
    const onActivate = vi.fn()
    render(<SymbolTile symbol={makeSymbol()} mode="use" onActivate={onActivate} />)

    const tile = screen.getByRole('button', { name: 'Banan' })
    expect(tile.tagName).toBe('BUTTON')
    fireEvent.click(tile)

    expect(onActivate).toHaveBeenCalledOnce()
    expect(screen.getByText('Aktywowano')).toBeInTheDocument()
  })

  it('starts dwell only when enabled, resets on leave and activates once on completion', () => {
    const onActivate = vi.fn()
    const { container, rerender } = render(
      <SymbolTile symbol={makeSymbol()} mode="use" onActivate={onActivate} />,
    )
    const tile = screen.getByRole('button', { name: 'Banan' })

    fireEvent.pointerEnter(tile)
    expect(container.querySelector('.symbol-tile__dwell-progress')).toBeNull()

    rerender(<SymbolTile symbol={makeSymbol()} mode="use" dwellEnabled dwellTime={500} onActivate={onActivate} />)
    fireEvent.pointerEnter(tile)
    let progress = container.querySelector('.symbol-tile__dwell-progress')!
    expect(tile.style.getPropertyValue('--symbol-dwell-duration')).toBe('500ms')
    fireEvent.pointerLeave(tile)
    expect(container.querySelector('.symbol-tile__dwell-progress')).toBeNull()
    expect(onActivate).not.toHaveBeenCalled()

    fireEvent.pointerEnter(tile)
    progress = container.querySelector('.symbol-tile__dwell-progress')!
    fireEvent.animationEnd(progress, { animationName: 'symbol-dwell-progress' })
    expect(onActivate).toHaveBeenCalledOnce()
    expect(container.querySelector('.symbol-tile__dwell-progress')).toBeNull()
    fireEvent.pointerEnter(tile)
    expect(container.querySelector('.symbol-tile__dwell-progress')).toBeNull()

    fireEvent.pointerLeave(tile)
    fireEvent.pointerEnter(tile)
    expect(container.querySelector('.symbol-tile__dwell-progress')).not.toBeNull()
  })

  it('cancels dwell progress and activates immediately after a click', () => {
    const onActivate = vi.fn()
    const { container } = render(
      <SymbolTile symbol={makeSymbol()} mode="use" dwellEnabled dwellTime={3000} onActivate={onActivate} />,
    )
    const tile = screen.getByRole('button', { name: 'Banan' })

    fireEvent.pointerEnter(tile)
    expect(container.querySelector('.symbol-tile__dwell-progress')).not.toBeNull()
    fireEvent.click(tile)

    expect(container.querySelector('.symbol-tile__dwell-progress')).toBeNull()
    expect(onActivate).toHaveBeenCalledOnce()
    expect(screen.getByText('Aktywowano')).toBeInTheDocument()
  })
})
