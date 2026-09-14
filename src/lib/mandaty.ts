/**
 * Přepočet hlasů na mandáty ve volbách do zastupitelstev obcí podle § 45
 * zákona č. 491/2001 Sb.
 *
 * Stejný postup platí pro Zastupitelstvo hl. m. Prahy i pro všech 57 městských
 * částí. Implementace je ověřená proti oficiálnímu rozdělení mandátů z voleb
 * 2022 ve všech 58 pražských zastupitelstvech.
 *
 * Výpočet je aritmetika, ne předpověď. Kalkulačka na webu z ní smí ukázat jen
 * to, co vychází ze zadaných čísel — ne to, kdo volby vyhraje.
 */

export type StranaKPrepoctu = {
  /** Cokoli, co stranu v rámci jednoho zastupitelstva jednoznačně určuje. */
  id: string
  /**
   * Hlasy strany. Kalkulačka sem dává procenta — výsledek na měřítku nezávisí,
   * jen `platnychHlasu` pak musí být 100, ne součet zadaných stran.
   */
  hlasy: number
  /** Počet kandidátů na hlasovacím lístku. Strana nemůže dostat víc mandátů, než má kandidátů. */
  kandidatu: number
}

export type PrepoctenaStrana = StranaKPrepoctu & { postupuje: boolean; mandaty: number }

export type Prepocet = {
  strany: PrepoctenaStrana[]
  /** Uzavírací klauzule v procentech, se kterou se nakonec počítalo. */
  klauzule: number
  /** Kolik mandátů se rozdělilo. Méně než počet mandátů jen tehdy, když strany nemají dost kandidátů. */
  rozdeleno: number
  /**
   * O posledním mandátu by rozhodl los: poslední přidělený a první nepřidělený
   * podíl jsou shodné a strany mají i shodný celkový počet hlasů.
   */
  los: boolean
}

/**
 * Hranice pro postup je 5 % z celkového počtu platných hlasů, vyděleného počtem
 * volených členů zastupitelstva a vynásobeného počtem kandidátů strany, nejvýš
 * však počtem členů. Strana s neúplnou kandidátkou má tedy hranici úměrně nižší.
 */
function postupujici(
  strany: readonly StranaKPrepoctu[],
  mandatu: number,
  platnychHlasu: number,
  klauzule: number,
): Set<string> {
  // Bez dělení: hlasy >= p/100 × (V / M) × min(k, M)  ⇔  hlasy × 100 × M >= p × V × min(k, M)
  return new Set(
    strany
      .filter(
        (s) =>
          s.hlasy > 0 &&
          s.hlasy * 100 * mandatu >= klauzule * platnychHlasu * Math.min(s.kandidatu, mandatu) - 1e-9,
      )
      .map((s) => s.id),
  )
}

/** Kolik mandátů by postupující strany dokázaly obsadit — nejvýš tolik, kolik mají kandidátů. */
function obsaditelnych(strany: readonly StranaKPrepoctu[], postup: Set<string>, mandatu: number): number {
  return Math.min(
    mandatu,
    strany.filter((s) => postup.has(s.id)).reduce((n, s) => n + s.kandidatu, 0),
  )
}

export function rozdelMandaty(
  strany: readonly StranaKPrepoctu[],
  mandatu: number,
  platnychHlasu: number = strany.reduce((n, s) => n + s.hlasy, 0),
  klauzule = 5,
): Prepocet {
  // Při jediné kandidátní listině se k hranici nepřihlíží vůbec.
  let pouzita = strany.length === 1 ? 0 : klauzule
  let postup = postupujici(strany, mandatu, platnychHlasu, pouzita)

  // Hranice se snižuje po jednom procentu, dokud nepostoupí aspoň dvě strany
  // a dokud postupující strany nedokážou obsadit nadpoloviční většinu mandátů.
  while (pouzita > 0 && (postup.size < 2 || obsaditelnych(strany, postup, mandatu) <= mandatu / 2)) {
    pouzita -= 1
    postup = postupujici(strany, mandatu, platnychHlasu, pouzita)
  }

  // d'Hondt: hlasy strany se dělí 1, 2, 3 … a dělení je tolik, kolik má strana kandidátů.
  // Při rovnosti podílů rozhoduje vyšší celkový počet hlasů strany, teprve pak los.
  const podily = strany
    .filter((s) => postup.has(s.id))
    .flatMap((s) =>
      Array.from({ length: s.kandidatu }, (_, i) => ({ id: s.id, podil: s.hlasy / (i + 1), hlasy: s.hlasy })),
    )
    .sort((a, b) => b.podil - a.podil || b.hlasy - a.hlasy)

  const pridelene = podily.slice(0, mandatu)
  const posledni = pridelene.at(-1)
  const dalsi = podily[mandatu]
  const los = Boolean(
    posledni && dalsi && posledni.id !== dalsi.id &&
      Math.abs(posledni.podil - dalsi.podil) < 1e-9 && posledni.hlasy === dalsi.hlasy,
  )

  const pocet = new Map<string, number>()
  for (const p of pridelene) pocet.set(p.id, (pocet.get(p.id) ?? 0) + 1)

  return {
    strany: strany.map((s) => ({ ...s, postupuje: postup.has(s.id), mandaty: pocet.get(s.id) ?? 0 })),
    klauzule: pouzita,
    rozdeleno: pridelene.length,
    los,
  }
}
