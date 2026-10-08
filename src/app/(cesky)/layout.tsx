import type { Metadata, Route } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Mono, Source_Serif_4 } from 'next/font/google'
import Link from 'next/link'
import { HlavniNavigace } from '@/components/HlavniNavigace'
import { HledaniVHlavicce } from '@/components/HledaniVHlavicce'
import { PrepinacJazyka } from '@/components/PrepinacJazyka'
import { Mereni } from '@/components/Mereni'
import { StrukturovanaData } from '@/components/StrukturovanaData'
import { JAZYKY, POPIS_JAZYKA } from '@/lib/jazyky'
import { KONTAKT_EMAIL, ZAKLAD_WEBU } from '@/lib/web'
import { PruhRezimu } from '@/components/PruhRezimu'
import '../../styles/globals.css'

/**
 * Fonty se hostují lokálně přes next/font. `latin-ext` je povinná subsada —
 * bez ní se rozbije ř, ď, ť, ů, tedy polovina českých názvů na webu.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-bricolage',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-source-serif',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Volím Prahu — volební průvodce 2026',
    template: '%s — Volím Prahu',
  },
  description:
    'Kdo kandiduje do vašeho zastupitelstva, co slibuje a co z toho daná úroveň pražské samosprávy vůbec může splnit. Komunální a senátní volby 9.–10. října 2026.',
  metadataBase: new URL(ZAKLAD_WEBU),
  // Kanonická adresa každé stránky = její vlastní cesta na www doméně.
  alternates: {
    canonical: './',
    types: { 'application/rss+xml': '/aktualne/feed.xml' },
    // Jazykové varianty rozcestníku. Jednotlivé stránky si `languages`
    // přepisují samy tam, kde cizojazyčný protějšek existuje.
    languages: { 'x-default': '/', cs: '/', en: '/en', uk: '/uk' },
  },
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    siteName: 'Volím Prahu',
  },
  robots: { index: true, follow: true },
}

/**
 * Navigace drží jen to, co hledá volič. Referenční podklady — kompetenční
 * matice, rozpočtový rámec a plnění minulého prohlášení — jsou odkazované
 * z metodiky, z každého hodnocení a z patičky, protože se čtou k něčemu,
 * ne samy o sobě.
 */
/**
 * Patička je druhá navigace, ne seznam drobných odkazů: referenční podklady
 * (kompetence, rozpočet, plnění slibů) tu mají jediné stálé místo, tak musí
 * být čitelné a seskupené podle toho, na co odpovídají.
 */
const PATICKA: readonly { nadpis: string; odkazy: readonly { href: Route; popisek: string }[] }[] = [
  {
    nadpis: 'Průvodce',
    odkazy: [
      { href: '/praha', popisek: 'Magistrát a kandidátky' },
      { href: '/koalice', popisek: 'Kdo s kým po volbách' },
      { href: '/debaty', popisek: 'Debaty kandidátů' },
      { href: '/mestska-cast', popisek: 'Městské části' },
      { href: '/senat', popisek: 'Senát' },
      { href: '/kde-volim', popisek: 'Kde a jak volím' },
      { href: '/hlasovani', popisek: 'Anketa čtenářů' },
    ],
  },
  {
    nadpis: 'Podklady k hodnocení',
    odkazy: [
      { href: '/minule-obdobi', popisek: 'Plnění slibů současné rady' },
      { href: '/kdo-o-cem-rozhoduje', popisek: 'Kdo o čem rozhoduje' },
      { href: '/rozpoctovy-ramec', popisek: 'Kolik má Praha peněz' },
      { href: '/temata', popisek: 'Postoje k zásadním tématům' },
      { href: '/rozhovory', popisek: 'Rozhovory s kandidáty' },
    ],
  },
  {
    nadpis: 'O webu',
    odkazy: [
      { href: '/jak-hodnotime', popisek: 'Jak hodnotíme' },
      { href: '/o-projektu', popisek: 'O projektu a jak nahlásit chybu' },
      { href: '/ochrana-udaju', popisek: 'Ochrana údajů' },
      { href: '/aktualne', popisek: 'Aktuálně' },
    ],
  },
]

const NAVIGACE: readonly { href: Route; popisek: string }[] = [
  { href: '/praha', popisek: 'Magistrát' },
  { href: '/mestska-cast', popisek: 'Městské části' },
  { href: '/senat', popisek: 'Senát' },
  { href: '/temata', popisek: 'Témata' },
  { href: '/minule-obdobi', popisek: 'Plnění slibů' },
  { href: '/aktualne', popisek: 'Aktuálně' },
  { href: '/kde-volim', popisek: 'Kde volím' },
  { href: '/hlasovani', popisek: 'Anketa' },
  { href: '/jak-hodnotime', popisek: 'Metodika' },
]

/**
 * Do rozbaleného menu na telefonu navíc to, co je na desktopu jen
 * v patičce. Na telefonu je patička čtyři obrazovky pod koncem obsahu.
 */
const NAVIGACE_DALSI: readonly { href: Route; popisek: string }[] = [
  { href: '/koalice', popisek: 'Kdo s kým' },
  { href: '/debaty', popisek: 'Debaty' },
  { href: '/rozhovory', popisek: 'Rozhovory' },
  { href: '/kdo-o-cem-rozhoduje', popisek: 'Kdo rozhoduje' },
  { href: '/rozpoctovy-ramec', popisek: 'Rozpočet' },
  { href: '/o-projektu', popisek: 'O projektu' },
]

/**
 * Fáze voleb i moratorium na průzkumy se odvozují od času. Kdyby se stránky
 * zabetonovaly do buildu, přepnul by se web do archivního režimu až při
 * příštím nasazení — tedy nejspíš nikdy. Patnáct minut je dost jemné na
 * volební víkend a dost hrubé, aby to nic nestálo.
 */
export const revalidate = 900

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${bricolage.variable} ${sourceSerif.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <a
          href="#obsah"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:bg-inkoust focus:px-4 focus:py-2 focus:text-papir"
        >
          Přeskočit na obsah
        </a>

        {/* Na telefonu je přilepená jen horní lišta s logem, hledáním a menu —
            tedy to, co je potřeba i z půlky dlouhé stránky. Přepínač jazyků je
            pod ní a odjede s obsahem. Od `sm` výš je hlavička zase obyčejná. */}
        <header className="sticky top-0 z-40 border-b border-inkoust bg-papir sm:static">
          <div className="mx-auto flex max-w-5xl items-center gap-x-4 px-4 py-1 sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-2 sm:py-3">
            <Link href="/" className="me-auto font-display text-lg font-semibold no-underline sm:me-0">
              Volím&nbsp;Prahu
            </Link>
            <HledaniVHlavicce />
            <HlavniNavigace polozky={NAVIGACE} dalsi={NAVIGACE_DALSI} />
            {/* Přepínač jazyků je v hlavičce, ne v patičce: cizinec, který
                česky nečte, se na konec stránky neproscrolluje — vzdá to
                dřív. Názvy jazyků jsou v nich samých, ne přeložené. */}
            <div className="hidden sm:ms-auto sm:block">
              <PrepinacJazyka />
            </div>
          </div>
        </header>
        <div className="border-b border-linka sm:hidden">
          <div className="px-4">
            <PrepinacJazyka skrytAktualni />
          </div>
        </div>

        <PruhRezimu />

        <main id="obsah" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          {children}
        </main>

        <footer className="mt-16 border-t border-inkoust">
          <div className="mx-auto max-w-5xl px-4 py-8 text-sm">
            <p className="max-w-prose">
              Nezávislý volební průvodce pro komunální a senátní volby v Praze,
              9.–10. října 2026. Web nikoho nedoporučuje ani neodrazuje od volby —
              popisuje, co která úroveň samosprávy může splnit.
            </p>
            <nav aria-label="Patička" className="mt-6 grid gap-8 sm:grid-cols-3">
              {PATICKA.map((skupina) => (
                <div key={skupina.nadpis}>
                  <p className="popisek-uredni">{skupina.nadpis}</p>
                  <ul className="mt-2 space-y-1.5">
                    {skupina.odkazy.map((o) => (
                      <li key={o.href}>
                        <Link href={o.href} className="odkaz-akcent text-base">
                          {o.popisek}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            {/* Cizojazyčné verze i v patičce, a se zdůvodněním: český čtenář
                je nejčastější cesta, jak se odkaz dostane k sousedovi nebo
                kolegovi, který o svém volebním právu neví. */}
            <div className="mt-8 border-t border-linka pt-6">
              <p className="popisek-uredni">Pro voliče, kteří nečtou česky</p>
              <p className="mt-2 max-w-prose">
                Občané jiných států EU s pobytem v Praze mají v komunálních volbách
                stejné volební právo jako Češi a většina z nich o tom neví. Kdo smí
                volit, kde a jak, je vysvětlené i{' '}
                {JAZYKY.map((j, i) => (
                  <span key={j}>
                    {i > 0 && ' a '}
                    <Link href={`/${j}`} className="odkaz-akcent" hrefLang={j} lang={j}>
                      {POPIS_JAZYKA[j].vlastni}
                    </Link>
                  </span>
                ))}
                .
              </p>
            </div>
            <p className="popisek-uredni mt-6">
              Zdroj dat o kandidátech a výsledcích:{' '}
              <a href="https://volby.gov.cz/opendata/opendata.htm" className="underline">
                otevřená data ČSÚ
              </a>
            </p>
          </div>
        </footer>
        <StrukturovanaData
          data={{
            '@type': 'WebSite',
            name: 'Volím Prahu',
            url: ZAKLAD_WEBU,
            inLanguage: 'cs',
            description:
              'Nezávislý volební průvodce pro komunální a senátní volby v Praze 9.–10. října 2026.',
            publisher: {
              '@type': 'Organization',
              name: 'Volím Prahu',
              url: ZAKLAD_WEBU,
              email: KONTAKT_EMAIL,
            },
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${ZAKLAD_WEBU}/hledani?q={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
          }}
        />
        <Mereni />
      </body>
    </html>
  )
}
