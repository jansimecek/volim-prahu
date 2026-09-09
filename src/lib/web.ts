/**
 * Veřejná adresa webu. Produkce přesměrovává z volimprahu.cz na www,
 * takže kanonická podoba je s www — bez toho by vyhledávače viděly každou
 * stránku dvakrát a odkazy ve feedu a v sitemapě by vedly přes přesměrování.
 */
export const ZAKLAD_WEBU = 'https://www.volimprahu.cz'

export function absolutni(cesta: string): string {
  return new URL(cesta, ZAKLAD_WEBU).toString()
}

/** Kontakt uvedený na /o-projektu a v zásadách ochrany údajů. */
export const KONTAKT_EMAIL = 'volimprahu@gmail.com'
