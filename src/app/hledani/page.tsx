import type { Metadata } from 'next'
import { Hledani } from '@/components/Hledani'
import { kandidatka, vsechnyKandidatky } from '@/lib/kandidatky'

export const metadata: Metadata = {
  title: 'Hledat',
  description:
    'Vyhledávání v kandidátech, volebních stranách a městských částech pražských voleb 2026.',
}

export default function StrankaHledani() {
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
          osob, 24 volebních stran na magistrát a všech 57 městských částí. Rejstřík se
          stáhne až při prvním hledání.
        </p>
      </header>

      <Hledani />

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
