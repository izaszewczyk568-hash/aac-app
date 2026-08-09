import { describe, expect, it, vi } from 'vitest'
import { AutosaveCoordinator } from './autosaveCoordinator'

describe('AutosaveCoordinator', () => {
  it('flushes the latest debounced write before resolving', async () => {
    vi.useFakeTimers()
    const coordinator = new AutosaveCoordinator()
    const first = vi.fn().mockResolvedValue(undefined)
    const latest = vi.fn().mockResolvedValue(undefined)
    coordinator.schedule('book-1', first)
    coordinator.schedule('book-1', latest)

    await coordinator.flush()

    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('rejects flush when a pending repository write fails', async () => {
    const coordinator = new AutosaveCoordinator()
    coordinator.schedule('book-1', () => Promise.reject(new Error('write failed')))
    await expect(coordinator.flush()).rejects.toThrow('write failed')
  })

  it('also flushes a write scheduled while another write is active', async () => {
    const coordinator = new AutosaveCoordinator()
    let finishFirst: (() => void) | undefined
    const first = new Promise<void>((resolve) => { finishFirst = resolve })
    const second = vi.fn().mockResolvedValue(undefined)
    coordinator.track(first)

    const flushing = coordinator.flush()
    coordinator.schedule('book-2', second)
    finishFirst?.()
    await flushing

    expect(second).toHaveBeenCalledOnce()
  })
})
