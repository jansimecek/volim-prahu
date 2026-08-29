import { pruzkumy as obsah } from '#content'
import { datumCesky } from './cestina'
import { duvodSkryti, smiZobrazitPruzkum } from './moratorium'
import { smiZobrazitPruzkumZaBehu } from './zaBehu'

/**
 * Přístup k předvolebním průzkumům.
 *
 * Průzkum je jediný obsah na webu, který dokáže sám o sobě ovlivnit volbu.
 * Platí pro něj dvě pravidla a obě vynucuje tenhle soubor:
 *  1. Na stránku se dostane jen přes `zobrazitelnyPruzkum()`, které se ptá
 *     moratoria. Nikde jinde se o zobrazení nerozhoduje.
 *  2. Když se zobrazí, jde s ním vždycky i to, kdo ho dělal, kdy sbíral data
 *     a jak velký měl vzorek. Číslo bez těchhle údajů je jen dojem.
 */

export type Pruzkum = (typeof obsah.pruzkumy)[number]

/** Nejnovější napřed. Rozhoduje konec sběru dat, ne datum zveřejnění. */
function odNejnovejsiho(a: Pruzkum, b: Pruzkum): number {
  return b.sberDo.localeCompare(a.sberDo) || b.zverejneno.localeCompare(a.zverejneno)
}

/** Všechny průzkumy pro danou úroveň. Neptá se moratoria — to dělá volající. */
export function pruzkumyUrovne(uroven: string): Pruzkum[] {
  return obsah.pruzkumy.filter((p) => p.uroven === uroven).sort(odNejnovejsiho)
}

/**
 * Poslední průzkum, který se v daný okamžik smí zobrazit. Čistá funkce —
 * používá ji test s vlastním časem.
 */
export function zobrazitelnyPruzkum(uroven: string, ted: Date = new Date()): Pruzkum | null {
  if (!smiZobrazitPruzkum(ted)) return null
  return pruzkumyUrovne(uroven)[0] ?? null
}

/**
 * Totéž pro stránky. Jediná cesta, kterou se průzkum smí dostat do HTML.
 *
 * Rozdíl proti čisté variantě je v tom, kdy se čas čte: tady až při
 * vyřizování požadavku, ne při generování stránky. Bez toho by uložená
 * kopie stránky mohla průzkum zveřejňovat ještě po začátku zakázané lhůty.
 */
export async function zobrazitelnyPruzkumZaBehu(uroven: string): Promise<Pruzkum | null> {
  const kandidat = pruzkumyUrovne(uroven)[0]
  if (!kandidat) return null
  return (await smiZobrazitPruzkumZaBehu(true)) ? kandidat : null
}

/** Procenta podle slugu subjektu. Subjekt, který v průzkumu není, tu chybí. */
export function procentaPodleSubjektu(pruzkum: Pruzkum | null): Record<string, number> {
  if (!pruzkum) return {}
  return Object.fromEntries(pruzkum.vysledky.map((v) => [v.subjekt, v.procenta]))
}

/**
 * Proč se řazení podle průzkumu nenabízí. Rozlišuje dva různé důvody —
 * „zatím žádný nemáme" a „zákon ho teď zveřejnit nedovolí" — protože pro
 * čtenáře to znamená něco úplně jiného.
 */
export function duvodBezPruzkumu(uroven: string, ted: Date = new Date()): string | null {
  // Pořadí podmínek je podstatné. Kdyby se ptalo nejdřív moratorium, web by
  // v zakázané lhůtě tvrdil „zákon nám brání to ukázat" i tehdy, když žádný
  // průzkum nemáme — čtenář by z toho vyvodil, že nějaký zadržujeme.
  if (pruzkumyUrovne(uroven).length === 0) {
    return (
      obsah.poznamka?.text ??
      'Pro tuhle úroveň zatím nemáme žádný průzkum s doloženým termínem sběru dat, velikostí vzorku a metodou.'
    )
  }
  if (!smiZobrazitPruzkum(ted)) return duvodSkryti(ted)
  return null
}

/** Zdroje k poznámce o průzkumech. Tvrzení o jmenovaných subjektech je musí mít. */
export function zdrojePoznamky(): { text: string; url: string }[] {
  return obsah.poznamka?.zdroje ?? []
}

const formatProcenta = new Intl.NumberFormat('cs-CZ', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

export const procenta = (n: number) => `${formatProcenta.format(n)} %`

/** Jednořádkový popis původu čísel. Zobrazuje se vždy nad seřazeným výpisem. */
export function puvodPruzkumu(p: Pruzkum): string {
  return `${p.agentura} pro ${p.zadavatel} · sběr ${datumCesky(p.sberOd)} – ${datumCesky(p.sberDo)} · ${p.velikostVzorku} respondentů`
}
