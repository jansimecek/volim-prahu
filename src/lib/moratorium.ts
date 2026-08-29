/**
 * Moratorium na zveřejňování předvolebních průzkumů.
 *
 * Zadání žádá, aby bylo vynucené technicky, ne ruční — nastavené dopředu,
 * ne klikané večer před volbami.
 *
 * PRÁVNÍ ZÁKLAD SE ZMĚNIL. Do voleb 2026 platil § 30 odst. 3 zákona
 * č. 491/2001 Sb.; volební reforma ho odtud vyňala a od 1. 1. 2026 platí
 * jedno společné ustanovení pro všechny druhy voleb — § 6 odst. 1 zákona
 * č. 234/2025 Sb., o volebních kampaních a o transparentnosti a cílení
 * politické reklamy. Starší odkaz na § 30 odst. 3 je po celém internetu
 * a je zastaralý; § 5 téhož zákona vylučuje pro obecní volby jen § 3 odst. 3,
 * § 4 odst. 1, část třetí a § 24 odst. 1 písm. c) — § 6 mezi nimi není,
 * takže na komunální i senátní volby dopadá bez výjimky.
 *
 * Návrh zůstává fail-closed: bez vyplněné opory i data se nezobrazí nic.
 */

/**
 * Doslovné znění § 6 odst. 1 zákona č. 234/2025 Sb.
 * „V době počínající třetím dnem přede dnem voleb a končící ukončením
 * hlasování nesmějí být žádným způsobem zveřejňovány výsledky předvolebních
 * a volebních průzkumů.“
 *
 * Dnem voleb se podle § 2 odst. 4 rozumí první den voleb, tedy pátek
 * 9. 10. 2026. Třetí den přede dnem voleb je úterý 6. 10. 2026.
 */
export const MORATORIUM_OD: Date | null = new Date('2026-10-06T00:00:00+02:00')

/** Citace ustanovení, ze kterého lhůta plyne. Bez ní se datum nesmí použít. */
export const PRAVNI_OPORA: string | null =
  '§ 6 odst. 1 zákona č. 234/2025 Sb., o volebních kampaních a o transparentnosti a cílení politické reklamy'

/**
 * Konec moratoria — ukončení hlasování. Podle § 2 odst. 2 zákona č. 88/2024 Sb.,
 * o správě voleb, končí hlasování druhého dne voleb ve 14:00. Obecní ani
 * senátní volby se nekonají v zahraničí (§ 2 odst. 1), takže žádná delší
 * zahraniční lhůta okamžik ukončení neposouvá.
 */
export const MORATORIUM_DO = new Date('2026-10-10T14:00:00+02:00')

/** Odkaz, kterým se dá lhůta ověřit bez znalosti Sbírky. */
export const ZDROJ_LHUTY =
  'https://archiv.mv.gov.cz/volby/soubor/prehled-terminu-a-lhut-pro-volby-do-zastupitelstev-obci-2026.aspx'

export type StavMoratoria = 'neoveerno' | 'pred-moratoriem' | 'behem-moratoria' | 'po-volbach'

export function stavMoratoria(ted: Date = new Date()): StavMoratoria {
  if (!MORATORIUM_OD || !PRAVNI_OPORA) return 'neoveerno'
  if (ted >= MORATORIUM_DO) return 'po-volbach'
  if (ted >= MORATORIUM_OD) return 'behem-moratoria'
  return 'pred-moratoriem'
}

/**
 * Jediné místo, které rozhoduje, jestli se smí zobrazit obsah s průzkumem.
 * Volá ho komponenta i případné API — nikde jinde se to nesmí posuzovat.
 */
export function smiZobrazitPruzkum(ted: Date = new Date()): boolean {
  const stav = stavMoratoria(ted)
  return stav === 'pred-moratoriem' || stav === 'po-volbach'
}

export function duvodSkryti(ted: Date = new Date()): string {
  switch (stavMoratoria(ted)) {
    case 'behem-moratoria':
      return `Od úterý 6. října do soboty 10. října do 14:00 nesmějí být výsledky předvolebních a volebních průzkumů zveřejňovány žádným způsobem (${PRAVNI_OPORA}). Obsah se sem vrátí po uzavření volebních místností.`
    case 'neoveerno':
      return 'Obsah s předvolebními průzkumy nezveřejňujeme. Přesné znění lhůty, po kterou je zveřejňování zakázané, si zatím neověřujeme jistě — než to bude jisté, raději nezveřejňujeme nic.'
    default:
      return ''
  }
}
