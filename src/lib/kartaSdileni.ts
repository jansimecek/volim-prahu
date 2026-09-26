import { JAZYKY, jeJazyk } from '@/lib/jazyky'
import { preklad } from '@/preklady'
import type { Preklad } from '@/preklady'

/**
 * Společný podklad pro `opengraph-image` cizojazyčných stránek.
 *
 * Každá stránka má vlastní kartu, ne jednu na celou sekci. Odkaz se sdílí
 * po jedné konkrétní stránce — do skupiny se posílá „kde volím", ne
 * rozcestník — a karta, která u všech pěti odkazů vypadá stejně, nedá
 * příjemci důvod kliknout zrovna na tenhle.
 *
 * Soubory v `app/` z toho jsou jen tři řádky, protože Next vyžaduje
 * exporty na konkrétních místech a přes proměnnou je nepodstrčí.
 */
export type KlicKarty = keyof Preklad['sdileni'] & string

export function parametryKarty() {
  return JAZYKY.map((jazyk) => ({ jazyk }))
}

/** Texty jedné karty. Neznámý jazyk spadne na angličtinu, ne na výjimku. */
export function textyKarty(jazyk: string, klic: Exclude<KlicKarty, 'alt'>) {
  const t = preklad(jeJazyk(jazyk) ? jazyk : 'en')
  const karta = t.sdileni[klic]
  return {
    nadpisek: t.index.nadpisek,
    titulek: karta.titulek,
    podtitul: karta.podtitul,
    alt: t.sdileni.alt,
  }
}
