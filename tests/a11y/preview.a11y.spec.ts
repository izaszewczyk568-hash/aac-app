import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

async function addSymbol(page: Page, name = 'symbol.png') {
  await page.getByLabel('Wybierz obraz symbolu').setInputFiles({
    name,
    mimeType: 'image/png',
    buffer: transparentPng,
  })
  await expect(
    page.getByRole('button', { name: 'Wybierz symbol: Symbol bez podpisu' }),
  ).toBeVisible()
}

async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([])
}

async function openBoardPreview(page: Page) {
  await page.getByRole('button', { name: 'Demo Board' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('empty Board edit', async ({ page }) => {
  await openBoardPreview(page)
  await expect(page.getByRole('textbox', { name: 'Nazwa tablicy' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Board edit with SymbolTile', async ({ page }) => {
  await openBoardPreview(page)
  await addSymbol(page)
  await expectNoA11yViolations(page)
})

test('Board edit with selected SymbolTile', async ({ page }) => {
  await openBoardPreview(page)
  await addSymbol(page)
  await expect(
    page.getByRole('button', { name: /Wybierz symbol/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('complementary', { name: 'Ustawienia symbolu' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('SymbolInspector fits a narrow viewport without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await openBoardPreview(page)
  await addSymbol(page)
  const inspector = page.getByRole('complementary', { name: 'Ustawienia symbolu' })
  await expect(inspector).toBeVisible()
  const bounds = await inspector.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
  expect(await inspector.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await expectNoA11yViolations(page)
  await page.locator('.symbol-inspector__backdrop').click({ position: { x: 4, y: 4 } })
  await expect(inspector).toBeHidden()
})

test('SymbolInspector delete confirmation', async ({ page }) => {
  await openBoardPreview(page)
  await addSymbol(page)
  await page.getByRole('button', { name: 'Usuń symbol' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Board edit with open More menu', async ({ page }) => {
  await openBoardPreview(page)
  await page.getByRole('button', { name: 'Więcej opcji tablicy' }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Board edit with open BoardSettings', async ({ page }) => {
  await openBoardPreview(page)
  await page.getByRole('button', { name: 'Więcej opcji tablicy' }).click()
  await page.getByRole('menuitem', { name: 'Ustawienia tablicy' }).click()
  await expect(page.getByRole('dialog', { name: 'Ustawienia tablicy' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('empty Board use', async ({ page }) => {
  await openBoardPreview(page)
  await page.getByRole('radio', { name: 'Use' }).check()
  await expect(page.getByRole('heading', { name: 'Jedzenie' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Board use with symbols', async ({ page }) => {
  await openBoardPreview(page)
  await addSymbol(page)
  await page.keyboard.press('Escape')
  await page.getByRole('radio', { name: 'Use' }).check()
  const symbol = page.getByRole('button', { name: 'Symbol bez podpisu' })
  await expect(symbol).toBeVisible()
  await symbol.focus()
  await expectNoA11yViolations(page)
  await symbol.click()
  await expect(page.getByText('Aktywowano')).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Board use with dwell progress', async ({ page }) => {
  await openBoardPreview(page)
  await addSymbol(page)
  await page.keyboard.press('Escape')
  await page.getByRole('radio', { name: 'Use' }).check()
  await page.getByLabel('Sterowanie wzrokiem (dwell)').check()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(550)
  await page.getByRole('button', { name: 'Symbol bez podpisu' }).hover()
  await expect(page.locator('.symbol-tile__dwell-progress')).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Board use activates a symbol with Enter and Space', async ({ page }) => {
  await openBoardPreview(page)
  await addSymbol(page)
  await page.keyboard.press('Escape')
  await page.getByRole('radio', { name: 'Use' }).check()
  const symbol = page.getByRole('button', { name: 'Symbol bez podpisu' })

  await symbol.focus()
  await symbol.press('Enter')
  await expect(page.getByText('Aktywowano')).toBeVisible()
  await expect(page.getByText('Aktywowano')).toBeHidden({ timeout: 1500 })
  await symbol.press('Space')
  await expect(page.getByText('Aktywowano')).toBeVisible()
})

test('Home without recent books', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Rozpocznij pracę z Księgą AAC' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Wybierz księgę' })).toBeVisible()
  await expect(page.getByText(/Nie ma jeszcze żadnych ksiąg/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ostatnio używane' })).toHaveCount(0)
  await expectNoA11yViolations(page)
})

test('Home with the permanent book library', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  await expect(page.getByRole('heading', { name: 'Posiłki' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: /^Wybierz księgę/ })).toHaveCount(5)
  const cover = page.getByRole('button', { name: 'Wybierz księgę Posiłki' })
  await expect(cover.locator('img')).toBeVisible()
  await cover.hover()
  await expect(cover.locator('.book-card__dwell-progress')).toBeVisible()
  await page.mouse.move(0, 0)
  await expectNoA11yViolations(page)
})

test('full-screen child journey persists from books through Boards to symbols', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  await expect(page.getByRole('button', { name: 'Wybierz księgę Posiłki' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Uruchom pełnoekranowy tryb dziecka' }).click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(true)
  const childExit = page.getByRole('button', { name: 'Zamknij pełnoekranowy tryb dziecka' })
  await expect(childExit).toBeVisible()
  await childExit.hover()
  await expect(page.locator('.demo__exit-fullscreen-dwell-progress')).toBeVisible()
  await page.mouse.move(0, 0)
  await expect(page.getByRole('button', { name: 'Utwórz nową księgę' })).toBeHidden()
  await expect(page.locator('#home-title')).toBeHidden()
  await expect(page.locator('.home__library-heading')).toBeHidden()

  await page.getByRole('button', { name: 'Wybierz księgę Posiłki' }).click()
  await expect(page.locator('.book-view__heading')).toBeHidden()
  await expect(page.locator('#boards-title')).toBeHidden()
  await page.getByRole('button', { name: 'Wybierz tablicę Główna' }).click()
  await expect(page.getByRole('button', { name: 'Jedzenie' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(true)
  const boardExit = page.getByRole('button', { name: 'Zamknij pełny ekran' })
  await expect(boardExit).toBeVisible()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(550)
  await boardExit.hover()
  await expect(page.locator('.board__exit-fullscreen-dwell-progress')).toBeVisible()
  await page.mouse.move(0, 0)
  await expect(page.getByRole('button', { name: 'Edytuj tablicę' })).toBeHidden()
  await expectNoA11yViolations(page)

  await boardExit.click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true)
})

test('book and Board covers support the child dwell flow', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  const cover = page.getByRole('button', { name: 'Wybierz księgę Posiłki' })
  await expect(cover).toBeVisible({ timeout: 15_000 })
  await cover.hover()
  await expect(page.getByRole('heading', { level: 1, name: 'Posiłki' })).toBeVisible({ timeout: 4_000 })
  const boardCover = page.getByRole('button', { name: 'Wybierz tablicę Główna' })
  await expect(boardCover.locator('img')).toBeVisible()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(550)
  await boardCover.hover()
  await expect(page.getByRole('heading', { level: 1, name: 'Główna' })).toBeVisible({ timeout: 4_000 })
  await expect(page.getByRole('button', { name: 'Jedzenie' })).toBeVisible()
})

test('seeded CommunicationBook view and populated Board use', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  await expect(page.getByRole('heading', { name: 'Posiłki' })).toBeVisible({ timeout: 15_000 })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Posiłki' })).toBeVisible()
  await page.getByRole('button', { name: 'Wybierz księgę Posiłki' }).click()
  await page.getByRole('button', { name: 'Wybierz tablicę Główna' }).click()
  await expect(page.getByRole('button', { name: 'Jedzenie' })).toBeVisible()
  const tiles = page.locator('.symbol-tile')
  const images = page.locator('.symbol-tile__image')
  await expect(tiles).toHaveCount(5)
  await expect(images).toHaveCount(5)
  await expect.poll(() => images.evaluateAll((items) => items.every((item) => {
    const image = item as HTMLImageElement
    return image.complete && image.naturalWidth > 0
  }))).toBe(true)
  const tileSizes = await page.locator('.symbol-tile').evaluateAll((tiles) =>
    tiles.map((tile) => {
      const bounds = tile.getBoundingClientRect()
      return { width: bounds.width, height: bounds.height }
    }),
  )
  const viewportHeight = page.viewportSize()?.height ?? 720
  const tileHeights = tileSizes.map(({ height }) => height)
  expect(Math.min(...tileHeights)).toBeGreaterThanOrEqual(viewportHeight * 0.25)
  expect(Math.max(...tileHeights)).toBeLessThanOrEqual(viewportHeight / 3)
  expect(Math.max(...tileHeights) - Math.min(...tileHeights)).toBeLessThan(1)
  expect(Math.max(...tileSizes.map(({ width }) => width)) - Math.min(...tileSizes.map(({ width }) => width))).toBeLessThan(1)
  await expectNoA11yViolations(page)
})

test('Board use full screen keeps an accessible return to the previous Board', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  await expect(page.getByRole('heading', { name: 'Posiłki' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Wybierz księgę Posiłki' }).click()
  await page.getByRole('button', { name: 'Wybierz tablicę Główna' }).click()
  await page.getByRole('button', { name: 'Jedzenie' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Jedzenie' })).toBeVisible()

  await page.getByRole('button', { name: 'Pełny ekran' }).click()
  await expect(page.getByRole('button', {
    name: '← Wróć do poprzedniej tablicy',
  })).toBeVisible()
  await expectNoA11yViolations(page)
  await page.keyboard.press('Escape')
})

test('Home with an open book menu', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  await page.getByRole('button', { name: 'Więcej opcji księgi Posiłki' }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Eksportuj księgę Posiłki' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Home rename and delete book dialogs', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  await page.getByRole('button', { name: 'Więcej opcji księgi Posiłki' }).click()
  await page.getByRole('menuitem', { name: 'Edytuj księgę Posiłki' }).click()
  await expect(page.getByRole('dialog', { name: 'Edytuj księgę Posiłki' })).toBeVisible()
  await expectNoA11yViolations(page)
  await page.getByRole('button', { name: 'Anuluj' }).click()

  await page.getByRole('button', { name: 'Więcej opcji księgi Posiłki' }).click()
  await page.getByRole('menuitem', { name: 'Usuń księgę Posiłki' }).click()
  await expect(page.getByRole('alertdialog', { name: 'Usunąć księgę Posiłki?' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('SymbolInspector create linked Board dialog', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  await page.getByRole('button', { name: 'Wybierz księgę Posiłki' }).click()
  await page.getByRole('button', { name: 'Wybierz tablicę Główna' }).click()
  await page.getByRole('button', { name: 'Edytuj tablicę' }).click()
  await page.getByRole('button', { name: /Wybierz symbol/ }).first().click()
  await page.getByRole('button', { name: '+ Utwórz nową tablicę' }).click()
  await expect(page.getByRole('dialog', { name: 'Utwórz nową tablicę' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Home with an import error', async ({ page }) => {
  await page.getByLabel('Wybierz plik kopii księgi AAC').setInputFiles({
    name: 'broken.aacbook',
    mimeType: 'application/vnd.aacbook+json',
    buffer: Buffer.from('{'),
  })
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Spróbuj ponownie' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Home with a successful import', async ({ page }) => {
  const now = '2026-08-09T12:00:00.000Z'
  const backup = {
    format: 'aacbook',
    formatVersion: 1,
    schemaVersion: 4,
    communicationBook: {
      schemaVersion: 4,
      id: 'a11y-book',
      name: 'Księga testowa',
      mainBoardId: null,
      boards: [],
      createdAt: now,
      updatedAt: now,
    },
    images: [],
  }
  await page.getByLabel('Wybierz plik kopii księgi AAC').setInputFiles({
    name: 'valid.aacbook',
    mimeType: 'application/vnd.aacbook+json',
    buffer: Buffer.from(JSON.stringify(backup)),
  })
  await expect(page.getByRole('status')).toHaveText('Księga została zaimportowana')
  await expect(page.getByRole('heading', { name: 'Księga testowa' }).first()).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Home create book dialog', async ({ page }) => {
  await page.getByRole('button', { name: 'Utwórz nową księgę' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel(/Obraz okładki/)).toBeVisible()
  await expectNoA11yViolations(page)
})

test('offline status', async ({ page }) => {
  await page.goto('/?pwa=offline')
  await expect(page.getByText('Pracujesz offline')).toBeVisible()
  await expectNoA11yViolations(page)
})

test('available PWA update', async ({ page }) => {
  await page.goto('/?pwa=update')
  await expect(page.getByRole('button', { name: 'Zaktualizuj teraz' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('failed PWA update', async ({ page }) => {
  await page.goto('/?pwa=error')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Spróbuj ponownie' })).toBeVisible()
  await expectNoA11yViolations(page)
})
