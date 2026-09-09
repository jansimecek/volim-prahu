import { expect, test } from '@playwright/test'

test('rozcestník nabídne obě úrovně samosprávy', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Magistrát' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Městské části' }).first()).toBeVisible()
})

/**
 * Z polohy se určí okrsek, část, senát i místnost. Playwright polohu
 * podstrčí: Malá Skloněná 521/2 v Praze 9, okrsek 9001, senátní obvod 24.
 */
test('titulní strana zjistí okrsek z polohy', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 50.099278, longitude: 14.485802 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Zjistit podle mojí polohy' }).click()
  await expect(page.getByText('Praha 9', { exact: true })).toBeVisible()
  await expect(page.getByText(/Volební okrsek 9001/)).toBeVisible()
  await expect(page.getByText(/obvodu č\. 24/)).toBeVisible()
  await expect(page.getByText(/Novovysočanská 501\/5/)).toBeVisible()
})

test('plnění slibů je v hlavní navigaci', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Hlavní navigace' }).getByText('Plnění slibů').click()
  await expect(page).toHaveURL(/\/minule-obdobi$/)
})

/**
 * Výzva k anketě se ukazuje jen s nastaveným úložištěm. Produkční build
 * v testu ho nemá, takže se tu ověřuje opak: bez úložiště žádná výzva —
 * jinak by čtenář klikl na formulář, který selže.
 */
test('bez úložiště titulní strana k anketě nevyzývá', async ({ page }) => {
  test.skip(Boolean(process.env.POSTGRES_URL), 'úložiště je nastavené')
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Hlasovat v anketě' })).toHaveCount(0)
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

/**
 * Vyhledávač adresa → okrsek. Partyzánská 18/23 je v Praze 7 a patří do
 * okrsku 7001 podle sestav ČÚZK; kdyby se to změnilo, změní se i data
 * v repu a test to ukáže, ne čtenář.
 */
test('vyhledávač najde okrsek podle ulice a orientačního čísla', async ({ page }) => {
  await page.goto('/kde-volim')
  await page.getByRole('combobox', { name: 'Ulice' }).fill('partyzanska')
  await page.getByRole('textbox', { name: 'Číslo domu' }).fill('23')
  await page.getByRole('button', { name: 'Najít okrsek' }).click()
  await expect(page.getByText('Volební okrsek 7001')).toBeVisible()
  await expect(page.getByText('Partyzánská 18/23 · Praha 7')).toBeVisible()
  const mapa = page.getByRole('region', { name: 'Mapa volebního okrsku 7001' })
  await expect(mapa).toBeVisible()
  // Hranice se kreslí z našich dat, ne z cizího serveru — musí být vidět i bez sítě.
  await expect(mapa.locator('.leaflet-overlay-pane path').first()).toBeAttached()
  await expect(page.getByText(/hranice okrsku 7001 podle RÚIAN/)).toBeVisible()
})

/**
 * Praha 9 má místnosti z dokumentu 2026 v content/volebni-mistnosti; z adresy
 * se při buildu dohledá poloha v registru ČÚZK, takže výsledek nese
 * vzdálenost a mapa značku místnosti. Zdroj musí být čtenáři označený.
 */
test('u známé místnosti ukáže vzdálenost a značku na mapě', async ({ page }) => {
  await page.goto('/kde-volim')
  await page.getByRole('combobox', { name: 'Ulice' }).fill('Malá Skloněná')
  await page.getByRole('textbox', { name: 'Číslo domu' }).fill('2')
  await page.getByRole('button', { name: 'Najít okrsek' }).click()
  await expect(page.getByText('Volební okrsek 9001')).toBeVisible()
  await expect(page.getByText(/Novovysočanská 501\/5/)).toBeVisible()
  await expect(page.getByText(/Vzdušnou čarou asi \d+ m od vaší adresy/)).toBeVisible()
  await expect(page.getByText(/k volbám 2026/i).first()).toBeVisible()
  const mapa = page.getByRole('region', { name: 'Mapa volebního okrsku 9001' })
  await expect(mapa.locator('.leaflet-marker-icon')).toHaveCount(1)
})

test('vyhledávač neznámou ulici nedomýšlí', async ({ page }) => {
  await page.goto('/kde-volim')
  await page.getByRole('combobox', { name: 'Ulice' }).fill('Neexistující')
  await page.getByRole('textbox', { name: 'Číslo domu' }).fill('1')
  await page.getByRole('button', { name: 'Najít okrsek' }).click()
  await expect(page.getByText(/jsme v Praze nenašli/)).toBeVisible()
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

/**
 * Od 8. 9. 2026 existuje pražský průzkum s doloženou metodikou (Median pro
 * PrahaIN.cz), takže se řazení nabízí. Od 6. 10. 2026 ho schová moratorium
 * a test musí čekat opak — jinak by v den moratoria spadl.
 */
const MORATORIUM_OD = new Date('2026-10-06T00:00:00+02:00')

test('řazení podle průzkumu se nabízí, dokud neplatí moratorium', async ({ page }) => {
  await page.goto('/praha')
  const prepinac = page.getByRole('radio', { name: 'Podle posledního průzkumu' })
  if (new Date() >= MORATORIUM_OD) {
    await expect(prepinac).toHaveCount(0)
    await expect(page.getByText('Bez řazení podle průzkumu')).toBeVisible()
  } else {
    await expect(prepinac).toHaveCount(1)
    await page.getByText('Podle posledního průzkumu', { exact: true }).click()
    await expect(page.getByText(/Zdroj čísel: Median pro PrahaIN\.cz/)).toBeVisible()
  }
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

test('rozhovor odkazuje ven a jméno bere z dat ČSÚ', async ({ page }) => {
  await page.goto('/rozhovory')
  await expect(page.getByRole('heading', { level: 1, name: 'Rozhovory s kandidáty' })).toBeVisible()

  // Jméno se nepíše do obsahu, dopočítává se z kandidátní listiny —
  // v obsahu je jen slug, takže titul „Mgr." může přijít jedině z dat.
  await expect(page.getByRole('link', { name: 'Mgr. Tomáš Portlík' }).first()).toBeVisible()

  // Text rozhovoru nepřebíráme; odkaz musí vést k médiu, které ho udělalo.
  const odkaz = page.getByRole('link', { name: /Číst rozhovor na webu/ }).first()
  await expect(odkaz).toHaveAttribute('href', /^https?:\/\/(?!.*volimprahu)/)
})

test('rozhovory se objeví i na profilu kandidáta', async ({ page }) => {
  await page.goto('/kandidat/portlik-tomas')
  await expect(page.getByRole('heading', { name: 'Rozhovory v médiích' })).toBeVisible()
})

test('celostátní model se ukáže s výhradou a neřadí pražské kandidátky', async ({ page }) => {
  await page.goto('/aktualne/kantar-snemovni-model-srpen-2026')
  await expect(page.getByText('ANO')).not.toHaveCount(0)
  await expect(page.getByText('Je to model voleb do Poslanecké sněmovny')).not.toHaveCount(0)

  // Na stránce magistrátu se podle něj nesmí dát řadit — měří jiné strany.
  // Řazení, pokud se nabízí, musí vycházet z pražského průzkumu, ne z Kantaru.
  await page.goto('/praha')
  await expect(page.getByText(/Kantar/)).toHaveCount(0)
})

/**
 * Dostupnost pro vyhledávače a jazykové modely: robots, sitemapa, llms.txt,
 * kanonická adresa na www doméně a strukturovaná data. Bez nich je web
 * k nalezení jen odkazy, a odpovědi asistentů na „kde volím" jdou jinam.
 */
test('robots, sitemapa a llms.txt existují a ukazují na www doménu', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBeTruthy()
  expect(await robots.text()).toContain('Sitemap: https://www.volimprahu.cz/sitemap.xml')

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  const xml = await sitemap.text()
  expect(xml).toContain('<loc>https://www.volimprahu.cz/kde-volim</loc>')
  expect(xml).toContain('<loc>https://www.volimprahu.cz/mestska-cast/praha-7</loc>')
  expect(xml).toContain('<loc>https://www.volimprahu.cz/kandidat/portlik-tomas</loc>')

  const llms = await request.get('/llms.txt')
  expect(llms.ok()).toBeTruthy()
  const text = await llms.text()
  expect(text).toContain('# Volím Prahu')
  expect(text).toContain('https://www.volimprahu.cz/kde-volim')
})

test('stránky mají kanonickou adresu, náhledový obrázek a strukturovaná data', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.volimprahu.cz')
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
  const typy = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(typy.some((t) => t.includes('"@type":"WebSite"'))).toBeTruthy()
  expect(typy.some((t) => t.includes('"@type":"Event"'))).toBeTruthy()

  await page.goto('/kandidat/portlik-tomas')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.volimprahu.cz/kandidat/portlik-tomas',
  )
  const naProfilu = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(naProfilu.some((t) => t.includes('"@type":"Person"'))).toBeTruthy()
  expect(naProfilu.some((t) => t.includes('"@type":"BreadcrumbList"'))).toBeTruthy()

  await page.goto('/aktualne/vylosovana-cisla-kandidatek')
  const uAktuality = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(uAktuality.some((t) => t.includes('"@type":"NewsArticle"'))).toBeTruthy()

  await page.goto('/hledani')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})
