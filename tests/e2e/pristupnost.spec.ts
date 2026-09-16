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
