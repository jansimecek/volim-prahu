/**
 * Nejbližší zastávka PID u volební místnosti.
 *
 * Vzdálenost je vzdušnou čarou a věta to říká — mezi místností a zastávkou
 * může být kolejiště nebo svah, takže pěší trasa bývá delší. Linky se
 * vypisují po druzích dopravy, protože „9" u tramvaje a „9" u autobusu jsou
 * jiné linky.
 */
import { dosad } from '@/lib/sablony'
import type { ZastavkaMistnosti } from '@/lib/zastavkyTypy'

/** Kolik linek se vypíše, než se seznam utne. U uzlů jako Anděl jich jsou desítky. */
const MAX_LINEK = 8

const POPIS_TYPU: Record<string, string> = {
  metro: 'metro',
  tram: 'tram',
  train: 'vlak',
  trolleybus: 'trolejbus',
  bus: 'bus',
  ferry: 'přívoz',
  funicular: 'lanovka',
}

export function popisLinek(linky: ZastavkaMistnosti['linky']): string {
  const skupiny = new Map<string, string[]>()
  for (const linka of linky.slice(0, MAX_LINEK)) {
    const typ = POPIS_TYPU[linka.typ] ?? linka.typ
    skupiny.set(typ, [...(skupiny.get(typ) ?? []), linka.nazev])
  }
  const text = [...skupiny.entries()].map(([typ, nazvy]) => `${typ} ${nazvy.join(', ')}`).join(' · ')
  return linky.length > MAX_LINEK ? `${text} …` : text
}

/** Jen klíče, které tenhle výpis potřebuje — používá ho vyhledávač i widget „Moje volby". */
export type TextyZastavky = {
  zastavka: string
  zastavkaBezbarierova: string
  zastavkaLinky: string
  jednotkaM: string
  jednotkaKm: string
}

export function Zastavka({
  zastavka,
  texty,
  locale,
}: {
  zastavka: ZastavkaMistnosti
  texty: TextyZastavky
  locale: string
}) {
  const vzdalenost =
    zastavka.metru < 1000
      ? `${zastavka.metru} ${texty.jednotkaM}`
      : `${(Math.round(zastavka.metru / 100) / 10).toLocaleString(locale)} ${texty.jednotkaKm}`
  return (
    <p className="mt-1 text-sm">
      {dosad(texty.zastavka, { nazev: zastavka.nazev, vzdalenost })}
      {zastavka.bezbarierovaZastavka && (
        <span className="popisek-uredni ml-2">{texty.zastavkaBezbarierova}</span>
      )}
      {zastavka.linky.length > 0 && (
        <span className="block" lang="cs">
          {dosad(texty.zastavkaLinky, { linky: popisLinek(zastavka.linky) })}
        </span>
      )}
    </p>
  )
}
