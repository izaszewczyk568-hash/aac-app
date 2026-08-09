import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PwaStatus } from './PwaStatus'

describe('PwaStatus', () => {
  it('shows a subtle offline status without moving focus', () => {
    render(<PwaStatus flushPendingWrites={vi.fn()} />)
    fireEvent(window, new Event('offline'))
    expect(screen.getByText('Pracujesz offline')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('updates only after a successful persistence flush', async () => {
    let notify: ((update: { activate: () => Promise<void> }) => void) | undefined
    const flush = vi.fn().mockResolvedValue(undefined)
    const activate = vi.fn().mockResolvedValue(undefined)
    const reload = vi.fn()
    render(<PwaStatus flushPendingWrites={flush} register={async (handler) => { notify = handler }} reload={reload} registrationEnabled />)
    await waitFor(() => expect(notify).toBeDefined())
    notify?.({ activate })
    fireEvent.click(await screen.findByRole('button', { name: 'Zaktualizuj teraz' }))
    await waitFor(() => expect(reload).toHaveBeenCalledOnce())
    expect(flush).toHaveBeenCalledBefore(activate)
    expect(activate).toHaveBeenCalledBefore(reload)
  })

  it('shows retry and never activates an update after a failed flush', async () => {
    let notify: ((update: { activate: () => Promise<void> }) => void) | undefined
    const activate = vi.fn()
    const reload = vi.fn()
    render(<PwaStatus flushPendingWrites={() => Promise.reject(new Error('save'))} register={async (handler) => { notify = handler }} reload={reload} registrationEnabled />)
    await waitFor(() => expect(notify).toBeDefined())
    notify?.({ activate })
    fireEvent.click(await screen.findByRole('button', { name: 'Zaktualizuj teraz' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Spróbuj ponownie' })).toBeInTheDocument()
    expect(activate).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})
