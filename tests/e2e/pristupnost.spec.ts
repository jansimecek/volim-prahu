import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Automatický audit přístupnosti. Lighthouse staví své skóre přístupnosti
 * převážně na axe, takže tohle je totéž měřítko, jen vynucené v CI —
 * web musí splňovat WCAG 2.2 AA bez výjimek.
 */
const TRASY = [
  { cesta: '/', nazev: 'rozcestník' },
  { cesta: '/praha', nazev: 'magistrát' },
  { cesta: '/mestska-cast/praha-7', nazev: 'městská část' },
  { cesta: '/kandidat/portlik-tomas', nazev: 'profil kandidáta' },
  { cesta: '/praha/strana/spojena-levice-pro-prahu/program', nazev: 'program s hodnocením' },
  { cesta: '/temata', nazev: 'srovnání témat' },
  { cesta: '/kdo-o-cem-rozhoduje', nazev: 'kompetenční matice' },
  { cesta: '/rozpoctovy-ramec', nazev: 'rozpočtový rámec' },
  { cesta: '/minule-obdobi', nazev: 'plnění prohlášení rady' },
  { cesta: '/senat', nazev: 'senát' },
  { cesta: '/kde-volim', nazev: 'kde volím' },
  { cesta: '/hledani', nazev: 'hledání' },
  { cesta: '/vysledky', nazev: 'výsledky' },
  { cesta: '/hlasovani', nazev: 'anketa' },
  { cesta: '/aktualne', nazev: 'aktuality' },
  { cesta: '/rozhovory', nazev: 'rozhovory s kandidáty' },
  { cesta: '/koalice', nazev: 'koalice a kalkulačka mandátů' },
  { cesta: '/aktualne/kantar-snemovni-model-srpen-2026', nazev: 'aktualita s tabulkou průzkumu' },
  { cesta: '/aktualne/moratorium-na-pruzkumy-2026', nazev: 'jedna aktualita' },
  { cesta: '/mestska-cast/praha-22', nazev: 'městská část s přepínačem řazení' },
  { cesta: '/senat/24-praha-9', nazev: 'senátní obvod' },
  { cesta: '/nic-takoveho-neexistuje', nazev: 'stránka 404' },
  // Cizojazyčná sekce. Ukrajinská verze je v testu kvůli cyrilici a vlastnímu
  // `lang` — chyba v jazyce stránky je porušení WCAG 3.1.1 a axe ji zachytí.
  { cesta: '/en', nazev: 'anglický rozcestník' },
  { cesta: '/en/can-i-vote', nazev: 'anglicky: smím volit' },
  { cesta: '/en/where-do-i-vote', nazev: 'anglicky: kde volím' },
  { cesta: '/en/how-to-vote', nazev: 'anglicky: jak volit' },
  { cesta: '/en/who-is-running', nazev: 'anglicky: kdo kandiduje' },
  { cesta: '/uk', nazev: 'ukrajinský rozcestník' },
  { cesta: '/uk/can-i-vote', nazev: 'ukrajinsky: smím volit' },
  { cesta: '/uk/what-is-decided', nazev: 'ukrajinsky: co se volí' },
  { cesta: '/uk/where-do-i-vote', nazev: 'ukrajinsky: kde volím' },
  { cesta: '/sk', nazev: 'slovenský rozcestník' },
  { cesta: '/sk/can-i-vote', nazev: 'slovensky: smím volit' },
  { cesta: '/sk/where-do-i-vote', nazev: 'slovensky: kde volím' },
]

for (const { cesta, nazev } of TRASY) {
  test(`${nazev} nemá porušení WCAG 2.2 AA`, async ({ page }) => {
    await page.goto(cesta)
    const vysledek = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    // Vypsat konkrétně, ať se to nemusí dohledávat v surovém výstupu.
    if (vysledek.violations.length > 0) {
      console.log(
        `\n${nazev} (${cesta}):\n` +
          vysledek.violations
            .map((v) => `  [${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes.length}× např. ${v.nodes[0]?.target.join(' ')}`)
            .join('\n'),
      )
    }
    expect(vysledek.violations).toEqual([])
  })
}

test('rozbalené hodnocení zůstává přístupné', async ({ page }) => {
  await page.goto('/praha/strana/spojena-levice-pro-prahu/program')
  await page.getByText('Zdůvodnění a zdroje').first().click()
  const vysledek = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(vysledek.violations).toEqual([])
})

/**
 * Jazyk stránky musí sedět s jejím obsahem. Kdyby anglická verze zůstala
 * pod `lang="cs"`, odečítač ji přečte českou výslovností a je to porušení
 * WCAG 3.1.1 — axe to na statické stránce nepozná, tak se to měří přímo.
 */
for (const { cesta, jazyk } of [
  { cesta: '/', jazyk: 'cs' },
  { cesta: '/en', jazyk: 'en' },
  { cesta: '/en/can-i-vote', jazyk: 'en' },
  { cesta: '/uk', jazyk: 'uk' },
  { cesta: '/uk/how-to-vote', jazyk: 'uk' },
  { cesta: '/uk/where-do-i-vote', jazyk: 'uk' },
  { cesta: '/sk', jazyk: 'sk' },
  { cesta: '/sk/how-to-vote', jazyk: 'sk' },
]) {
  test(`${cesta} deklaruje jazyk ${jazyk}`, async ({ page }) => {
    await page.goto(cesta)
    await expect(page.locator('html')).toHaveAttribute('lang', jazyk)
  })
}

/**
 * Test způsobilosti je jediné místo, kde web odpovídá „smíte / nesmíte".
 * Že odpověď dojde až ke čtenáři, nezaručí unit test nad `vyhodnot()` —
 * musí projít i klikáním.
 */
test('test způsobilosti dojde k odpovědi a neptá se zbytečně', async ({ page }) => {
  await page.goto('/en/can-i-vote')

  // Občanství mimo EU uzavře odpověď hned, na pobyt už se neptá.
  await page.getByRole('button', { name: 'A country outside the EU' }).click()
  await expect(page.getByText('No, not in these elections.')).toBeVisible()
  await expect(page.getByText('Is your residence registered')).toBeHidden()

  // Občan EU s pražským pobytem projde všemi třemi otázkami na „ano".
  await page.getByRole('button', { name: 'Another EU member state' }).click()
  await page.getByRole('button', { name: 'Yes, in Prague' }).click()
  await page.getByRole('button', { name: 'Yes', exact: true }).click()
  await expect(page.getByText('You vote on both municipal ballots.')).toBeVisible()
})

test('přepínač jazyků vede z české stránky na její překlad a zpět', async ({ page }) => {
  // /kde-volim má doslovný protějšek, takže přepínač nesmí končit na
  // rozcestníku jazyka — čtenář hledá tutéž stránku, jen anglicky.
  await page.goto('/kde-volim')
  await page.getByRole('link', { name: 'English' }).first().click()
  await expect(page).toHaveURL(/\/en\/where-do-i-vote$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.getByRole('link', { name: 'Čeština' }).click()
  await expect(page).toHaveURL(/\/kde-volim$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs')
})

test('stránka bez protějšku posílá přepínačem na rozcestník jazyka', async ({ page }) => {
  await page.goto('/temata')
  await page.getByRole('link', { name: 'Українська' }).first().click()
  await expect(page).toHaveURL(/\/uk$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk')
})

/**
 * Vyhledávač okrsku v cizím jazyce. Stejná adresa jako v českém testu
 * (Partyzánská 18/23 → okrsek 7001), takže kdyby se rozešly výsledky, je
 * to chyba v datech, ne v překladu.
 *
 * Kontroluje se i stav „nenašli jsme": právě ten musí být přeložený, aby
 * čtenář poznal, že udělal překlep, a nemyslel si, že je nástroj rozbitý.
 */
test('anglický vyhledávač najde okrsek a hlásí se anglicky', async ({ page }) => {
  await page.goto('/en/where-do-i-vote')
  await page.getByRole('combobox', { name: 'Street' }).fill('partyzanska')
  await page.getByRole('textbox', { name: 'Number' }).fill('23')
  await page.getByRole('button', { name: 'Find my precinct' }).click()

  await expect(page.getByText('Electoral precinct 7001')).toBeVisible()
  await expect(page.getByText('Partyzánská 18/23 · Praha 7')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Map of electoral precinct 7001' })).toBeVisible()
  await expect(page.getByText(/red outline is precinct 7001/)).toBeVisible()
})

test('ukrajinský vyhledávač vysvětlí ukrajinsky, že ulici nezná', async ({ page }) => {
  await page.goto('/uk/where-do-i-vote')
  await page.getByRole('combobox', { name: 'Вулиця' }).fill('Neexistujici')
  await page.getByRole('textbox', { name: 'Номер' }).fill('1')
  await page.getByRole('button', { name: 'Знайти дільницю' }).click()

  await expect(page.getByText(/у Празі не знайдено/)).toBeVisible()
  // Nedosazená značka by znamenala, že se šablona rozešla s voláním.
  await expect(page.getByText(/\{\w+\}/)).toHaveCount(0)
})

/**
 * Náhledová karta pro sdílení. Testuje se obojí, co může tiše selhat:
 * že každá stránka má vlastní obrázek (ne jeden na celou sekci) a že
 * se doopravdy vykreslí. Karta, která vrátí 500, se pozná až tím, že
 * odkaz ve facebookové skupině vypadá jako prázdný rámeček.
 */
test('nejsdílenější stránky mají vlastní náhledovou kartu', async ({ page, request }) => {
  const adresy = new Map<string, string>()

  for (const cesta of [
    '/en',
    '/en/can-i-vote',
    '/en/where-do-i-vote',
    '/uk',
    '/uk/can-i-vote',
    '/uk/where-do-i-vote',
    // České stránky, které se sdílejí nejvíc: vyhledávač okrsku
    // a kandidátky na magistrát.
    '/kde-volim',
    '/praha',
    '/sk',
    '/sk/can-i-vote',
  ]) {
    await page.goto(cesta)
    const obrazek = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(obrazek, `${cesta} nemá og:image`).toBeTruthy()

    // Adresa musí být absolutní: robot sociální sítě čte značku mimo
    // kontext stránky a relativní cestu si nedoplní.
    expect(obrazek, `og:image u ${cesta} není absolutní`).toMatch(/^https?:\/\//)
    adresy.set(cesta, obrazek!)

    // Kreslí se ale z běžícího buildu, ne z produkce, na kterou adresa míří.
    const odpoved = await request.get(new URL(obrazek!).pathname + new URL(obrazek!).search)
    expect(odpoved.status(), `karta pro ${cesta}`).toBe(200)
    expect(odpoved.headers()['content-type']).toContain('image/png')
  }

  // Kolik stránek, tolik různých karet — žádná nesmí spadnout zpátky
  // na obecný obrázek celého webu.
  expect(new Set(adresy.values()).size).toBe(adresy.size)
})


/**
 * Widget podle polohy. Poloha se podstrčí, protože prohlížeč v testu
 * povolení nedá a bez něj se výsledek nikdy nevykreslí — a právě výsledek
 * je to, co muselo být přeložené: okrsek, senátní stav i volební místnost.
 *
 * Staroměstské náměstí leží v okrsku 1012 (Praha 1), který podle senátního
 * číselníku volí i senátora v obvodu 27. Kdyby se to změnilo, změní se
 * i data v repu a test to ukáže.
 */
async function podstrcPolohu(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 50.0875, longitude: 14.4213, accuracy: 20 } } as GeolocationPosition),
      },
      configurable: true,
    })
  })
}

test('widget podle polohy odpoví anglicky', async ({ page }) => {
  await podstrcPolohu(page)
  await page.goto('/en/where-do-i-vote')
  await page.getByRole('button', { name: 'Use my location' }).click()

  await expect(page.getByText('Electoral precinct 1012')).toBeVisible()
  await expect(page.getByText('Your location is in')).toBeVisible()
  await expect(page.getByRole('link', { name: /Parties standing in your city district/ })).toBeVisible()
  await expect(page.getByText(/You also elect a senator in constituency 27/)).toBeVisible()
  await expect(page.getByText(/from where you are/)).toBeVisible()
  // Nedosazená značka by znamenala, že se šablona rozešla s voláním.
  await expect(page.getByText(/\{\w+\}/)).toHaveCount(0)
})

test('widget podle polohy odpoví ukrajinsky', async ({ page }) => {
  await podstrcPolohu(page)
  await page.goto('/uk/where-do-i-vote')
  await page.getByRole('button', { name: 'Визначити за моїм місцем' }).click()

  await expect(page.getByText('Виборча дільниця 1012')).toBeVisible()
  await expect(page.getByText(/сенатора в окрузі № 27/)).toBeVisible()
  await expect(page.getByText(/від місця, де ви зараз/)).toBeVisible()
  await expect(page.getByText(/\{\w+\}/)).toHaveCount(0)
})

test('widget na české titulní straně zůstal český', async ({ page }) => {
  await podstrcPolohu(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Zjistit podle mojí polohy' }).click()

  await expect(page.getByText('Volební okrsek 1012')).toBeVisible()
  await expect(page.getByText('Vaše poloha leží v části')).toBeVisible()
  await expect(page.getByRole('link', { name: /Kandidátky na magistrát/ })).toBeVisible()
})

test('karta a popisek jsou v jazyce stránky', async ({ page }) => {
  await page.goto('/uk/where-do-i-vote')
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    /[Ѐ-ӿ]/,
  )
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'uk_UA')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /[Ѐ-ӿ]/,
  )

  await page.goto('/en/where-do-i-vote')
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_GB')
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    /English/,
  )
})

/**
 * Menu na úzké obrazovce. Deset odkazů v mono verzálkách zabíralo
 * na telefonu s přepínačem jazyků zhruba 40 % první obrazovky, než začal
 * obsah — a většina návštěv přijde z telefonu.
 *
 * Testuje se to, co se dá rozbít potichu: že je seznam zpočátku schovaný,
 * že ho tlačítko otevře, že se po přechodu na jinou stránku zase zavře
 * a že na desktopu tlačítko vůbec není.
 */
test.describe('mobilní menu', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('rozbalí a zase zavře hlavní navigaci', async ({ page }) => {
    await page.goto('/')
    const tlacitko = page.getByRole('button', { name: 'Menu' })
    const odkaz = page
      .getByRole('navigation', { name: 'Hlavní navigace' })
      .getByRole('link', { name: 'Magistrát' })

    await expect(tlacitko).toHaveAttribute('aria-expanded', 'false')
    await expect(odkaz).toBeHidden()

    await tlacitko.click()
    await expect(tlacitko).toHaveAttribute('aria-expanded', 'true')
    await expect(odkaz).toBeVisible()

    // Po přechodu nemá menu zůstat rozbalené přes obsah, kvůli kterému se klikalo.
    await odkaz.click()
    await expect(page).toHaveURL(/\/praha$/)
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  test('zavírá se klávesou Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(
      page.getByRole('navigation', { name: 'Hlavní navigace' }).getByRole('link', { name: 'Magistrát' }),
    ).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  test('přepínač jazyků zůstává vidět i se zavřeným menu', async ({ page }) => {
    // Přepínač je jediná cesta, jak se cizinec k překladu dostane. Schovat
    // ho do menu by znamenalo schovat ho před tím, kdo neumí přečíst „Menu“.
    await page.goto('/')
    // Scopováno na přepínač: „English" je i v patičce, v odstavci pro
    // české čtenáře, kteří odkaz posílají dál.
    const prepinac = page.getByRole('navigation', { name: /Language/ })
    await expect(prepinac.getByRole('link', { name: 'English' })).toBeVisible()
    await expect(prepinac.getByRole('link', { name: 'Slovenčina' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})

test('na širokém okně je navigace vidět a tlačítko menu nikde', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(
    page.getByRole('navigation', { name: 'Hlavní navigace' }).getByRole('link', { name: 'Magistrát' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden()
})

test('slovenský vyhledávač najde okrsek a hlásí se slovensky', async ({ page }) => {
  await page.goto('/sk/where-do-i-vote')
  await page.getByRole('combobox', { name: 'Ulica' }).fill('partyzanska')
  await page.getByRole('textbox', { name: 'Číslo' }).fill('23')
  await page.getByRole('button', { name: 'Nájsť okrsok' }).click()

  await expect(page.getByText('Volebný okrsok 7001')).toBeVisible()
  await expect(page.getByText(/\{\w+\}/)).toHaveCount(0)
})
