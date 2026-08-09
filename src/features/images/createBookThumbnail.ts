import type { CommunicationBook } from '../../domain/communicationBook'

export const BOOK_THUMBNAIL_WIDTH = 480
export const BOOK_THUMBNAIL_HEIGHT = 270

export function findBookThumbnailImageId(
  book: CommunicationBook,
  availableImageIds?: ReadonlySet<string>,
): string | null {
  const mainBoard = book.boards.find((board) => board.id === book.mainBoardId)
  if (!mainBoard) return null

  return [...mainBoard.symbols]
    .sort((first, second) => first.position - second.position)
    .find((symbol) => symbol.image && (!availableImageIds || availableImageIds.has(symbol.image.id)))
    ?.image?.id ?? null
}

export async function createBookThumbnailPng(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = BOOK_THUMBNAIL_WIDTH
    canvas.height = BOOK_THUMBNAIL_HEIGHT
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D is unavailable.')

    const scale = Math.max(
      BOOK_THUMBNAIL_WIDTH / bitmap.width,
      BOOK_THUMBNAIL_HEIGHT / bitmap.height,
    )
    const width = bitmap.width * scale
    const height = bitmap.height * scale
    context.drawImage(
      bitmap,
      (BOOK_THUMBNAIL_WIDTH - width) / 2,
      (BOOK_THUMBNAIL_HEIGHT - height) / 2,
      width,
      height,
    )

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('PNG encoding failed.')),
        'image/png',
      )
    })
  } finally {
    bitmap.close()
  }
}
