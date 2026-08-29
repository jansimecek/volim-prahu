import type { Metadata, Route } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Mono, Source_Serif_4 } from 'next/font/google'
import Link from 'next/link'
import { Analytics } from '@vercel/analytics/next'
import { HlavniNavigace } from '@/components/HlavniNavigace'
import { PruhRezimu } from '@/components/PruhRezimu'
import '../styles/globals.css'

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
  metadataBase: new URL('https://volimprahu.cz'),
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    siteName: 'Volím Prahu',
  },
}

/**
 * Navigace drží jen to, co hledá volič. Referenční podklady — kompetenční
 * matice, rozpočtový rámec a plnění minulého prohlášení — jsou odkazované
 * z metodiky, z každého hodnocení a z patičky, protože se čtou k něčemu,
 * ne samy o sobě.
 */
const NAVIGACE: readonly { href: Route; popisek: string }[] = [
  { href: '/praha', popisek: 'Magistrát' },
  { href: '/mestska-cast', popisek: 'Městské části' },
  { href: '/senat', popisek: 'Senát' },
  { href: '/temata', popisek: 'Témata' },
  { href: '/aktualne', popisek: 'Aktuálně' },
  { href: '/kde-volim', popisek: 'Kde volím' },
  { href: '/jak-hodnotime', popisek: 'Metodika' },
  { href: '/hledani', popisek: 'Hledat' },
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

        <header className="border-b border-inkoust">
          <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="font-display text-lg font-semibold no-underline">
              Volím&nbsp;Prahu
            </Link>
            <HlavniNavigace polozky={NAVIGACE} />
          </div>
        </header>

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
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
              <li>
                <Link href="/o-projektu" className="odkaz-navigace">
                  O projektu
                </Link>
              </li>
              <li>
                <Link href="/jak-hodnotime" className="odkaz-navigace">
                  Metodika
                </Link>
              </li>
              <li>
                <Link href="/minule-obdobi" className="odkaz-navigace">
                  Co slíbila současná rada
                </Link>
              </li>
              <li>
                <Link href="/kdo-o-cem-rozhoduje" className="odkaz-navigace">
                  Kdo o čem rozhoduje
                </Link>
              </li>
              <li>
                <Link href="/rozpoctovy-ramec" className="odkaz-navigace">
                  Kolik má Praha peněz
                </Link>
              </li>
              <li>
                <Link href="/hlasovani" className="odkaz-navigace">
                  Anketa
                </Link>
              </li>
              <li>
                <Link href="/ochrana-udaju" className="odkaz-navigace">
                  Ochrana údajů
                </Link>
              </li>
            </ul>
            <p className="popisek-uredni mt-6">
              Zdroj dat o kandidátech a výsledcích:{' '}
              <a href="https://volby.gov.cz/opendata/opendata.htm" className="underline">
                otevřená data ČSÚ
              </a>
            </p>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
