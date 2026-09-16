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
  { cesta: '/en/how-to-vote', nazev: 'anglicky: jak volit' },
  { cesta: '/en/who-is-running', nazev: 'anglicky: kdo kandiduje' },
  { cesta: '/uk', nazev: 'ukrajinský rozcestník' },
  { cesta: '/uk/can-i-vote', nazev: 'ukrajinsky: smím volit' },
  { cesta: '/uk/what-is-decided', nazev: 'ukrajinsky: co se volí' },
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

test('přepínač jazyků vede z české stránky do překladu a zpět', async ({ page }) => {
  await page.goto('/kde-volim')
  await page.getByRole('link', { name: 'English' }).first().click()
  await expect(page).toHaveURL(/\/en$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.getByRole('link', { name: 'Čeština' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs')
})
