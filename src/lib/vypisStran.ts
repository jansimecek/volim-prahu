import { programy, strany } from '#content'
import type { UdajeDlazdice } from '@/components/DlazdiceStrany'
import { celeJmeno, lidr, stranaPodleKodu } from './kandidatky'
import { procentaPodleSubjektu, zobrazitelnyPruzkumZaBehu, type Pruzkum } from './pruzkumy'
import { serazene } from './strany'

/**
 * Podklad pro výpis kandidujících subjektů.
 *
 * Redakční obsah (content/strany) se tady spojuje s daty ČSÚ (kandidátky),
 * s hodnocením programu a případně s průzkumem. Dělá se to na jednom místě,
 * aby dvě stránky nemohly o téže straně tvrdit každá něco jiného.
 */
export async function vypisStran(uroven: string): Promise<{
  polozky: UdajeDlazdice[]
  pruzkum: Pruzkum | null
}> {
  // Moratorium se vyhodnocuje až při vyřizování požadavku, ne při generování
  // stránky — jinak by uložená kopie mohla průzkum zveřejňovat i po začátku
  // zakázané lhůty. Dokud žádný průzkum neexistuje, zůstává stránka statická.
  const pruzkum = await zobrazitelnyPruzkumZaBehu(uroven)
  const procenta = procentaPodleSubjektu(pruzkum)

  const polozky = serazene(strany.filter((s) => s.uroven === uroven)).map((strana) => {
    const naListine = stranaPodleKodu(uroven, strana.kodStrany)
    const jednicka = lidr(naListine)

    return {
      slug: strana.slug,
      zkratka: strana.zkratka,
      lidr: jednicka ? celeJmeno(jednicka) : null,
      povolani: jednicka?.povolani || null,
      pocetKandidatu: naListine?.kandidati.length ?? 0,
      programStav: strana.programStav,
      pocetHodnoceni:
        programy
          .find((p) => p.subjekt === strana.slug && p.uroven === uroven)
          ?.body.filter((b) => b.hodnoceni).length ?? 0,
      // Nevylosované číslo je null, ne nula — nula by se řadila na začátek.
      cislo: naListine?.vylosovano ? naListine.cislo : null,
      procenta: procenta[strana.slug] ?? null,
    }
  })

  return { polozky, pruzkum }
}
