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

test('navigace ukazuje, na které stránce čtenář je', async ({ page }) => {
  await page.goto('/praha')
  const navigace = page.getByRole('navigation', { name: 'Hlavní navigace' })
  await expect(navigace.getByRole('link', { name: 'Magistrát' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  // Stav „jsem tady" musí platit i o úroveň hlouběji, jinak se čtenář
  // na profilu strany ztratí ze sekce.
  await page.goto('/praha/strana/ano-2011')
  await expect(navigace.getByRole('link', { name: 'Magistrát' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(navigace.getByRole('link', { name: 'Senát' })).not.toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('hluboká stránka nabízí cestu zpět přes drobečky', async ({ page }) => {
  await page.goto('/praha/strana/ceska-piratska-strana/program')
  const drobecky = page.getByRole('navigation', { name: 'Drobečková navigace' })
  await expect(drobecky).toBeVisible()
  await drobecky.getByRole('link', { name: 'Magistrát' }).click()
  await expect(page).toHaveURL(/\/praha$/)
})

test('výpis stran jde přeřadit podle vylosovaného čísla', async ({ page }) => {
  // Praha 22 je jediná část, kde už jsou vylosovaná všechna čísla.
  await page.goto('/mestska-cast/praha-22')
  const seznam = page.getByRole('list', { name: 'Kandidující volební strany' })

  const abecedne = await seznam.getByRole('heading', { level: 3 }).allInnerTexts()
  expect(abecedne.length).toBeGreaterThan(2)

  // Přepínač je skutečný radio input schovaný pod štítkem — přístupné jméno
  // musí sedět, ale kliká se na štítek, stejně jako to udělá čtenář.
  await expect(page.getByRole('radio', { name: 'Podle čísla na lístku' })).toHaveCount(1)
  await page.getByText('Podle čísla na lístku').click()
  await expect(page.getByRole('radio', { name: 'Podle čísla na lístku' })).toBeChecked()
  const podleCisla = await seznam.getByRole('heading', { level: 3 }).allInnerTexts()

  expect(podleCisla).toHaveLength(abecedne.length)
  expect(podleCisla).not.toEqual(abecedne)
  // Nikdo se přeřazením nesmí ztratit.
  expect([...podleCisla].sort()).toEqual([...abecedne].sort())
})

test('řazení podle průzkumu se nenabízí a je vysvětlené proč', async ({ page }) => {
  await page.goto('/praha')
  await expect(page.getByRole('radio', { name: 'Podle posledního průzkumu' })).toHaveCount(0)
  await expect(page.getByText('Bez řazení podle průzkumu')).toBeVisible()
})

test('aktuality mají permalink, čas a zdroj', async ({ page }) => {
  await page.goto('/aktualne')
  await expect(page.getByRole('heading', { level: 1, name: 'Aktuálně' })).toBeVisible()

  const prvni = page.locator('article').first()
  await expect(prvni.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/)

  await page.goto('/aktualne/moratorium-na-pruzkumy-2026')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Moratorium')
  await expect(page.getByRole('link', { name: /Ministerstvo vnitra/ })).toBeVisible()
})

test('kanál RSS aktualit je platné XML s položkami', async ({ request }) => {
  const odpoved = await request.get('/aktualne/feed.xml')
  expect(odpoved.status()).toBe(200)
  expect(odpoved.headers()['content-type']).toContain('application/rss+xml')

  const telo = await odpoved.text()
  expect(telo).toContain('<rss version="2.0"')
  expect(telo).toContain('/aktualne/moratorium-na-pruzkumy-2026')
  // Zdroj patří i do feedu — čte se vytržený z kontextu stránky.
  expect(telo).toContain('Zdroj:')
})

test('dlouhá referenční stránka má obsah s funkčními kotvami', async ({ page }) => {
  await page.goto('/ochrana-udaju')
  const obsah = page.getByRole('navigation', { name: 'Obsah stránky' })
  await expect(obsah).toBeVisible()

  const prvni = obsah.getByRole('link').first()
  const cil = await prvni.getAttribute('href')
  await prvni.click()
  await expect(page.locator(cil!)).toBeVisible()
})

test('404 mluví česky a nabídne cestu dál', async ({ page }) => {
  const odpoved = await page.goto('/tahle-stranka-neexistuje')
  expect(odpoved?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('nemáme')
  await expect(page.getByRole('link', { name: 'Vyhledávání' })).toBeVisible()
})

test('staré adresy zpráviček vedou na Aktuálně, ne na 404', async ({ page }) => {
  // Rubrika se přejmenovala až po nasazení; jedna stará adresa je v RSS
  // kanálu, který si mohl někdo přidat do čtečky.
  await page.goto('/zpravicky')
  await expect(page).toHaveURL(/\/aktualne$/)

  await page.goto('/zpravicky/moratorium-na-pruzkumy-2026')
  await expect(page).toHaveURL(/\/aktualne\/moratorium-na-pruzkumy-2026$/)
})

test('starý kanál RSS přesměrovává na nový', async ({ request }) => {
  const odpoved = await request.get('/zpravicky/feed.xml')
  expect(odpoved.status()).toBe(200)
  expect(odpoved.url()).toContain('/aktualne/feed.xml')
})

test('infografika plnění vede na konkrétní závazek a stav nese i text', async ({ page }) => {
  await page.goto('/minule-obdobi')
  await expect(page.getByRole('heading', { name: 'Přehled na jeden pohled' })).toBeVisible()

  // Barva nesmí být jediný nosič stavu — u každé dlaždice musí být i slovo.
  const dlazdice = page.locator('a[href="#pr-smichov"]').first()
  await expect(dlazdice).toContainText('Doloženo jako nesplněné')

  await dlazdice.click()
  await expect(page).toHaveURL(/#pr-smichov$/)
  const zavazek = page.locator('#pr-smichov')
  await expect(zavazek).toBeVisible()
  await expect(zavazek).toContainText('Doloženo jako nesplněné')
  // Tvrzení o nesplnění musí u sebe mít zdroj, na který se dá kliknout.
  await expect(zavazek.getByRole('link')).not.toHaveCount(0)
})
