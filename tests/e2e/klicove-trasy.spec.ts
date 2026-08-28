import { expect, test } from '@playwright/test'

test('rozcestník nabídne obě úrovně samosprávy', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Magistrát' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Městské části' }).first()).toBeVisible()
})

test('seznam městských částí filtruje bez ohledu na diakritiku', async ({ page }) => {
  await page.goto('/mestska-cast')
  await page.getByLabel('Najít městskou část').fill('reporyje')
  await expect(page.getByRole('link', { name: /Řeporyje/ })).toBeVisible()
})

test('stránka městské části ukazuje údaje z číselníku ČSÚ', async ({ page }) => {
  await page.goto('/mestska-cast/praha-7')
  await expect(page.getByRole('heading', { level: 1, name: 'Praha 7' })).toBeVisible()
  // Počet mandátů je v definičním seznamu; samotné „29" je na stránce
  // i mezi kandidáty, proto se ptáme na dvojici popisek–hodnota.
  const mandaty = page.locator('dt', { hasText: 'Mandátů' }).locator('xpath=following-sibling::dd[1]')
  await expect(mandaty).toHaveText('29')
})

test('stránka městské části vypisuje kandidující subjekty', async ({ page }) => {
  await page.goto('/mestska-cast/praha-7')
  await expect(page.getByRole('heading', { name: 'Kandidující subjekty' })).toBeVisible()
  await expect(page.getByText(/uchází se .* volebních stran|volebních stran s celkem/)).toBeVisible()
})

test('metodika je dosažitelná z hlavní navigace', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Hlavní navigace' }).getByText('Metodika').click()
  await expect(page).toHaveURL(/\/jak-hodnotime$/)
  await expect(page.getByRole('heading', { name: 'Přehled stavů' })).toBeVisible()
})

test('kde volím vysvětluje pravidlo o voličských průkazech', async ({ page }) => {
  await page.goto('/kde-volim')
  await expect(page.getByText(/voličské průkazy nevydávají/i)).toBeVisible()
})

test('každá stránka má funkční přeskočení na obsah', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Přeskočit na obsah' })).toBeFocused()
})
