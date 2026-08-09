import type { CSSProperties } from 'react'
import type { Symbol as SymbolModel } from '../../domain/communicationBook'
import './SymbolTile.css'

export interface SymbolTileProps {
  symbol: SymbolModel
  imageSource?: string
  mode: 'edit' | 'use'
  selected?: boolean
  onSelect?: (symbolId: string) => void
}

export function SymbolTile({
  symbol,
  imageSource,
  mode,
  selected = false,
  onSelect,
}: SymbolTileProps) {
  const label = symbol.label.trim()
  const accessibleLabel = label || 'Symbol bez podpisu'
  const tileStyle = {
    '--symbol-border-color': symbol.borderColor,
    '--symbol-border-width': `${symbol.borderWidth}px`,
    '--symbol-text-color': symbol.textColor,
  } as CSSProperties
  const imageStyle = symbol.image
    ? {
        transform: `rotate(${symbol.image.rotation}deg) scale(${symbol.image.scale})`,
      }
    : undefined
  const content = (
    <>
      <span className="symbol-tile__label" aria-hidden={!label}>
        {label || (mode === 'edit' ? 'Bez podpisu' : '\u00a0')}
      </span>
      <span className="symbol-tile__image-area">
        {imageSource && (
          <img
            src={imageSource}
            alt=""
            className="symbol-tile__image"
            style={imageStyle}
          />
        )}
      </span>
      {selected && <span className="symbol-tile__selected-label">Wybrano</span>}
      {mode === 'use' && !label && (
        <span className="symbol-tile__visually-hidden">Symbol bez podpisu</span>
      )}
    </>
  )

  return (
    <li className="symbol-tile-wrapper">
      {mode === 'edit' ? (
        <button
          data-symbol-id={symbol.id}
          type="button"
          className="symbol-tile symbol-tile--interactive"
          style={tileStyle}
          aria-label={`Wybierz symbol: ${accessibleLabel}`}
          aria-pressed={selected}
          onClick={() => onSelect?.(symbol.id)}
        >
          {content}
        </button>
      ) : (
        <div className="symbol-tile" style={tileStyle} data-symbol-id={symbol.id}>
          {content}
        </div>
      )}
    </li>
  )
}
