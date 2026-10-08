import type { Metadata } from 'next'
import { Hledani } from '@/components/Hledani'
import { kandidatka, vsechnyKandidatky } from '@/lib/kandidatky'

export const metadata: Metadata = {
  title: 'Hledat',
  description:
    'Vyhledávání v kandidátech, volebních stranách, městských částech a tématech pražských voleb 2026.',
  // Stránka bez vlastního obsahu — vyhledávače mají indexovat cíle, ne formulář.
  robots: { index: false, follow: true },
}

export default async function StrankaHledani({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const { q } = await searchParams
  const dotaz = (Array.isArray(q) ? q[0] : q)?.slice(0, 100) ?? ''

  const osoby = new Set<string>()
  for (const slug of vsechnyKandidatky()) {
    for (const strana of kandidatka(slug)?.strany ?? []) {
      for (const k of strana.kandidati) osoby.add(k.slug)
    }
  }

  return (
    <div className="space-y-8">
      <header className="max-w-prose">
        <h1 className="text-4xl">Hledat</h1>
        <p className="mt-3">
          V rejstříku je {new Intl.NumberFormat('cs-CZ').format(osoby.size)} kandidujících
          osob, 24 volebních stran na magistrát, všech 57 městských částí, senátní obvody,
          témata a články. Rejstřík se stáhne až při prvním hledání. Odkudkoli na webu
          se hledání otevře také klávesou <kbd className="font-mono">/</kbd>.
        </p>
      </header>

      <Hledani vychoziDotaz={dotaz} />

      <p className="popisek-uredni">
        Údaje o kandidátech jsou z{' '}
        <a href="https://volby.gov.cz/opendata/kv2026/kv2026_opendata.htm" className="underline">
          otevřených dat ČSÚ
        </a>
        , sada kv2026.
      </p>
    </div>
  )
}
