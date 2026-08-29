/**
 * Řazení kandidujících subjektů.
 *
 * Pořadí ve výpisu je redakční rozhodnutí, ne technický detail: kdo je nahoře,
 * dostane víc pozornosti. Web proto řadí ve výchozím stavu abecedně — je to
 * jediné pořadí, které nikoho nezvýhodňuje — a ostatní klíče nabízí jen tehdy,
 * když pro ně existují data a smějí se zveřejnit.
 */

export type KlicRazeni = 'abecedne' | 'cislo' | 'pruzkum'

export type PolozkaKRazeni = {
  slug: string
  /**
   * Text, podle kterého se řadí abecedně. MUSÍ to být přesně to, co čtenář
   * v seznamu vidí jako nadpis položky — když se seznam řadí podle skryté
   * zkratky a zobrazuje registrovaný název, vypadá výsledek jako náhodné
   * pořadí.
   */
  nazev: string
  /** Vylosované číslo na hlasovacím lístku, null dokud se nelosovalo. */
  cislo: number | null
  /** Procenta z posledního zveřejnitelného průzkumu, null když v něm subjekt není. */
  procenta: number | null
}

export const POPISEK_RAZENI: Record<KlicRazeni, string> = {
  abecedne: 'Abecedně',
  cislo: 'Podle čísla na lístku',
  pruzkum: 'Podle posledního průzkumu',
}

/**
 * Vysvětlení pod přepínačem. Každé pořadí něco tvrdí a čtenář má vědět co,
 * jinak si „podle průzkumu“ přečte jako „podle skutečnosti“.
 */
export const VYSVETLENI_RAZENI: Record<KlicRazeni, string> = {
  abecedne:
    'Abecedně podle názvu. Výchozí pořadí — jediné, které o šancích subjektů nic netvrdí.',
  cislo:
    'V pořadí vylosovaných čísel, tedy tak, jak subjekty uvidíte na hlasovacím lístku.',
  pruzkum:
    'Sestupně podle posledního zveřejněného průzkumu. Průzkum je odhad nálady v době sběru dat, ne předpověď výsledku — subjekty, které v něm nefigurují, jsou na konci abecedně.',
}

function abecedne(a: PolozkaKRazeni, b: PolozkaKRazeni): number {
  return a.nazev.localeCompare(b.nazev, 'cs') || a.slug.localeCompare(b.slug, 'cs')
}

/**
 * Seřadí položky podle klíče. Vrací novou kopii a nikdy nemění vstup —
 * stejná data se řadí na serveru i v prohlížeči a musí vyjít stejně.
 *
 * Subjekty bez hodnoty pro daný klíč (nevylosované číslo, chybí v průzkumu)
 * padají na konec a mezi sebou se řadí abecedně. Nikdy se nezahazují: výpis
 * kandidujících subjektů musí být vždy úplný, ať se řadí podle čehokoli.
 */
export function serad<T extends PolozkaKRazeni>(polozky: readonly T[], klic: KlicRazeni): T[] {
  const kopie = [...polozky]

  switch (klic) {
    case 'cislo':
      return kopie.sort((a, b) => {
        if (a.cislo !== null && b.cislo !== null) return a.cislo - b.cislo
        if (a.cislo !== null) return -1
        if (b.cislo !== null) return 1
        return abecedne(a, b)
      })

    case 'pruzkum':
      return kopie.sort((a, b) => {
        if (a.procenta !== null && b.procenta !== null) {
          // Při shodě procent nerozhoduje pořadí v datech, ale abeceda.
          return b.procenta - a.procenta || abecedne(a, b)
        }
        if (a.procenta !== null) return -1
        if (b.procenta !== null) return 1
        return abecedne(a, b)
      })

    default:
      return kopie.sort(abecedne)
  }
}

/**
 * Které klíče má smysl nabídnout. Přepínač se nesmí tvářit, že řadí podle
 * něčeho, k čemu nemáme data — to je horší než přepínač bez volby.
 */
export function dostupneKlice(polozky: readonly PolozkaKRazeni[]): KlicRazeni[] {
  const klice: KlicRazeni[] = ['abecedne']
  if (polozky.some((p) => p.cislo !== null)) klice.push('cislo')
  if (polozky.some((p) => p.procenta !== null)) klice.push('pruzkum')
  return klice
}
