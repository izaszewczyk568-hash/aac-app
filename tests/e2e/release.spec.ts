import { expect, test } from '@playwright/test'

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

test('critical book creation, editing, use and persistence flow', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Podgląd developerski')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Demo Board' })).toHaveCount(0)

  await page.getByRole('button', { name: '+ Utwórz nową książkę' }).click()
  await page.getByLabel('Nazwa książki (opcjonalnie)').fill('Książka E2E')
  await page.getByRole('button', { name: 'Utwórz książkę' }).click()
  await page.getByRole('button', { name: '+ Utwórz pierwszą tablicę' }).click()

  await page.getByRole('textbox', { name: 'Nazwa tablicy' }).fill('Start')
  await page.getByLabel('Wybierz obraz symbolu').setInputFiles({
    name: 'tak.png',
    mimeType: 'image/png',
    buffer: transparentPng,
  })
  await page.getByLabel('Nazwa symbolu').fill('Tak')
  await expect(page.getByText('Zapisano wszystkie zmiany')).toBeVisible()

  await page.getByRole('button', { name: 'Uruchom tablicę' }).click()
  await page.getByRole('button', { name: 'Tak' }).click()
  await expect(page.getByText('Aktywowano')).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Otwórz książkę Książka E2E' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button', { name: 'Wybierz symbol: Tak' })).toBeVisible()
})
