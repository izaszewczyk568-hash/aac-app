import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('wyświetla dostępny ekran startowy', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'AAC' })).toBeInTheDocument()
    expect(screen.getByText('Aplikacja AAC jest w budowie.')).toBeInTheDocument()
  })
})
