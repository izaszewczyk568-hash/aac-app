import { describe, expect, it, vi } from 'vitest'
import {
  MAX_IMAGE_FILE_SIZE,
  calculateImageDimensions,
  processImageFile,
  validateImageFile,
} from './processImage'

function imageFile(type = 'image/png', size = 4) {
  return new File([new Uint8Array(size)], 'test-image', { type })
}

describe('image processing', () => {
  it('rejects files larger than 10 MB', () => {
    expect(() =>
      validateImageFile(imageFile('image/png', MAX_IMAGE_FILE_SIZE + 1)),
    ).toThrow('Obraz jest większy niż dozwolone 10 MB.')
  })

  it('rejects unsupported formats before decoding', () => {
    expect(() => validateImageFile(imageFile('image/svg+xml'))).toThrow(
      'JPEG, PNG lub WebP',
    )
  })

  it('preserves proportions and limits the longest side to 512 px', () => {
    expect(calculateImageDimensions(1600, 800)).toEqual({
      width: 512,
      height: 256,
    })
    expect(calculateImageDimensions(300, 400)).toEqual({
      width: 300,
      height: 400,
    })
  })

  it('returns only the optimized blob and metadata', async () => {
    const close = vi.fn()
    const encode = vi.fn().mockResolvedValue(
      new Blob([new Uint8Array(120_000)], { type: 'image/webp' }),
    )
    const result = await processImageFile(imageFile(), {
      decode: vi.fn().mockResolvedValue({
        source: {} as CanvasImageSource,
        width: 1024,
        height: 512,
        close,
      }),
      encode,
    })

    expect(result).toMatchObject({
      width: 512,
      height: 256,
      mimeType: 'image/webp',
    })
    expect(result).not.toHaveProperty('original')
    expect(encode).toHaveBeenCalledWith(
      expect.anything(),
      512,
      256,
      'image/webp',
      0.8,
    )
    expect(close).toHaveBeenCalledOnce()
  })

  it('retries compression when the first result is over 500 KB', async () => {
    const encode = vi
      .fn()
      .mockResolvedValueOnce(
        new Blob([new Uint8Array(600_000)], { type: 'image/webp' }),
      )
      .mockResolvedValueOnce(
        new Blob([new Uint8Array(300_000)], { type: 'image/webp' }),
      )

    const result = await processImageFile(imageFile(), {
      decode: vi.fn().mockResolvedValue({
        source: {} as CanvasImageSource,
        width: 512,
        height: 512,
      }),
      encode,
    })

    expect(encode).toHaveBeenCalledTimes(2)
    expect(result.blob.size).toBe(300_000)
  })

  it('normalizes a damaged image decoding failure', async () => {
    await expect(
      processImageFile(imageFile(), {
        decode: vi.fn().mockRejectedValue(new Error('broken')),
        encode: vi.fn(),
      }),
    ).rejects.toMatchObject({ code: 'decode-failed' })
  })

  it('normalizes a resize or compression failure', async () => {
    await expect(
      processImageFile(imageFile(), {
        decode: vi.fn().mockResolvedValue({
          source: {} as CanvasImageSource,
          width: 512,
          height: 512,
        }),
        encode: vi.fn().mockRejectedValue(new Error('canvas failed')),
      }),
    ).rejects.toMatchObject({ code: 'processing-failed' })
  })
})
