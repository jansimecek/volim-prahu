import type { Strana } from '#content'

/** Popisky stavu programu. Používá je výpis i profil, ať se nerozejdou. */
export const POPIS_PROGRAMU: Record<Strana['programStav'], string> = {
  zverejnen: 'program zveřejněn',
  'jen-casti': 'zveřejněny jen části',
  'jen-priority': 'jen programové priority',
  avizovan: 'program ohlášen',
  nedohledan: 'program nedohledán',
}

export const POPIS_ROLE: Record<NonNullable<Strana['lidrRole']>, string> = {
  'lidr-kandidatky': 'Lídr kandidátky',
  'kandidat-na-primatora': 'Kandidát na primátora',
}

/** Řadí abecedně podle registrovaného názvu, ne podle velikosti nebo preferencí. */
export function serazene(strany: Strana[]): Strana[] {
  return [...strany].sort((a, b) => a.zkratka.localeCompare(b.zkratka, 'cs'))
}
