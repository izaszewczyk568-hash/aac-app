import { expect, test, type Page } from '@playwright/test'

const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
const now = '2026-08-09T12:00:00.000Z'

function board(id: string, name: string, symbols: unknown[] = []) {
  return {
    id,
    communicationBookId: 'pwa-book',
    name,
    columns: 4,
    defaultDwellTime: 1000,
    defaultBorderColor: '#000000',
    defaultTextColor: '#000000',
    defaultBorderWidth: 2,
    symbols,
    createdAt: now,
    updatedAt: now,
  }
}

function backup() {
  const symbol = {
    id: 'pwa-symbol',
    boardId: 'pwa-main',
    label: 'Przejdź dalej',
    image: {
      id: 'pwa-image',
      mimeType: 'image/png',
      width: 1,
      height: 1,
      rotation: 0,
      scale: 1,
    },
    position: 0,
    borderColor: '#000000',
    textColor: '#000000',
    borderWidth: 2,
    linkedBoardId: 'pwa-second',
    dwellTime: null,
    createdAt: now,
    updatedAt: now,
  }
  return {
    format: 'aacbook',
    formatVersion: 1,
    schemaVersion: 4,
    communicationBook: {
      schemaVersion: 4,
      id: 'pwa-book',
      name: 'Księga offline',
      mainBoardId: 'pwa-main',
      boards: [board('pwa-main', 'Start', [symbol]), board('pwa-second', 'Druga tablica')],
      createdAt: now,
      updatedAt: now,
    },
    images: [{ id: 'pwa-image', mimeType: 'image/png', data: pngBase64 }],
  }
}

async function ensureServiceWorkerControls(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready)
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
}

test('manifest and versioned app shell cache are complete and scoped', async ({ page }) => {
  await page.goto('./')
  await ensureServiceWorkerControls(page)

  const manifest = await page.evaluate(() => fetch(new URL('manifest.webmanifest', window.location.href)).then((response) => response.json()))
  expect(manifest).toMatchObject({
    name: 'AAC',
    short_name: 'AAC',
    start_url: './',
    scope: './',
    display: 'standalone',
  })
  expect(manifest.icons).not.toHaveLength(0)

  const cacheState = await page.evaluate(async () => {
    const names = await caches.keys()
    const requests = await Promise.all(names.map(async (name) => {
      const cache = await caches.open(name)
      return (await cache.keys()).map((request) => new URL(request.url).pathname)
    }))
    return { names, requests: requests.flat() }
  })
  expect(cacheState.names).toHaveLength(1)
  expect(cacheState.names[0]).toMatch(/^aac-app-shell-/)
  const basePath = new URL('.', page.url()).pathname
  expect(cacheState.requests).toContain(`${basePath}index.html`)
  expect(cacheState.requests).toContain(`${basePath}manifest.webmanifest`)
  expect(cacheState.requests.some((path) => /\/assets\/.*\.js$/.test(path))).toBe(true)
  expect(cacheState.requests.some((path) => path.endsWith('.aacbook') || path.startsWith('blob:'))).toBe(false)
})

test('imported book, image, editing and linked-board navigation work offline', async ({ page, context }) => {
  await page.goto('./')
  await ensureServiceWorkerControls(page)
  await page.getByLabel('Wybierz plik kopii księgi AAC').setInputFiles({
    name: 'offline.aacbook',
    mimeType: 'application/vnd.aacbook+json',
    buffer: Buffer.from(JSON.stringify(backup())),
  })
  await expect(page.getByRole('heading', { name: 'Księga offline' }).first()).toBeVisible()

  await context.setOffline(true)
  try {
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Rozpocznij pracę z Księgą AAC' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Księga offline' })).toBeVisible()
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await expect(page.getByText('Pracujesz offline')).toBeVisible()
    await page.getByRole('button', { name: 'Wybierz księgę Księga offline' }).click()
    await page.getByRole('button', { name: 'Wybierz tablicę Start' }).click()
    await expect(page.locator('.symbol-tile__image')).toBeVisible()

    await page.getByRole('button', { name: 'Edytuj tablicę' }).click()
    const nameInput = page.getByRole('textbox', { name: 'Nazwa tablicy' })
    await nameInput.fill('Start offline')
    await expect(page.getByText('Zapisano wszystkie zmiany')).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: 'Wybierz księgę Księga offline' }).click()
    await page.getByRole('button', { name: 'Wybierz tablicę Start offline' }).click()
    await page.getByRole('button', { name: 'Przejdź dalej' }).click()
    await expect(page.getByRole('heading', { name: 'Druga tablica' })).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
