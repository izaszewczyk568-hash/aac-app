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

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('empty Board edit', async ({ page }) => {
  await expect(page.getByRole('textbox', { name: 'Nazwa tablicy' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Board edit with SymbolTile', async ({ page }) => {
  await addSymbol(page)
  await expectNoA11yViolations(page)
})

test('Board edit with selected SymbolTile', async ({ page }) => {
  await addSymbol(page)
  await expect(
    page.getByRole('button', { name: /Wybierz symbol/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('complementary', { name: 'Ustawienia symbolu' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('SymbolInspector delete confirmation', async ({ page }) => {
  await addSymbol(page)
  await page.getByRole('button', { name: 'Usuń symbol' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Board edit with open More menu', async ({ page }) => {
  await page.getByRole('button', { name: 'Więcej opcji tablicy' }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await expectNoA11yViolations(page)
})

test('empty Board use', async ({ page }) => {
  await page.getByRole('radio', { name: 'Use' }).check()
  await expect(page.getByRole('heading', { name: 'Jedzenie' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('Board use with symbols', async ({ page }) => {
  await addSymbol(page)
  await page.getByRole('radio', { name: 'Use' }).check()
  await expect(page.getByRole('button', { name: /Wybierz symbol/ })).toHaveCount(0)
  await expectNoA11yViolations(page)
})
