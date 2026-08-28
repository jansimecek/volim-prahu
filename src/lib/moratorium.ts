/**
 * Moratorium na zveřejňování předvolebních průzkumů.
 *
 * Zadání žádá, aby bylo vynucené technicky, ne ruční — nastavené dopředu,
 * ne klikané večer před volbami.
 *
 * NÁVRH JE FAIL-CLOSED. Dokud není potvrzený právní základ a přesné datum,
 * obsah s průzkumy se nezobrazuje VŮBEC. Důvod: zákon č. 491/2001 Sb. byl
 * letos novelizován zákonem č. 70/2026 Sb. a přesné znění lhůty se nám
 * z veřejných zdrojů nepodařilo ověřit — e-Sbírka i zakonyprolidi.cz vracejí
 * jen JavaScriptový obal bez textu.
 *
 * Skrýt legální obsah je nepříjemné. Zveřejnit průzkum v zakázané lhůtě je
 * porušení zákona. Volíme to první.
 *
 * AŽ SE ZNĚNÍ OVĚŘÍ: vyplnit MORATORIUM_OD i PRAVNI_OPORA a doplnit test.
 */

/** Začátek moratoria. `null` znamená „nepotvrzeno“, a tedy nezveřejňovat nic. */
export const MORATORIUM_OD: Date | null = null

/** Citace ustanovení, ze kterého lhůta plyne. Bez ní se datum nesmí použít. */
export const PRAVNI_OPORA: string | null = null

/** Konec moratoria — uzavření volebních místností. */
export const MORATORIUM_DO = new Date('2026-10-10T14:00:00+02:00')

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
      return 'Zákon zakazuje zveřejňovat výsledky předvolebních průzkumů v období těsně před volbami. Obsah se znovu objeví po uzavření volebních místností.'
    case 'neoveerno':
      return 'Obsah s předvolebními průzkumy nezveřejňujeme. Zákon o volbách do zastupitelstev obcí byl letos novelizován a přesné znění lhůty, po kterou je zveřejňování zakázané, jsme si zatím neověřili. Než to bude jisté, raději nezveřejňujeme nic.'
    default:
      return ''
  }
}
