import { useEffect, useState } from 'react'
import { applyPwaUpdate, registerPwa, type WaitingPwaUpdate } from '../../pwa/pwaClient'
import './PwaStatus.css'

export interface PwaStatusProps {
  flushPendingWrites: () => Promise<void>
  register?: (handler: (update: WaitingPwaUpdate) => void) => Promise<void>
  reload?: () => void
  registrationEnabled?: boolean
}

export function PwaStatus({
  flushPendingWrites,
  register = registerPwa,
  reload = () => window.location.reload(),
  registrationEnabled = import.meta.env.PROD,
}: PwaStatusProps) {
  const previewState = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('pwa')
    : null
  const [isOffline, setIsOffline] = useState(previewState === 'offline' || !navigator.onLine)
  const [update, setUpdate] = useState<WaitingPwaUpdate | null>(
    previewState === 'update' || previewState === 'error'
      ? { activate: previewState === 'error' ? () => Promise.reject(new Error('preview')) : () => Promise.resolve() }
      : null,
  )
  const [updateError, setUpdateError] = useState(previewState === 'error')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const online = () => setIsOffline(false)
    const offline = () => setIsOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    if (registrationEnabled) void register(setUpdate).catch(() => undefined)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [register, registrationEnabled])

  async function updateNow() {
    if (!update || isUpdating) return
    setIsUpdating(true)
    setUpdateError(false)
    try {
      await applyPwaUpdate({
        flushPendingWrites,
        activateUpdate: update.activate,
        reload,
      })
    } catch {
      setUpdateError(true)
      setIsUpdating(false)
    }
  }

  return (
    <div className="pwa-status">
      {isOffline && <p className="pwa-status__offline">Pracujesz offline</p>}
      {update && (
        <div className="pwa-status__update">
          <p role="status">Nowa wersja aplikacji jest dostępna.</p>
          <button type="button" onClick={() => void updateNow()} disabled={isUpdating}>
            {isUpdating ? 'Aktualizowanie…' : updateError ? 'Spróbuj ponownie' : 'Zaktualizuj teraz'}
          </button>
          {updateError && <p role="alert">Nie udało się bezpiecznie zapisać zmian i zaktualizować aplikacji.</p>}
        </div>
      )}
    </div>
  )
}
