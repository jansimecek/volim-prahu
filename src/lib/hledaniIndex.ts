import MiniSearch from 'minisearch'
import { bezDiakritiky } from '@/lib/slug'

/**
 * Rejstřík pro vyhledávání po celém webu.
 *
 * Generuje ho scripts/build-search-index.ts do public/hledani.json a tady se
 * z něj v prohlížeči staví MiniSearch. Načítá se až při první interakci
 * s hledáním a jen jednou za návštěvu: hledání v hlavičce a stránka /hledani
 * sdílejí tentýž příslib, takže se 750 kB nestahuje dvakrát.
 */

export type TypZaznamu = 'k' | 's' | 'm' | 'o' | 'p' | 'z' | 'r'
type Zaznam = [nazev: string, popis: string, url: string, typ: TypZaznamu]
export type Dokument = { id: number; nazev: string; popis: string; url: string; typ: TypZaznamu }
export type Vysledek = Dokument & { score: number; terms: string[] }

/** Pořadí, ve kterém se typy nabízejí ve filtru. */
export const TYPY: readonly { typ: TypZaznamu; jednotne: string; mnozne: string }[] = [
  { typ: 'k', jednotne: 'kandidát', mnozne: 'Kandidáti' },
  { typ: 's', jednotne: 'volební strana', mnozne: 'Strany' },
  { typ: 'm', jednotne: 'městská část', mnozne: 'Městské části' },
  { typ: 'o', jednotne: 'senátní obvod', mnozne: 'Senát' },
  { typ: 'p', jednotne: 'stránka', mnozne: 'Stránky' },
  { typ: 'z', jednotne: 'aktualita', mnozne: 'Aktuálně' },
  { typ: 'r', jednotne: 'rozhovor', mnozne: 'Rozhovory' },
]

export const POPIS_TYPU = Object.fromEntries(TYPY.map((t) => [t.typ, t.jednotne])) as Record<
  TypZaznamu,
  string
>

/**
 * Kandidátů je v rejstříku skoro osm tisíc, všeho ostatního pár desítek.
 * Bez zvýhodnění by dotaz „praha 5" vrátil stovky kandidátů z Prahy 5 dřív
 * než samotnou městskou část — tedy to, co čtenář skoro jistě hledal.
 */
const ZVYHODNENI: Record<TypZaznamu, number> = { k: 1, s: 2.5, m: 3, o: 2.5, p: 2, z: 1.2, r: 1.2 }

/** Index se hledá bez ohledu na diakritiku — „novak" musí najít Nováka. */
export const normalizuj = (term: string) => bezDiakritiky(term).toLowerCase()

let prislib: Promise<MiniSearch<Dokument>> | null = null

export function nactiIndex(): Promise<MiniSearch<Dokument>> {
  prislib ??= fetch('/hledani.json')
    .then((odpoved) => {
      if (!odpoved.ok) throw new Error(`HTTP ${odpoved.status}`)
      return odpoved.json() as Promise<Zaznam[]>
    })
    .then((data) => {
      const ms = new MiniSearch<Dokument>({
        fields: ['nazev', 'popis'],
        storeFields: ['nazev', 'popis', 'url', 'typ'],
        processTerm: (term) => normalizuj(term),
        searchOptions: {
          prefix: true,
          fuzzy: 0.15,
          boost: { nazev: 3 },
          // Víceslovný dotaz („jana nová") má najít tu, která má obě slova,
          // ne každou Janu a každou Novou.
          combineWith: 'AND',
          boostDocument: (_id, _term, ulozene) => ZVYHODNENI[(ulozene?.typ as TypZaznamu) ?? 'k'],
        },
      })
      ms.addAll(data.map(([nazev, popis, url, typ], id) => ({ id, nazev, popis, url, typ })))
      return ms
    })
    .catch((chyba: unknown) => {
      // Neúspěch se nesmí zapamatovat — další pokus má zkusit stáhnout znovu.
      prislib = null
      throw chyba
    })
  return prislib
}

export function hledej(index: MiniSearch<Dokument>, dotaz: string): Vysledek[] {
  const hledane = dotaz.trim()
  if (hledane.length < 2) return []
  const vysledky = index.search(hledane) as unknown as Vysledek[]
  // AND bez výsledku většinou znamená překlep v jednom slově — pak radši
  // nabídnout, co sedí aspoň částečně, než prázdný seznam.
  if (vysledky.length > 0 || !/\s/.test(hledane)) return vysledky
  return index.search(hledane, { combineWith: 'OR' }) as unknown as Vysledek[]
}
