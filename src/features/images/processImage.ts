export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024
export const MAX_IMAGE_DIMENSION = 512
export const RETRY_SIZE_THRESHOLD = 500 * 1024

const supportedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export type ImageProcessingErrorCode =
  | 'file-too-large'
  | 'unsupported-format'
  | 'decode-failed'
  | 'processing-failed'

export class ImageProcessingError extends Error {
  constructor(
    public readonly code: ImageProcessingErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ImageProcessingError'
  }
}

export interface ProcessedImage {
  blob: Blob
  width: number
  height: number
  mimeType: string
}

interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  close?: () => void
}

interface ImageProcessingAdapters {
  decode: (file: File) => Promise<DecodedImage>
  encode: (
    image: DecodedImage,
    width: number,
    height: number,
    mimeType: string,
    quality: number,
  ) => Promise<Blob>
}

export function validateImageFile(file: File): void {
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new ImageProcessingError(
      'file-too-large',
      'Obraz jest większy niż dozwolone 10 MB.',
    )
  }

  if (!supportedImageTypes.has(file.type)) {
    throw new ImageProcessingError(
      'unsupported-format',
      'Wybierz obraz w formacie JPEG, PNG lub WebP.',
    )
  }
}

export function calculateImageDimensions(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    throw new ImageProcessingError(
      'decode-failed',
      'Nie udało się odczytać wymiarów obrazu.',
    )
  }

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function decodeImage(file: File): Promise<DecodedImage> {
  try {
    const bitmap = await createImageBitmap(file)
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    }
  } catch {
    throw new ImageProcessingError(
      'decode-failed',
      'Nie udało się odczytać obrazu. Plik może być uszkodzony.',
    )
  }
}

function encodeImage(
  image: DecodedImage,
  width: number,
  height: number,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) {
    throw new ImageProcessingError(
      'processing-failed',
      'Nie udało się przygotować obrazu.',
    )
  }

  context.drawImage(image.source, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(
            new ImageProcessingError(
              'processing-failed',
              'Nie udało się skompresować obrazu.',
            ),
          )
        }
      },
      mimeType,
      quality,
    )
  })
}

const defaultAdapters: ImageProcessingAdapters = {
  decode: decodeImage,
  encode: encodeImage,
}

export async function processImageFile(
  file: File,
  adapters: ImageProcessingAdapters = defaultAdapters,
): Promise<ProcessedImage> {
  validateImageFile(file)

  let image: DecodedImage
  try {
    image = await adapters.decode(file)
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error
    throw new ImageProcessingError(
      'decode-failed',
      'Nie udało się odczytać obrazu. Plik może być uszkodzony.',
    )
  }

  try {
    const dimensions = calculateImageDimensions(image.width, image.height)
    let blob = await adapters.encode(
      image,
      dimensions.width,
      dimensions.height,
      'image/webp',
      0.8,
    )

    if (blob.size > RETRY_SIZE_THRESHOLD) {
      blob = await adapters.encode(
        image,
        dimensions.width,
        dimensions.height,
        'image/webp',
        0.7,
      )
    }

    return {
      blob,
      ...dimensions,
      mimeType: blob.type || 'image/webp',
    }
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error
    throw new ImageProcessingError(
      'processing-failed',
      'Nie udało się zmniejszyć lub skompresować obrazu.',
    )
  } finally {
    image.close?.()
  }
}
