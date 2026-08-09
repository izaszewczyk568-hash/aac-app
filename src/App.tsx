import { useState } from 'react'
import { Board, type BoardMode, type SaveStatus } from './components/Board/Board'
import { createBoard } from './domain/communicationBook'

const demoBoard = createBoard({
  id: 'demo-board',
  communicationBookId: 'demo-book',
  name: 'Jedzenie',
  columns: 4,
  symbols: [],
  createdAt: '2026-08-09T12:00:00.000Z',
})

export function App() {
  const [mode, setMode] = useState<BoardMode>('edit')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [board, setBoard] = useState(demoBoard)

  return (
    <div className="demo">
      <aside className="demo__toolbar" aria-label="Sterowanie demonstracją">
        <p className="demo__label">Podgląd developerski Board</p>
        <fieldset>
          <legend>Tryb demonstracji</legend>
          <label>
            <input
              type="radio"
              name="demo-mode"
              value="edit"
              checked={mode === 'edit'}
              onChange={() => setMode('edit')}
            />
            Edit
          </label>
          <label>
            <input
              type="radio"
              name="demo-mode"
              value="use"
              checked={mode === 'use'}
              onChange={() => setMode('use')}
            />
            Use
          </label>
        </fieldset>

        {mode === 'edit' && (
          <label className="demo__status-control">
            Stan zapisu
            <select
              value={saveStatus}
              onChange={(event) =>
                setSaveStatus(event.target.value as SaveStatus)
              }
            >
              <option value="saved">Saved</option>
              <option value="saving">Saving</option>
              <option value="error">Error</option>
            </select>
          </label>
        )}
      </aside>

      <Board
        board={board}
        mode={mode}
        saveStatus={saveStatus}
        onNameChange={(name) => setBoard((current) => ({ ...current, name }))}
        onStartUse={() => setMode('use')}
      />
    </div>
  )
}
