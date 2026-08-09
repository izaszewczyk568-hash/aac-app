export type SpeechResult = 'spoken' | 'empty' | 'unsupported' | 'error'

export interface SpeechService {
  speak: (text: string) => SpeechResult
  stop: () => void
  isSupported: () => boolean
}

export function createSpeechService(): SpeechService {
  const synthesis = () =>
    typeof window !== 'undefined' ? window.speechSynthesis : undefined

  return {
    isSupported: () =>
      Boolean(synthesis() && typeof window.SpeechSynthesisUtterance === 'function'),
    speak(text) {
      const message = text.trim()
      if (!message) return 'empty'
      const engine = synthesis()
      if (!engine || typeof window.SpeechSynthesisUtterance !== 'function') {
        return 'unsupported'
      }
      try {
        engine.cancel()
        engine.speak(new window.SpeechSynthesisUtterance(message))
        return 'spoken'
      } catch {
        return 'error'
      }
    },
    stop() {
      try {
        synthesis()?.cancel()
      } catch {
        // Speech cancellation is best-effort and cannot block visual AAC.
      }
    },
  }
}

export const browserSpeechService = createSpeechService()
