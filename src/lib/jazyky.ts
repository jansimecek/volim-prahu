/**
 * Jazykové verze webu pro voliče, kteří nečtou česky.
 *
 * V Praze žije zhruba 69 tisíc cizinců s trvalým pobytem a část z nich má
 * volební právo, aniž by o tom věděla — informace o volbách vydávají úřady
 * skoro výhradně česky. Web proto vede dvě cizojazyčné verze: anglickou
 * jako společný jazyk pražské cizinecké komunity a ukrajinskou jako jazyk
 * její největší skupiny.
 *
 * Nejde o překlad celého webu. Přeložená je ta část, která rozhoduje
 * o tom, jestli člověk k volbám vůbec půjde: kdo smí volit, kde, kdy, co
 * si vzít a co se vlastně volí. Zbytek — profily kandidátů, hodnocení
 * programů, citace — zůstává česky a odkazuje se do české verze, protože
 * strojový překlad doslovné citace už doslovná citace není.
 */

export const JAZYKY = ['en', 'uk'] as const

export type Jazyk = (typeof JAZYKY)[number]

export function jeJazyk(hodnota: string): hodnota is Jazyk {
  return (JAZYKY as readonly string[]).includes(hodnota)
}

/**
 * Popis jazyka. `vlastni` je název jazyka v něm samém — přepínač jazyků
 * musí být čitelný pro toho, kdo aktuální jazyk stránky neumí.
 */
export const POPIS_JAZYKA: Record<Jazyk, { vlastni: string; cesky: string; htmlLang: string }> = {
  en: { vlastni: 'English', cesky: 'anglicky', htmlLang: 'en' },
  uk: { vlastni: 'Українська', cesky: 'ukrajinsky', htmlLang: 'uk' },
}

/** Podstránky cizojazyčné verze. Slugy jsou anglické ve všech jazycích. */
export const PODSTRANKY = ['can-i-vote', 'how-to-vote', 'what-is-decided', 'who-is-running'] as const

export type Podstranka = (typeof PODSTRANKY)[number]

/**
 * Odhad počtu cizinců s pobytem v Praze. Číslo je v textech jen jako řádová
 * orientace („tens of thousands"), nikdy jako přesný údaj — přesné číslo se
 * mění každý měsíc a web ho z otevřených dat průběžně nepřebírá.
 */
export const ZDROJ_POCTU_CIZINCU = {
  popis: 'Cizinci s pobytem v Praze podle statistik ČSÚ a MV ČR',
  odkaz: 'https://csu.gov.cz/cizinci',
} as const

/**
 * Mapa hreflang pro jednu stránku cizojazyčné sekce.
 *
 * `x-default` míří na češtinu: je to jazyk, ve kterém web existuje celý,
 * a pro návštěvníka, jehož jazyk tu nemáme, je úplný český web užitečnější
 * než neúplný překlad do třetího jazyka.
 */
export function jazykoveVarianty(cesta: string): Record<string, string> {
  const zbytek = cesta.replace(/^\/(en|uk)(?=\/|$)/, '')
  const cesky = ceskyProtejsek(zbytek)
  const mapa: Record<string, string> = { 'x-default': cesky, cs: cesky }
  for (const j of JAZYKY) mapa[j] = `/${j}${zbytek}`
  return mapa
}

/**
 * Česká stránka, která nejlíp odpovídá dané cizojazyčné. Není to překlad
 * jedna ku jedné — česká verze dělí obsah jinak — ale vyhledávač i čtenář
 * se mají kam vrátit.
 */
export function ceskyProtejsek(zbytek: string): string {
  switch (zbytek) {
    case '/can-i-vote':
    case '/how-to-vote':
      return '/kde-volim'
    case '/what-is-decided':
      return '/kdo-o-cem-rozhoduje'
    case '/who-is-running':
      return '/praha'
    default:
      return '/'
  }
}

/**
 * Zpětné odkazy z české stránky na její cizojazyčné protějšky.
 *
 * hreflang musí být vzájemný — jednosměrný odkaz z anglické stránky na
 * českou vyhledávač jako jazykovou variantu neuzná. Mapování není jedna
 * ku jedné: `/kde-volim` odpovídá dvěma anglickým stránkám a ukazuje se
 * na tu, kterou čtenář hledá dřív, tedy na „smím vůbec volit".
 */
export function cizojazycneVarianty(
  ceskaCesta: string,
  podstranka: Podstranka | null,
): Record<string, string> {
  const zbytek = podstranka ? `/${podstranka}` : ''
  const mapa: Record<string, string> = { 'x-default': ceskaCesta, cs: ceskaCesta }
  for (const j of JAZYKY) mapa[j] = `/${j}${zbytek}`
  return mapa
}
