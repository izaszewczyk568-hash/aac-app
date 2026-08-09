export interface WaitingPwaUpdate {
  activate(): Promise<void>
}

export type UpdateAvailableHandler = (update: WaitingPwaUpdate) => void

export async function registerPwa(onUpdateAvailable: UpdateAvailableHandler): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

  const notifyWaiting = () => {
    if (!registration.waiting) return
    onUpdateAvailable({
      activate: () => new Promise<void>((resolve, reject) => {
        const waiting = registration.waiting
        if (!waiting) {
          reject(new Error('No waiting application update.'))
          return
        }
        const timeout = window.setTimeout(() => reject(new Error('Application update timed out.')), 10000)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.clearTimeout(timeout)
          resolve()
        }, { once: true })
        waiting.postMessage({ type: 'SKIP_WAITING' })
      }),
    })
  }

  notifyWaiting()
  registration.addEventListener('updatefound', () => {
    const installing = registration.installing
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) notifyWaiting()
    })
  })
}

export async function applyPwaUpdate(options: {
  flushPendingWrites: () => Promise<void>
  activateUpdate: () => Promise<void>
  reload: () => void
}): Promise<void> {
  await options.flushPendingWrites()
  await options.activateUpdate()
  options.reload()
}
