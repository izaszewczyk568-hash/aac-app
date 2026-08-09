import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('przełącza demonstrację Board między trybem edit i use', () => {
    render(<App />)

    expect(screen.getByRole('radio', { name: 'Edit' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: 'Nazwa tablicy' })).toHaveValue(
      'Jedzenie',
    )
    expect(screen.getByText('Zapisano wszystkie zmiany')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Use' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Jedzenie' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Stan zapisu')).not.toBeInTheDocument()
  })

  it('keeps demo name changes in local React state', () => {
    render(<App />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Nazwa tablicy' }), {
      target: { value: 'Napoje' },
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Use' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Napoje' })).toBeInTheDocument()
  })
})
