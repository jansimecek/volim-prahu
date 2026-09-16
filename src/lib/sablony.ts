/**
 * Dosazení hodnot do zástupných značek `{klic}` v přeloženém textu.
 *
 * Záměrně nepodporuje nic víc než prosté nahrazení — překlad není
 * šablonovací jazyk a podmínky ani cykly v něm nemají co dělat.
 *
 * Vlastní soubor bez závislostí má důvod: používá to i vyhledávač okrsku,
 * což je klientská komponenta. Kdyby `dosad` zůstalo vedle funkcí, které
 * čtou číselník ze souborového systému, přitáhl by import `node:fs` do
 * prohlížeče.
 */
export function dosad(sablona: string, hodnoty: Record<string, string | number>): string {
  return sablona.replace(/\{(\w+)\}/g, (cele, klic: string) =>
    klic in hodnoty ? String(hodnoty[klic]) : cele,
  )
}
