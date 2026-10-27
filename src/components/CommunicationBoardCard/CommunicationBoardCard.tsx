import { useRef, useState, type CSSProperties } from 'react'
import { ArrowRight02Icon, GridViewIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { Board } from '../../domain/communicationBook'
import './CommunicationBoardCard.css'

export interface CommunicationBoardCardProps {
  board: Board
  imageSource?: string
  isMainBoard?: boolean
  dwellEnabled?: boolean
  onSelect: () => void
}

export function CommunicationBoardCard({
  board,
  imageSource,
  isMainBoard = false,
  dwellEnabled = false,
  onSelect,
}: CommunicationBoardCardProps) {
  const displayName = board.name.trim() || 'Tablica bez tytułu'
  const [isDwelling, setIsDwelling] = useState(false)
  const dwellConsumed = useRef(false)

  function selectBoard() {
    dwellConsumed.current = true
    setIsDwelling(false)
    onSelect()
  }

  return (
    <button
      type="button"
      className="communication-board-card"
      aria-label={`Wybierz tablicę ${displayName}`}
      style={{ '--board-card-dwell-duration': `${board.defaultDwellTime}ms` } as CSSProperties}
      onClick={selectBoard}
      onPointerEnter={() => {
        if (dwellEnabled && !dwellConsumed.current) setIsDwelling(true)
      }}
      onPointerLeave={() => {
        setIsDwelling(false)
        dwellConsumed.current = false
      }}
    >
      <span className="communication-board-card__preview" aria-hidden="true">
        {imageSource
          ? <img src={imageSource} alt="" />
          : <HugeiconsIcon icon={GridViewIcon} size={52} strokeWidth={1.4} />}
      </span>
      <span className="communication-board-card__details">
        <span>
          <span className="communication-board-card__title">{displayName}</span>
          {isMainBoard && <span className="communication-board-card__badge">Tablica główna</span>}
        </span>
        <HugeiconsIcon icon={ArrowRight02Icon} size={22} strokeWidth={2} aria-hidden="true" />
      </span>
      {isDwelling && (
        <span
          className="communication-board-card__dwell-progress"
          aria-hidden="true"
          onAnimationEnd={() => {
            if (!dwellConsumed.current) selectBoard()
          }}
        />
      )}
    </button>
  )
}
