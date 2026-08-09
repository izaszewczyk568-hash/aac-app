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
  await page.getByRole('radio', { name: 'Use' }).check()
  await page.getByLabel('Sterowanie wzrokiem (dwell)').check()
  await page.getByRole('button', { name: 'Symbol bez podpisu' }).hover()
  await expect(page.locator('.symbol-tile__dwell-progress')).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Board use activates a symbol with Enter and Space', async ({ page }) => {
  await openBoardPreview(page)
  await addSymbol(page)
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
  await expect(page.getByRole('heading', { level: 1, name: 'Rozpocznij pracę z książką AAC' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ostatnio używane' })).toHaveCount(0)
  await expectNoA11yViolations(page)
})

test('Home with recent book cards', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  await expect(page.getByRole('heading', { name: 'Posiłki' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('seeded CommunicationBook view and populated Board use', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  await expect(page.getByRole('heading', { name: 'Posiłki' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Posiłki' })).toBeVisible()
  await page.getByRole('button', { name: 'Otwórz książkę Posiłki' }).click()
  await expect(page.getByRole('heading', { name: 'Posiłki' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Główna' })).toBeVisible()
  await expectNoA11yViolations(page)

  await page.getByRole('button', { name: 'Główna' }).click()
  await page.getByRole('radio', { name: 'Use' }).check()
  await expect(page.getByRole('button', { name: 'Jedzenie' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Home with an open book menu', async ({ page }) => {
  await page.getByRole('button', { name: 'Załaduj dane demo' }).click()
  await page.getByRole('button', { name: 'Więcej opcji książki Posiłki' }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Eksportuj książkę' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Home with an import error', async ({ page }) => {
  await page.getByLabel('Wybierz plik kopii książki AAC').setInputFiles({
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
      name: 'Książka testowa',
      mainBoardId: null,
      boards: [],
      createdAt: now,
      updatedAt: now,
    },
    images: [],
  }
  await page.getByLabel('Wybierz plik kopii książki AAC').setInputFiles({
    name: 'valid.aacbook',
    mimeType: 'application/vnd.aacbook+json',
    buffer: Buffer.from(JSON.stringify(backup)),
  })
  await expect(page.getByRole('status')).toHaveText('Książka została zaimportowana.')
  await expect(page.getByRole('heading', { name: 'Książka testowa' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Home create book dialog', async ({ page }) => {
  await page.getByRole('button', { name: '+ Utwórz nową książkę' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
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
