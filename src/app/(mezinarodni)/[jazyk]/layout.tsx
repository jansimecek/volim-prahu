import type { Metadata, Route } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Mono, Source_Serif_4 } from 'next/font/google'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HlavniNavigace } from '@/components/HlavniNavigace'
import { Mereni } from '@/components/Mereni'
import { PrepinacJazyka } from '@/components/PrepinacJazyka'
import { StrukturovanaData } from '@/components/StrukturovanaData'
import { JAZYKY, jazykoveVarianty, jeJazyk, PODSTRANKY } from '@/lib/jazyky'
import { preklad } from '@/preklady'
import { KONTAKT_EMAIL, ZAKLAD_WEBU, absolutni } from '@/lib/web'
import '../../../styles/globals.css'

/**
 * Cizojazyčná verze má vlastní kořenový layout, protože musí mít vlastní
 * `<html lang>`. Anglická stránka pod `lang="cs"` není kosmetická vada:
 * odečítač obrazovky by ji přečetl českou výslovností a WCAG 2.2 to pod
 * kritériem 3.1.1 bere jako chybu. Next umí víc kořenových layoutů jen
 * tehdy, když žádný nestojí nad nimi — proto je česká verze ve skupině
 * `(cesky)` a tahle v `(mezinarodni)`.
 *
 * Cyrilici nese Source Serif a Plex Mono; Bricolage ji nemá, takže se
 * ukrajinské nadpisy sázejí čtecím písmem (viz `[lang='uk']` níže).
 */
const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-bricolage',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-source-serif',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const revalidate = 900

export function generateStaticParams() {
  return JAZYKY.map((jazyk) => ({ jazyk }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jazyk: string }>
}): Promise<Metadata> {
  const { jazyk } = await params
  if (!jeJazyk(jazyk)) return {}
  const t = preklad(jazyk)

  return {
    title: {
      default: `${t.meta.podtitul} — ${t.meta.nazevWebu}`,
      template: `%s — ${t.meta.nazevWebu}`,
    },
    description: t.meta.popisSekce,
    metadataBase: new URL(ZAKLAD_WEBU),
    alternates: {
      canonical: './',
      languages: jazykoveVarianty(`/${jazyk}`),
    },
    openGraph: {
      type: 'website',
      locale: jazyk === 'uk' ? 'uk_UA' : 'en_GB',
      siteName: t.meta.nazevWebu,
    },
    robots: { index: true, follow: true },
  }
}

export default async function MezinarodniLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ jazyk: string }>
}) {
  const { jazyk } = await params
  if (!jeJazyk(jazyk)) notFound()
  const t = preklad(jazyk)

  // `Route` s výchozím parametrem přijímá jen statické cesty; cesty pod
  // dynamickým segmentem `[jazyk]` se typují až v místě, kde je `Link`
  // odvodí z literálu. Tady se skládají v poli, takže přetypování je
  // nutné — `jazyk` je v tu chvíli ověřený `jeJazyk()` a slugy jsou
  // literály z `PODSTRANKY`, takže se nedá složit adresa, která neexistuje.
  const navigace: { href: Route; popisek: string }[] = [
    { href: `/${jazyk}` as Route, popisek: t.chrome.navigace.index },
    ...PODSTRANKY.map((s) => ({
      href: `/${jazyk}/${s}` as Route,
      popisek: t.chrome.navigace[s],
    })),
  ]

  return (
    <html
      lang={t.htmlLang}
      dir={t.smerCteni}
      className={`${bricolage.variable} ${sourceSerif.variable} ${plexMono.variable}`}
    >
      <body className="min-h-dvh flex flex-col">
        <a
          href="#obsah"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:bg-inkoust focus:px-4 focus:py-2 focus:text-papir"
        >
          {t.chrome.preskocit}
        </a>

        <header className="border-b border-inkoust">
          <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-6 gap-y-2 px-4 py-3">
            <Link href={`/${jazyk}`} className="font-display text-lg font-semibold no-underline">
              Volím&nbsp;Prahu
            </Link>
            <HlavniNavigace polozky={navigace} popisek={t.chrome.hlavniNavigace} />
            <div className="ms-auto">
              <PrepinacJazyka aktualni={jazyk} />
            </div>
          </div>
        </header>

        {/* Rozsah překladu patří nad obsah, ne do patičky: čtenář musí vědět,
            že za odkazem do zbytku webu bude čeština, dřív než tam klikne. */}
        <div className="border-b border-linka">
          <div className="mx-auto max-w-5xl px-4 py-2 text-sm">
            <p className="max-w-prose">
              {t.chrome.rozsahPrekladu}{' '}
              <Link href="/" className="odkaz-akcent" hrefLang="cs">
                {t.chrome.zpetDoCestiny}
              </Link>
            </p>
          </div>
        </div>

        <main id="obsah" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          {children}
        </main>

        <footer className="mt-16 border-t border-inkoust">
          <div className="mx-auto max-w-5xl px-4 py-8 text-sm">
            <p className="max-w-prose">{t.chrome.patickaPopis}</p>
            <nav aria-label={t.chrome.patickaNavigace} className="mt-6">
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {navigace.map((o) => (
                  <li key={o.href}>
                    <Link href={o.href} className="odkaz-akcent text-base">
                      {o.popisek}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="popisek-uredni mt-6">
              {t.chrome.kontakt}{' '}
              <a href={`mailto:${KONTAKT_EMAIL}`} className="underline">
                {KONTAKT_EMAIL}
              </a>
            </p>
          </div>
        </footer>

        <StrukturovanaData
          data={{
            '@type': 'WebSite',
            name: t.meta.nazevWebu,
            url: absolutni(`/${jazyk}`),
            inLanguage: t.htmlLang,
            description: t.meta.popisSekce,
            publisher: {
              '@type': 'Organization',
              name: 'Volím Prahu',
              url: ZAKLAD_WEBU,
              email: KONTAKT_EMAIL,
            },
          }}
        />
        <Mereni />
      </body>
    </html>
  )
}
