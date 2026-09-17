import type { Page } from '@playwright/test'

/**
 * Zpřístupní hlavní navigaci bez ohledu na šířku okna.
 *
 * Na úzké obrazovce je seznam schovaný za tlačítkem, a schovaný znamená
 * `display: none` — takové odkazy nejsou ani v přístupnostním stromu,
 * takže je `getByRole('link')` nenajde. Test, který ověřuje „je to
 * dosažitelné z hlavní navigace", musí projít tutéž cestu jako čtenář:
 * na telefonu nejdřív otevřít menu.
 *
 * Na širokém okně tlačítko neexistuje a funkce neudělá nic.
 */
export async function otevriNavigaci(page: Page, popisekTlacitka = 'Menu'): Promise<void> {
  const tlacitko = page.getByRole('button', { name: popisekTlacitka })
  if (await tlacitko.isVisible()) await tlacitko.click()
}
