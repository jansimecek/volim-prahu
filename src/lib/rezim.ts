/**
 * Režim webu podle fáze voleb.
 *
 * Zadání je v tomhle výslovné: po volbách nesmí web zůstat viset
 * v předvolebním stavu. Přepnutí je proto odvozené od času, ne od toho,
 * jestli si na to někdo vzpomene.
 */

/** Otevření volebních místností v pátek. */
export const ZACATEK_VOLEB = new Date('2026-10-09T14:00:00+02:00')
/** Uzavření volebních místností v sobotu — začíná sčítání. */
export const KONEC_HLASOVANI = new Date('2026-10-10T14:00:00+02:00')
/** Od tohoto okamžiku je web archivem, ne průvodcem. */
export const ZACATEK_ARCHIVU = new Date('2026-10-13T00:00:00+02:00')

export type Rezim = 'pred-volbami' | 'volebni-dny' | 'scitani' | 'archiv'

export function rezimWebu(ted: Date = new Date()): Rezim {
  if (ted >= ZACATEK_ARCHIVU) return 'archiv'
  if (ted >= KONEC_HLASOVANI) return 'scitani'
  if (ted >= ZACATEK_VOLEB) return 'volebni-dny'
  return 'pred-volbami'
}

export function jeArchiv(ted: Date = new Date()): boolean {
  return rezimWebu(ted) === 'archiv'
}

export const POPIS_REZIMU: Record<Rezim, string | null> = {
  'pred-volbami': null,
  'volebni-dny': 'Volební místnosti jsou otevřené. Volí se v pátek do 22:00 a v sobotu od 8:00 do 14:00.',
  scitani: 'Hlasování skončilo, probíhá sčítání. Průběžné výsledky najdete na stránce Výsledky.',
  archiv:
    'Komunální volby 2026 už proběhly. Tenhle web je od té chvíle archiv — obsah zůstává dostupný kvůli dohledatelnosti, ale nic z něj už není návod, jak volit.',
}
