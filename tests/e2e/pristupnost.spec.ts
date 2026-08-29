import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Automatický audit přístupnosti. Lighthouse staví své skóre přístupnosti
 * převážně na axe, takže tohle je totéž měřítko, jen vynucené v CI —
 * zadání žádá WCAG 2.2 AA bez výjimek.
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
  { cesta: '/aktualne/moratorium-na-pruzkumy-2026', nazev: 'jedna aktualita' },
  { cesta: '/mestska-cast/praha-22', nazev: 'městská část s přepínačem řazení' },
  { cesta: '/senat/24-praha-9', nazev: 'senátní obvod' },
  { cesta: '/nic-takoveho-neexistuje', nazev: 'stránka 404' },
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
