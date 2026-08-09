import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSpeechService } from './speechService'

afterEach(() => vi.unstubAllGlobals())

describe('speechService', () => {
  it('speaks locally after cancelling the previous utterance', () => {
    const cancel = vi.fn()
    const speak = vi.fn()
    const Utterance = vi.fn(function (this: { text: string }, text: string) {
      this.text = text
    })
    vi.stubGlobal('speechSynthesis', { cancel, speak })
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)

    expect(createSpeechService().speak(' Woda ')).toBe('spoken')
    expect(cancel).toHaveBeenCalledOnce()
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'Woda' }))
  })

  it('handles empty text and missing support without throwing', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    vi.stubGlobal('SpeechSynthesisUtterance', undefined)
    const service = createSpeechService()

    expect(service.speak('   ')).toBe('empty')
    expect(service.speak('Woda')).toBe('unsupported')
    expect(service.isSupported()).toBe(false)
  })
})
