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
})
