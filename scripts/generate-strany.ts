/**
 * Vygeneruje skelet profilů volebních stran kandidujících do Zastupitelstva
 * hl. m. Prahy z úředního seznamu MHMP.
 *
 *   pnpm gen:strany
 *
 * Existující soubory nepřepisuje. Názvy jsou přesně tak, jak zní v rozhodnutí
 * o registraci — nezkracovat, nepřepisovat velikost písmen.
 *
 * Zdroj seznamu: „Kandidátní listiny podané pro volby do Zastupitelstva
 * hlavního města Prahy – výsledek registračního řízení", MHMP, staženo 25. 8. 2026.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KOREN = join(__dirname, '..')
const CIL = join(KOREN, 'content/strany/magistrat')
const OVERENO = '2026-08-25'

const REGISTR =
  'https://praha.eu/documents/d/praha/kandidatni-listiny-vysledek-registracniho-rizeni'

type ProgramStav = 'zverejnen' | 'jen-casti' | 'jen-priority' | 'avizovan' | 'nedohledan'

type Subjekt = {
  slug: string
  nazev: string
  zkratka: string
  lidr?: string
  lidrRole?: 'lidr-kandidatky' | 'kandidat-na-primatora'
  lidrPopis?: string
  lidrZdroj?: string
  slozeni?: string
  web?: string
  programStav: ProgramStav
  programUrl?: string
  programPoznamka?: string
}

/**
 * Lídři jsou uvedeni jen tam, kde je doložil ověřený zdroj. U zbylých
 * kandidátek jednička k 25. 8. 2026 dohledána nebyla a raději nic nepíšeme,
 * než abychom hádali.
 */
const SUBJEKTY: Subjekt[] = [
  {
    slug: 'ano-2011',
    nazev: 'ANO 2011',
    zkratka: 'ANO',
    lidr: 'Jan Hušbauer',
    lidrRole: 'lidr-kandidatky',
    lidrPopis: 'zastupitel hl. m. Prahy, místostarosta Prahy 4 a předseda klubu ANO v pražském zastupitelstvu',
    lidrZdroj: 'https://www.ceskenoviny.cz/zpravy/vedeni-hnuti-ano-schvalilo-prazskou-kandidatku-lidrem-je-husbauer/2858009',
    programStav: 'nedohledan',
    programPoznamka: 'Pražský volební program se k uvedenému datu nepodařilo dohledat.',
  },
  {
    slug: 'ceska-piratska-strana',
    nazev: 'Česká pirátská strana',
    zkratka: 'Piráti',
    lidr: 'Tereza Nislerová',
    lidrRole: 'lidr-kandidatky',
    lidrPopis: 'ekonomka',
    lidrZdroj: 'https://praha.pirati.cz/aktuality/v-boji-o-prahu-povede-piraty-do-komunalnich-voleb-ekonomka-tereza-nislerova-dvojkou-navrhla-adama-zabranskeho/',
    web: 'https://praha.pirati.cz',
    programStav: 'jen-casti',
    programUrl: 'https://praha.pirati.cz/aktuality/pirati-predstavili-akcni-plan-bydleni-v-praze/',
    programPoznamka:
      'Krajské fórum schválilo program 10. srpna 2026, ke zveřejnění ho ale zatím nedalo. Veřejně jsou dostupné jen dílčí části, především Akční plán bydlení z 21. května 2026.',
  },
  {
    slug: 'starostove-a-nezavisli',
    nazev: 'STAROSTOVÉ A NEZÁVISLÍ',
    zkratka: 'STAN',
    lidr: 'Petr Hlaváček',
    lidrRole: 'lidr-kandidatky',
    lidrPopis: 'náměstek primátora pro územní a strategický rozvoj',
    lidrZdroj: 'https://www.starostove.cz/zastupitelstvo-hl-mesta-prahy',
    web: 'https://www.starostove.cz/zastupitelstvo-hl-mesta-prahy',
    programStav: 'jen-casti',
    programUrl: 'https://www.starostove.cz/zastupitelstvo-hl-mesta-prahy',
    programPoznamka:
      'Pražská programová sekce je postavená téměř výhradně na Metropolitním plánu, nejde o klasický tematický volební program.',
  },
  {
    slug: 'praha-sobe',
    nazev: 'PRAHA SOBĚ',
    zkratka: 'Praha sobě',
    lidr: 'Adam Scheinherr',
    lidrRole: 'lidr-kandidatky',
    lidrPopis: 'bývalý náměstek primátora',
    lidrZdroj: 'https://www.ceskenoviny.cz/zpravy/praha-sobe-zeleni-a-lidovci-se-v-kampani-pred-volbami-zameri-na-dopravu/2833274',
    slozeni: 'Praha sobě kandiduje společně se Zelenými a KDU-ČSL, registrovaný název volební strany je ale prostě PRAHA SOBĚ.',
    web: 'https://prahasobe.cz',
    programStav: 'nedohledan',
    programPoznamka:
      'Z hlavní navigace prahasobe.cz vede odkaz Naše vize na stránku Velký plán pro Prahu, kde je ke stažení jen dokument z roku 2022. Program pro rok 2026 dohledán nebyl.',
  },
  {
    slug: 'jsme-praha',
    nazev: 'JSME PRAHA',
    zkratka: 'JSME PRAHA',
    lidr: 'Jana Komrsková',
    lidrRole: 'lidr-kandidatky',
    lidrPopis: 'náměstkyně primátora',
    lidrZdroj: 'https://www.jsme.team/tiskova-zprava-hnuti-jsme-team-predstavilo-nezavislou-kandidatku-do-prazskych-komunalnich-voleb-lidryni-bude-namestkyne-primatora-jana-komrskova-kandidatem-do-senatu-producent-jan-stern/',
    slozeni: 'S hnutím Volt Česko uzavřelo memorandum o programové spolupráci; nejde o společnou kandidátku.',
    web: 'https://www.jsme.team/nase-teamy/praha/',
    programStav: 'avizovan',
    programPoznamka: 'Web slibuje detailní program na začátek září 2026. Zatím je zveřejněná jen vize a analýza bez číselných závazků.',
  },
  {
    slug: 'sen-pro-prahu',
    nazev: 'SEN PRO PRAHU s Václavem Láskou, s podporou HPP 11 a strany Mourek',
    zkratka: 'SEN pro Prahu',
    lidr: 'Václav Láska',
    lidrRole: 'lidr-kandidatky',
    lidrPopis: 'senátor za obvod č. 21',
    lidrZdroj: 'https://praha.senprocesko.cz/',
    web: 'https://praha.senprocesko.cz/',
    programStav: 'zverejnen',
    programUrl: 'https://praha.senprocesko.cz/program',
    programPoznamka: 'Program je členěný do 13 tematických oblastí s vlastními podstránkami.',
  },
  {
    slug: 'spd-pro-prahu',
    nazev: 'SPD pro Prahu s podporou Trikolory, PRO, Přísahy a nezávislých kandidátů',
    zkratka: 'SPD pro Prahu',
    lidr: 'Milan Urban',
    lidrRole: 'kandidat-na-primatora',
    lidrPopis: 'předseda klubu SPD v Zastupitelstvu hl. m. Prahy',
    lidrZdroj: 'https://www.prazskypatriot.cz/volebni-lidri-v-praze-pribyvaji-za-spd-jim-bude-urban/',
    programStav: 'nedohledan',
  },
  {
    slug: 'motoriste-sobe',
    nazev: 'Motoristé sobě',
    zkratka: 'Motoristé',
    lidr: 'Klára Sovová',
    lidrRole: 'lidr-kandidatky',
    lidrPopis: 'podnikatelka',
    lidrZdroj: 'https://m.echo24.cz/a/HKJ2Y/zpravy-domov-motoriste-volby-praha-podnikatelka-ostrava-poslanec-gregor',
    web: 'https://motoristesobe.cz/komunalni-volby',
    programStav: 'nedohledan',
    programPoznamka: 'Sekce Volební program na webu hnutí neobsahuje odkaz na pražský program.',
  },
  {
    slug: 'spojena-levice-pro-prahu',
    nazev: 'Spojená levice pro Prahu (KSČM, ČSSD, KSČ)',
    zkratka: 'Spojená levice',
    lidr: 'Petr Vlček',
    lidrRole: 'kandidat-na-primatora',
    lidrZdroj: 'https://www.prazskypatriot.cz/kscm-cssd-a-ksc-jdou-do-voleb-v-hlavnim-meste-jako-spojena-levice-pro-prahu/',
    slozeni: 'Koalice KSČM, ČSSD a KSČ; kandidátka zahrnuje i nezávislé kandidáty.',
    programStav: 'zverejnen',
    programUrl: 'https://spojenalevice.cz/kompletniprogram/program_spojena_levice_doplneny-1.pdf',
    programPoznamka: 'Program má pět stran a deset kapitol.',
  },
  {
    slug: 'spolu-pro-prahu',
    nazev: 'SPOLU pro Prahu',
    zkratka: 'SPOLU',
    lidr: 'Tomáš Portlík',
    lidrRole: 'lidr-kandidatky',
    lidrPopis: 'starosta Prahy 9 a 1. místopředseda ODS',
    lidrZdroj: 'https://www.ods.cz/clanek/28320-spolu-pro-prahu-ods-a-top-09-zahajily-kampan-pred-komunalnimi-volbami',
    slozeni: 'Koalice ODS a TOP 09.',
    programStav: 'jen-priority',
    programUrl: 'https://www.ods.cz/clanek/28502-spolu-pro-prahu-predstavilo-nejsilnejsi-tym-tvoreny-prazskymi-starosty',
    programPoznamka:
      'Koalice představila 16. června 2026 programové priority, ne ucelený program: rychlejší bytová výstavba, koordinace dopravních omezení, kapacity středních škol a péče o duševní zdraví.',
  },

  // Zbylé registrované kandidátky. Lídr ani program k 25. 8. 2026 dohledán nebyl.
  { slug: 'ano-lepsi-cesko-s-mimozemstany', nazev: 'ANO LEPŠÍ ČESKO S MIMOZEMŠŤANY', zkratka: 'ANO LEPŠÍ ČESKO S MIMOZEMŠŤANY', programStav: 'nedohledan' },
  { slug: 'ceska-strana-asocialu', nazev: 'Česká strana asociálů', zkratka: 'Česká strana asociálů', programStav: 'nedohledan' },
  { slug: 'dsz-za-prava-zvirat', nazev: 'Demokratická strana zelených - ZA PRÁVA ZVÍŘAT, sdružení DSZ - ZA PRÁVA ZVÍŘAT a NK', zkratka: 'DSZ – ZA PRÁVA ZVÍŘAT', programStav: 'nedohledan' },
  { slug: 'gen-s-podporou-verejnosti', nazev: 'GEN s podporou veřejnosti', zkratka: 'GEN', programStav: 'nedohledan' },
  { slug: 'lepsi-zivot-pro-lidi', nazev: 'LEPŠÍ ŽIVOT PRO LIDI – zrušení daně z nemovitostí, min. mzda 50.000 Kč, min. důchod 30.000 Kč, návrat cen energií na ceny z roku 2019, v obchodech zboží nejvyšší kvality za ceny dostupné pro každého, STOP válce', zkratka: 'LEPŠÍ ŽIVOT PRO LIDI', programStav: 'nedohledan' },
  { slug: 'levice', nazev: 'Levice', zkratka: 'Levice', programStav: 'nedohledan' },
  { slug: 'libertarianska-strana-voluntia', nazev: 'Libertariánská strana Voluntia', zkratka: 'Voluntia', programStav: 'nedohledan' },
  { slug: 'nase-praha-snk-ed', nazev: 'Naše Praha SNK ED', zkratka: 'Naše Praha SNK ED', programStav: 'nedohledan' },
  { slug: 'patrioti-pro-prahu', nazev: 'PATRIOTI PRO PRAHU', zkratka: 'PATRIOTI PRO PRAHU', programStav: 'nedohledan' },
  { slug: 'rezidenti-rebelove', nazev: 'REZIDENTI – REBELOVÉ pro změnu Prahy', zkratka: 'REZIDENTI', programStav: 'nedohledan' },
  { slug: 'svobodni', nazev: 'Svobodní', zkratka: 'Svobodní', programStav: 'nedohledan' },
  { slug: 'urza-cz', nazev: 'Urza.cz: Nechceme vaše hlasy; ke svobodě se nelze provolit. Odmítneme každou politickou funkci; nechceme totiž lidem nařizovat, jak mají žít. Máme jinou vizi. Jdeme jinou cestou — najdete ji na webu www.urza.cz.', zkratka: 'Urza.cz', programStav: 'nedohledan' },
  { slug: 'velky-krizek-sousede-pro-prahu', nazev: 'VELKÝ KŘÍŽEK PRO LÍTAČKU ZA KAČKU – SOUSEDÉ PRO PRAHU', zkratka: 'SOUSEDÉ PRO PRAHU', programStav: 'nedohledan' },
  { slug: 'volte-pravy-blok', nazev: 'Volte Pravý Blok www.cibulka.net', zkratka: 'Volte Pravý Blok', programStav: 'nedohledan' },
]

const POPIS_STAVU: Record<ProgramStav, string> = {
  zverejnen: 'Program pro Prahu 2026 je zveřejněný.',
  'jen-casti': 'Zveřejněné jsou zatím jen části programu.',
  'jen-priority': 'Zveřejněné jsou programové priority, ne ucelený program.',
  avizovan: 'Program je ohlášený, ale zatím nezveřejněný.',
  nedohledan: `Program pro Prahu 2026 nebyl k ${OVERENO.split('-').reverse().join('. ')} dohledán.`,
}

function yaml(hodnota: string): string {
  return JSON.stringify(hodnota)
}

function soubor(s: Subjekt): string {
  const radky = [
    '---',
    `nazev: ${yaml(s.nazev)}`,
    `zkratka: ${yaml(s.zkratka)}`,
    `slug: ${s.slug}`,
    'uroven: magistrat',
  ]
  if (s.lidr) {
    radky.push(`lidr: ${yaml(s.lidr)}`)
    radky.push(`lidrRole: ${s.lidrRole}`)
    radky.push(`lidrZdroj: ${yaml(s.lidrZdroj!)}`)
    if (s.lidrPopis) radky.push(`lidrPopis: ${yaml(s.lidrPopis)}`)
  }
  radky.push(`programStav: ${s.programStav}`)
  radky.push(`programOvereno: ${OVERENO}`)
  if (s.programUrl) radky.push(`programUrl: ${yaml(s.programUrl)}`)
  if (s.web) radky.push(`web: ${yaml(s.web)}`)
  radky.push('publikovano: true')
  radky.push('---', '')

  const telo: string[] = []
  telo.push(
    `Volební strana registrovaná pro volby do Zastupitelstva hlavního města Prahy pod názvem *${s.nazev}*.`,
  )
  if (s.slozeni) telo.push(s.slozeni)
  if (s.lidr) {
    const role =
      s.lidrRole === 'kandidat-na-primatora'
        ? 'Jako kandidáta na primátora subjekt představil'
        : 'Kandidátku vede'
    telo.push(`${role} **${s.lidr}**${s.lidrPopis ? `, ${s.lidrPopis}` : ''}.`)
  } else {
    telo.push(
      'Jedničku kandidátky se nám k uvedenému datu nepodařilo z veřejných zdrojů doložit. Doplníme ji, jakmile Český statistický úřad zveřejní kandidátní listiny.',
    )
  }
  telo.push(POPIS_STAVU[s.programStav])
  if (s.programPoznamka) telo.push(s.programPoznamka)
  telo.push(
    `Seznam všech registrovaných kandidátek vychází z [rozhodnutí registračního úřadu](${REGISTR}) zveřejněného Magistrátem hlavního města Prahy.`,
  )

  return radky.join('\n') + telo.join('\n\n') + '\n'
}

mkdirSync(CIL, { recursive: true })
let vytvoreno = 0
let preskoceno = 0
for (const s of SUBJEKTY) {
  const cesta = join(CIL, `${s.slug}.mdx`)
  if (existsSync(cesta)) {
    preskoceno++
    continue
  }
  writeFileSync(cesta, soubor(s))
  vytvoreno++
}
console.log(
  `Profily subjektů: ${vytvoreno} vytvořeno, ${preskoceno} ponecháno. Celkem v seznamu ${SUBJEKTY.length}.`,
)
