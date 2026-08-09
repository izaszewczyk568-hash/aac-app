import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createBoard, createSymbol } from '../../domain/communicationBook'
import { Board, type SaveStatus } from './Board'

const timestamp = '2026-08-09T12:00:00.000Z'

function makeBoard(withSymbol = false, name = 'Potrzeby') {
  return createBoard({
    id: 'board-1',
    communicationBookId: 'book-1',
    name,
    columns: 5,
    symbols: withSymbol
      ? [
          createSymbol({
            id: 'symbol-1',
            boardId: 'board-1',
            label: 'Pić',
            position: 0,
            createdAt: timestamp,
          }),
        ]
      : [],
    createdAt: timestamp,
  })
}

describe('Board', () => {
  it('keeps an empty name in the edit input and shows its placeholder', () => {
    render(<Board board={makeBoard(false, '')} mode="edit" />)

    expect(screen.getByRole('textbox', { name: 'Nazwa tablicy' })).toHaveValue('')
    expect(screen.getByPlaceholderText('Tablica bez tytułu')).toBeInTheDocument()
  })

  it.each([
    ['', 'Tablica bez tytułu'],
    ['   \t ', 'Tablica bez tytułu'],
    ['Jedzenie', 'Jedzenie'],
  ])('presents the name %j in use mode as %j', (name, expectedName) => {
    render(<Board board={makeBoard(false, name)} mode="use" />)

    expect(
      screen.getByRole('heading', { level: 1, name: expectedName }),
    ).toBeInTheDocument()
  })

  it('renders edit controls and updates the local board name', () => {
    const onNameChange = vi.fn()
    const onAddSymbol = vi.fn()
    const onStartUse = vi.fn()
    render(
      <Board
        board={makeBoard()}
        mode="edit"
        saveStatus="saved"
        onNameChange={onNameChange}
        onAddSymbol={onAddSymbol}
        onStartUse={onStartUse}
      />,
    )

    const nameInput = screen.getByRole('textbox', { name: 'Nazwa tablicy' })
    fireEvent.change(nameInput, { target: { value: 'Jedzenie' } })
    fireEvent.click(screen.getByRole('button', { name: /Dodaj symbol/ }))

    expect(nameInput).toHaveValue('Jedzenie')
    expect(onNameChange).toHaveBeenCalledWith('Jedzenie')
    expect(onAddSymbol).toHaveBeenCalledOnce()
    const startButton = screen.getByRole('button', { name: 'Uruchom tablicę' })
    fireEvent.click(startButton)
    expect(onStartUse).toHaveBeenCalledOnce()
    expect(screen.getByText('Zapisano wszystkie zmiany')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cofnij' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Ponów' })).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Pełny ekran' }),
    ).not.toBeInTheDocument()
  })

  it.each<[SaveStatus, string]>([
    ['saving', 'Zapisywanie…'],
    ['saved', 'Zapisano wszystkie zmiany'],
    ['error', 'Nie udało się zapisać zmian'],
  ])('presents the %s save status accessibly', (saveStatus, label) => {
    render(<Board board={makeBoard()} mode="edit" saveStatus={saveStatus} />)

    expect(screen.getByRole('status')).toHaveTextContent(label)
  })

  it('shows the edit empty state and add action', () => {
    render(<Board board={makeBoard()} mode="edit" onAddSymbol={() => undefined} />)

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Ta tablica nie ma jeszcze symboli.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Dodaj pierwszy symbol, aby rozpocząć tworzenie tablicy.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dodaj symbol/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Symbole' })).not.toBeInTheDocument()
  })

  it('shows a quiet use-mode empty state without editing features', () => {
    render(<Board board={makeBoard()} mode="use" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Potrzeby' })).toBeInTheDocument()
    expect(screen.getByText('Ta tablica nie ma jeszcze symboli.')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Dodaj symbol/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Uruchom tablicę' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cofnij' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ponów' })).not.toBeInTheDocument()
    expect(screen.queryByText('Eksportuj tablicę')).not.toBeInTheDocument()
    expect(screen.queryByText('Usuń tablicę')).not.toBeInTheDocument()
  })

  it('provides only home and full-screen actions in the use toolbar', () => {
    const onBack = vi.fn()
    render(
      <Board
        board={makeBoard()}
        mode="use"
        onBack={onBack}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Strona główna/ }))

    expect(onBack).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Pełny ekran' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Powtórz' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Więcej opcji tablicy')).not.toBeInTheDocument()
  })

  it('shows only the workspace in full screen and provides an exit button', () => {
    const originalRequestDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'requestFullscreen',
    )
    const originalExitDescriptor = Object.getOwnPropertyDescriptor(
      document,
      'exitFullscreen',
    )
    const originalElementDescriptor = Object.getOwnPropertyDescriptor(
      document,
      'fullscreenElement',
    )
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    const exitFullscreen = vi.fn().mockResolvedValue(undefined)
    let fullscreenElement: Element | null = null

    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    })
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    })

    try {
      render(<Board board={makeBoard()} mode="use" />)
      const workspace = screen.getByRole('region', {
        name: 'Ta tablica nie ma jeszcze symboli.',
      })

      fireEvent.click(screen.getByRole('button', { name: 'Pełny ekran' }))
      expect(requestFullscreen).toHaveBeenCalledOnce()
      expect(requestFullscreen.mock.instances[0]).toBe(workspace)

      fullscreenElement = workspace
      fireEvent(document, new Event('fullscreenchange'))
      fireEvent.click(
        screen.getByRole('button', { name: 'Zamknij pełny ekran' }),
      )

      expect(exitFullscreen).toHaveBeenCalledOnce()
    } finally {
      if (originalRequestDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          'requestFullscreen',
          originalRequestDescriptor,
        )
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>)
          .requestFullscreen
      }
      if (originalExitDescriptor) {
        Object.defineProperty(
          document,
          'exitFullscreen',
          originalExitDescriptor,
        )
      } else {
        delete (document as Partial<Document>).exitFullscreen
      }
      if (originalElementDescriptor) {
        Object.defineProperty(
          document,
          'fullscreenElement',
          originalElementDescriptor,
        )
      }
    }
  })

  it('supports keyboard focus navigation and Escape in the more menu', () => {
    render(<Board board={makeBoard()} mode="edit" />)

    const moreButton = screen.getByRole('button', {
      name: 'Więcej opcji tablicy',
    })
    fireEvent.click(moreButton)

    const exportAction = screen.getByRole('menuitem', {
      name: 'Eksportuj tablicę',
    })
    expect(exportAction).toHaveFocus()
    expect(exportAction).toHaveAttribute('aria-disabled', 'true')
    const deleteAction = screen.getByRole('menuitem', { name: 'Usuń tablicę' })
    expect(deleteAction).toHaveAttribute('aria-disabled', 'true')

    fireEvent.keyDown(exportAction, { key: 'ArrowDown' })
    expect(deleteAction).toHaveFocus()
    fireEvent.keyDown(deleteAction, { key: 'ArrowUp' })
    expect(exportAction).toHaveFocus()
    fireEvent.keyDown(exportAction, { key: 'End' })
    expect(deleteAction).toHaveFocus()

    fireEvent.keyDown(deleteAction, { key: 'Escape' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(moreButton).toHaveFocus()
  })

  it('uses the board column count in the symbol grid', () => {
    render(
      <Board board={makeBoard(true)} mode="use">
        <li>Przyszły symbol</li>
      </Board>,
    )

    const grid = screen.getByRole('list')
    expect(grid.style.getPropertyValue('--board-columns')).toBe('5')
    expect(
      screen.queryByRole('button', { name: /Dodaj symbol/ }),
    ).not.toBeInTheDocument()
  })
})
