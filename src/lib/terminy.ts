/**
 * Termíny po volbách 2026.
 *
 * Lhůty ustavujících zasedání se počítají od vyhlášení celkových výsledků
 * Státní volební komisí: návrh soudu na neplatnost voleb do 10 dnů (§ 60
 * zákona č. 491/2001 Sb.), zasedání do 15 dnů od uplynutí té lhůty (§ 61
 * zákona č. 131/2000 Sb. pro magistrát, § 91 zákona č. 128/2000 Sb. pro
 * městské části). Když někdo návrh podá, běží 15 dnů až od právní moci
 * rozhodnutí soudu — to tu nepočítáme, u dotčeného zastupitelstva se to
 * zapíše do jeho vyjednávání.
 */

/**
 * Den, kdy Státní volební komise vyhlásila celkové výsledky (sdělení ve
 * Sbírce zákonů), ve tvaru RRRR-MM-DD. Dokud je null, lhůty neukazujeme —
 * radši „zatím nevyhlášeno“ než vymyšlené datum.
 */
export const VYHLASENI_SVK: string | null = null

/** Druhé kolo senátních voleb ve třech pražských obvodech. */
export const DRUHE_KOLO_SENATU = { od: '2026-10-16', do: '2026-10-17' } as const

function plusDny(datum: string, dny: number): string {
  const d = new Date(`${datum}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dny)
  return d.toISOString().slice(0, 10)
}

export type Lhuty = { vyhlaseno: string; navrhSouduDo: string; zasedaniNejpozdeji: string }

export function lhutyUstavujichZasedani(vyhlaseno: string | null = VYHLASENI_SVK): Lhuty | null {
  if (!vyhlaseno) return null
  const navrhSouduDo = plusDny(vyhlaseno, 10)
  return { vyhlaseno, navrhSouduDo, zasedaniNejpozdeji: plusDny(navrhSouduDo, 15) }
}
