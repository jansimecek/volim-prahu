import { rada } from '#content'
import { type Kandidat, kandidatka } from './kandidatky'
import { type Kapitola, type Oddil, oddilyRadniho } from './smlouva'
import { vyjednavaniZastupitelstva } from './vyjednavani'

type ZaznamRady = (typeof rada)['clenove'][number]
type Funkce = NonNullable<ReturnType<typeof vyjednavaniZastupitelstva>>['vedeni'][number]

export type Radni = ZaznamRady &
  Funkce & {
    /** Údaje z kandidátní listiny ČSÚ — věk a povolání v době kandidatury. */
    kandidatura: Kandidat | undefined
    oddily: { kapitola: Kapitola; oddil: Oddil }[]
    /** Počet závazků smlouvy v oddílech, za které radní odpovídá. */
    zavazku: number
  }

/**
 * Rada hlavního města v pořadí, ve kterém ji zvolilo zastupitelstvo
 * (primátor, náměstci, radní). Funkce a gesce se berou z `vedeni`
 * magistrátu, podklad rady jen doplňuje. Shodu jmen hlídá `pnpm validate`.
 */
export function radaMagistratu(): Radni[] {
  const vedeni = vyjednavaniZastupitelstva('magistrat')?.vedeni ?? []
  const kandidati = new Map(
    (kandidatka('magistrat')?.strany ?? []).flatMap((s) => s.kandidati.map((k) => [k.slug, k] as const)),
  )
  return vedeni.flatMap((funkce) => {
    const zaznam = rada.clenove.find((c) => c.jmeno === funkce.jmeno)
    if (!zaznam) return []
    const oddily = oddilyRadniho(funkce.jmeno)
    return [
      {
        ...zaznam,
        ...funkce,
        kandidatura: kandidati.get(zaznam.kandidat),
        oddily,
        zavazku: oddily.reduce((n, o) => n + o.oddil.zavazky.length, 0),
      },
    ]
  })
}

export function zdrojRady(id: string) {
  return rada.zdroje.find((z) => z.id === id)
}

/** Kotva radního na stránce /rada — stejná z odkazů ze smlouvy i z vyjednávání. */
export function kotvaRadniho(jmeno: string): string {
  return `radni-${jmeno
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`
}

export { rada }
