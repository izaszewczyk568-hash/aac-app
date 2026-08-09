import { expect, test } from '@playwright/test'

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

test('critical book creation, editing, use and persistence flow', async ({ page }) => {
  await page.goto('./')

  await expect(page.getByText('Podgląd developerski')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Demo Board' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Utwórz nową księgę' }).click()
  await page.getByLabel('Nazwa księgi').fill('Księga E2E')
  await page.getByRole('button', { name: 'Utwórz księgę' }).click()
  const newBoardPagePromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: '+ Dodaj tablicę' }).click()
  const boardPage = await newBoardPagePromise
  await boardPage.waitForURL(/\?book=.+&board=.+&mode=edit/)

  await boardPage.getByRole('textbox', { name: 'Nazwa tablicy' }).fill('Start')
  await boardPage.getByLabel('Wybierz obraz symbolu').setInputFiles({
    name: 'tak.png',
    mimeType: 'image/png',
    buffer: transparentPng,
  })
  await boardPage.getByLabel('Nazwa symbolu').fill('Tak')
  await expect(boardPage.getByText('Zapisano wszystkie zmiany')).toBeVisible()

  await boardPage.getByRole('button', { name: 'Uruchom tablicę' }).click()
  await boardPage.getByRole('button', { name: 'Tak' }).click()
  await expect(boardPage.getByText('Aktywowano')).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Otwórz księgę Księga E2E' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button', { name: 'Tak' })).toBeVisible()
  await boardPage.close()
})
