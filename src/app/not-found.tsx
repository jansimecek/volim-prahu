import { Bricolage_Grotesque, IBM_Plex_Mono, Source_Serif_4 } from 'next/font/google'
import Link from 'next/link'
import { ObsahNenalezeno } from '@/components/ObsahNenalezeno'
import '../styles/globals.css'

/**
 * 404 pro adresu, která neodpovídá žádné cestě.
 *
 * Musí si přinést vlastní `<html>` a `<body>`: web má dva kořenové layouty
 * (`(cesky)` a `(mezinarodni)`) a Next nemá jak rozhodnout, do kterého
 * z nich neexistující adresu zarámovat — bez tohohle souboru by spadl na
 * vlastní obrazovku, která nemá atribut `lang` vůbec, což je porušení
 * WCAG 3.1.1 a padá na tom test přístupnosti.
 *
 * Jazyk je čeština: adresa, která nepatří nikam, patří do hlavní verze
 * webu. Kdo se sem dostal z cizojazyčné sekce, má v odkazech cestu zpět.
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

export default function Nenalezeno() {
  return (
    <html lang="cs" className={`${bricolage.variable} ${sourceSerif.variable} ${plexMono.variable}`}>
      {/*
        Titulek a robots se nedají dát do `export const metadata`: Next
        skládá metadata jen uvnitř layoutu a tahle stránka žádný nemá.
        React 19 ale značky z těla vytáhne do <head> sám, takže stačí je
        napsat sem — bez titulku je to porušení WCAG 2.4.2.
      */}
      <title>Stránka nenalezena — Volím Prahu</title>
      <meta name="robots" content="noindex, follow" />
      <body className="min-h-dvh flex flex-col">
        <header className="border-b border-inkoust">
          <div className="mx-auto flex max-w-5xl items-baseline gap-x-6 px-4 py-3">
            <Link href="/" className="font-display text-lg font-semibold no-underline">
              Volím&nbsp;Prahu
            </Link>
          </div>
        </header>
        <main id="obsah" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          <ObsahNenalezeno />
        </main>
      </body>
    </html>
  )
}
