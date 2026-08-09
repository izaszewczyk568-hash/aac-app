import { describe, expect, it, vi } from 'vitest'
import { applyPwaUpdate } from './pwaClient'

describe('applyPwaUpdate', () => {
  it('flushes persistence before activating and reloading', async () => {
    const order: string[] = []
    await applyPwaUpdate({
      flushPendingWrites: async () => { order.push('flush') },
      activateUpdate: async () => { order.push('activate') },
      reload: () => { order.push('reload') },
    })
    expect(order).toEqual(['flush', 'activate', 'reload'])
  })

  it('does not activate or reload when persistence flush fails', async () => {
    const activateUpdate = vi.fn()
    const reload = vi.fn()
    await expect(applyPwaUpdate({
      flushPendingWrites: () => Promise.reject(new Error('save failed')),
      activateUpdate,
      reload,
    })).rejects.toThrow('save failed')
    expect(activateUpdate).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})
