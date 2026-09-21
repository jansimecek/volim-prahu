/**
 * Mez věku kandidáta bez závislosti na souborovém systému, aby si ji mohly
 * vzít i klientské komponenty. `kandidatky.ts` čte data přes `node:fs`
 * a v prohlížečovém balíku skončit nesmí — filtr v tabulce přitom běží
 * na klientu.
 *
 * Číslo, značka i vysvětlení stojí tady, ne v komponentách: kandidáti se
 * vypisují ve dvou tabulkách (komunální listina a senátní obvod) a kdyby si
 * každá držela vlastní mez, mohl by web o témž člověku tvrdit dvě věci.
 */
export const MEZ_MLADEHO_KANDIDATA = 40

/**
 * Nevyplněný věk se z importu vrací jako nula, ne jako prázdná hodnota
 * (`Number(radek.VEK ?? 0)`). Nula proto neznamená „mladší 40", ale „údaj
 * v registru chybí" — a chybějící údaj se označit nesmí, jinak by web
 * o člověku tvrdil něco, co v datech není.
 */
export function jeMladyKandidat(vek: number): boolean {
  return vek > 0 && vek < MEZ_MLADEHO_KANDIDATA
}

/**
 * Má se filtr podle věku vůbec nabídnout? Jen když má co schovat i co nechat.
 * Na listině, kde mez splňují všichni nebo nikdo, by to bylo zaškrtávátko bez
 * následku. Ptají se tím obě tabulky, aby se pravidlo nerozešlo.
 */
export function lzeFiltrovatPodleVeku(mladych: number, celkem: number): boolean {
  return mladych > 0 && mladych < celkem
}

/**
 * Značka a popisek u věku. Čtvereček schválně není žádný ze znaků razítka
 * hodnocení (● ◐ ○ –) ani stavů plnění — ty nesou hodnotící informaci,
 * tahle jen údaj z registru, a splynout nesmějí.
 *
 * Barva se nepřidává. Okr už v téže tabulce znamená „kandidatura neplatná“
 * a dvě různé věci jednou barvou vedle sebe se pletou; odlišení proto nese
 * tvar — značka a popisek —, ne odstín.
 */
export const ZNACKA_MLADEHO_KANDIDATA = '▪'
export const POPISEK_MLADEHO_KANDIDATA = `do ${MEZ_MLADEHO_KANDIDATA} let`

/**
 * Vysvětlení pod tabulkou. Říká jen to, co je doložitelné: ČSÚ v popisu
 * registru definuje pole VEK pouhým „Věk" a rozhodný den neuvádí, takže ho
 * neuvádíme ani my. Druhá věta je tam proto, že označení části listiny se
 * samo o sobě čte jako doporučení — a to tenhle web nevydává.
 */
export const POPIS_MLADEHO_KANDIDATA =
  'Věk podle registru kandidátů ČSÚ; ke kterému dni je počítaný, registr neuvádí. Označení je údaj, ne doporučení — web nikoho nedoporučuje ani neodrazuje.'
