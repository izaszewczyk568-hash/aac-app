import { describe, expect, it } from 'vitest'
import { createCommunicationBook } from '../domain/communicationBook'
import { MemoryCommunicationBookRepository } from './communicationBookRepository'

describe('MemoryCommunicationBookRepository', () => {
  it('deletes one complete book bundle without touching another book or its images', async () => {
    const repository = new MemoryCommunicationBookRepository()
    const first = createCommunicationBook({ id: 'first', name: 'Pierwsza' })
    const second = createCommunicationBook({ id: 'second', name: 'Druga' })
    await repository.saveBundles([
      { book: first, images: new Map([['first-image', new Blob(['first'])]]) },
      { book: second, images: new Map([['second-image', new Blob(['second'])]]) },
    ])

    await repository.deleteBooks([first.id])

    expect((await repository.listBooks()).map((book) => book.id)).toEqual(['second'])
    expect(await repository.getImagesForBook(first.id)).toEqual(new Map())
    expect([...await repository.getImagesForBook(second.id).then((images) => images.keys())]).toEqual(['second-image'])
  })
})
