/**
 * Režim webu podle fáze voleb.
 *
 * Po volbách nesmí web zůstat viset v předvolebním stavu. Přepnutí je proto
 * odvozené od času, ne od toho, jestli si na to někdo vzpomene.
 */

/** Otevření volebních místností v pátek. */
export const ZACATEK_VOLEB = new Date('2026-10-09T14:00:00+02:00')
/** Uzavření volebních místností v sobotu — začíná sčítání. */
export const KONEC_HLASOVANI = new Date('2026-10-10T14:00:00+02:00')
/**
 * ČSÚ dokončil sčítání v neděli ráno (poslední data 11. 10. v 8:35). Od té
 * chvíle web nesleduje volby, ale vyjednávání o vedení Prahy a městských částí.
 */
export const KONEC_SCITANI = new Date('2026-10-11T08:35:00+02:00')

/**
 * Zastupitelstvo hlavního města zvolilo 19. 11. 2026 primátora a radu (volba
 * skončila krátce před 15. hodinou). Od té chvíle web nesleduje, kdo s kým
 * jedná o magistrátu, ale co rada slíbila a jak to plní — po celé období
 * 2026–2030. V několika městských částech se o vedení jedná dál; to zůstává
 * na stránce vyjednávání.
 */
export const ZVOLENA_RADA_MAGISTRATU = new Date('2026-11-19T15:00:00+01:00')

/**
 * Po volbách web neodchází do archivu: nejdřív sleduje, kdo s kým jedná,
 * pak vedení města po celé volební období. Předvolební obsah zůstává
 * dostupný jako archiv kampaně, ale nic z něj už není návod, jak volit.
 */
export type Rezim = 'pred-volbami' | 'volebni-dny' | 'scitani' | 'vyjednavani' | 'obdobi'

export function rezimWebu(ted: Date = new Date()): Rezim {
  if (ted >= ZVOLENA_RADA_MAGISTRATU) return 'obdobi'
  if (ted >= KONEC_SCITANI) return 'vyjednavani'
  if (ted >= KONEC_HLASOVANI) return 'scitani'
  if (ted >= ZACATEK_VOLEB) return 'volebni-dny'
  return 'pred-volbami'
}

export function jePoVolbach(ted: Date = new Date()): boolean {
  const rezim = rezimWebu(ted)
  return rezim === 'vyjednavani' || rezim === 'obdobi'
}

export const POPIS_REZIMU: Record<Rezim, string | null> = {
  'pred-volbami': null,
  'volebni-dny': 'Volební místnosti jsou otevřené. Volí se v pátek do 22:00 a v sobotu od 8:00 do 14:00.',
  scitani: 'Hlasování skončilo, probíhá sčítání. Průběžné výsledky najdete na stránce Výsledky.',
  vyjednavani:
    'Komunální volby 2026 skončily. Sledujeme, kdo s kým jedná o vedení Prahy a městských částí. Předvolební obsah zůstává jako archiv kampaně — nic z něj už není návod, jak volit.',
  obdobi:
    'Prahu od 19. listopadu 2026 vede rada koalice STAN, SPOLU a Prahy sobě. Sledujeme její koaliční smlouvu a práci radních; v několika městských částech se o vedení ještě jedná. Předvolební obsah zůstává jako archiv kampaně.',
}
