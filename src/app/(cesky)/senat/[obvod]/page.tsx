import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Drobecky } from '@/components/Drobecky'
import { KandidatiSenatu } from '@/components/KandidatiSenatu'
import { VysledkySenatu } from '@/components/VysledkySenatu'
import { vysledekDruhehoKola, vysledkyObvodu } from '@/lib/senatVysledky'
import { MDXContent } from '@/components/mdx'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { OBVODY } from '@/lib/senat'
import { celeJmenoSenat, kandidatiObvodu, nazevStranySenat, sadaSenat } from '@/lib/senatKandidati'

type Parametry = { params: Promise<{ obvod: string }> }

export function generateStaticParams() {
  return OBVODY.map((o) => ({ obvod: o.slug }))
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { obvod: slug } = await params
  const obvod = OBVODY.find((o) => o.slug === slug)
  if (!obvod) return {}
  return {
    title: `Senátní obvod č. ${obvod.cislo} ${obvod.nazev}: výsledky 2026`,
    description: `Senátní volby 2026 v obvodu č. ${obvod.cislo} (${obvod.nazev}): kdo vyhrál druhé kolo 16.–17. října, výsledky obou kol a které městské části do obvodu patří.`,
  }
}

export default async function StrankaObvodu({ params }: Parametry) {
  const { obvod: slug } = await params
  const obvod = OBVODY.find((o) => o.slug === slug)
  if (!obvod) notFound()

  const nazevMC = (s: string) => MESTSKE_CASTI.find((mc) => mc.slug === s)?.nazev ?? s
  const kandidati = kandidatiObvodu(obvod.cislo)
  const vysledky = vysledkyObvodu(obvod.cislo)
  const druheKolo = vysledekDruhehoKola(obvod.cislo)

  return (
    <div className="space-y-10">
      <header>
        <Drobecky
          cesta={[
            { popisek: 'Úvod', href: '/' },
            { popisek: 'Senát', href: '/senat' },
            { popisek: `Obvod č. ${obvod.cislo}` },
          ]}
        />
        <h1 className="mt-3 text-4xl">
          Obvod č. {obvod.cislo} — {obvod.nazev}
        </h1>
      </header>

      <dl className="grid grid-cols-1 gap-px border border-inkoust bg-linka-silna sm:grid-cols-3">
        <div className="bg-papir p-3">
          <dt className="popisek-uredni">Dosavadní mandát</dt>
          <dd className="mt-1 font-mono">
            <a href={obvod.senatorZdroj} className="odkaz-akcent inline-block py-1" rel="noopener">
              {obvod.senator}
            </a>
          </dd>
        </div>
        <div className="bg-papir p-3">
          <dt className="popisek-uredni">Kandidátů v 1. kole</dt>
          <dd className="mt-1 font-mono text-lg">
            {kandidati.length > 0 ? kandidati.length : '—'}
          </dd>
        </div>
        <div className="bg-papir p-3">
          <dt className="popisek-uredni">Volilo se</dt>
          <dd className="mt-1 font-mono">1. kolo 9.–10. 10. · 2. kolo 16.–17. 10. 2026</dd>
        </div>
      </dl>

      {druheKolo && (
        <section aria-labelledby="druhe-kolo" className="border-l-2 border-praha pl-5">
          <p className="popisek-uredni">Druhé kolo 16.–17. října 2026</p>
          <h2 id="druhe-kolo" className="mt-1 text-2xl">
            Zvolen {druheKolo.zvoleny.celeJmeno}
          </h2>
          <p className="mt-2 max-w-prose">
            {nazevStranySenat(druheKolo.zvoleny.kandidat?.volebniStrana ?? druheKolo.zvoleny.navrhujici)}
          </p>
          <div className="mt-4">
            <VysledkySenatu cisloObvodu={obvod.cislo} kolo={druheKolo.kolo} />
          </div>
        </section>
      )}

      {vysledky && (
        <section aria-labelledby="prvni-kolo">
          <h2 id="prvni-kolo" className="text-2xl">
            Výsledky prvního kola 9.–10. října
          </h2>
          <div className="mt-3">
            <VysledkySenatu cisloObvodu={obvod.cislo} kolo={vysledky.kolo1} />
          </div>
          <p className="popisek-uredni mt-3">
            Zdroj: Český statistický úřad, data prezentační aplikace volbyhned.cz
          </p>
        </section>
      )}

      <div className="proza max-w-prose">
        <MDXContent code={obvod.content} />
      </div>

      {kandidati.length > 0 && (
        <section>
          <h2 className="text-2xl">Kandidáti prvního kola</h2>
          <p className="mt-1 max-w-prose text-sm text-seda-uredni">
            Takhle byli kandidáti na hlasovacím lístku v prvním kole, s vylosovanými čísly.
          </p>
          <KandidatiSenatu
            kandidati={kandidati.map((k) => ({
              slug: `${k.slug}-${k.cislo}`,
              cislo: k.cislo,
              jmeno: k.jmeno,
              prijmeni: k.prijmeni,
              celeJmeno: celeJmenoSenat(k),
              vek: k.vek,
              volebniStrana: nazevStranySenat(k.volebniStrana),
              povolani: k.povolani,
            }))}
          />
          <p className="popisek-uredni mt-3">
            Zdroj: otevřená data ČSÚ, sada {sadaSenat()}
          </p>
        </section>
      )}

      <section>
        <h2 className="text-2xl">Které městské části sem patří</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {obvod.mestskeCasti.map((s) => (
            <li key={s}>
              <Link
                href={`/mestska-cast/${s}`}
                className="block border border-inkoust px-3 py-1 font-mono text-sm no-underline hover:bg-papir-tmavsi"
              >
                {nazevMC(s)}
              </Link>
            </li>
          ))}
        </ul>

        {obvod.mestskeCastiCastecne.length > 0 && (
          <div className="mt-6 max-w-prose border-l-2 border-okr pl-4">
            <h3 className="popisek-uredni">Jen částí území</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {obvod.mestskeCastiCastecne.map((c) => (
                <li key={c.slug}>
                  <Link href={`/mestska-cast/${c.slug}`} className="odkaz-akcent">
                    {nazevMC(c.slug)}
                  </Link>{' '}
                  — {c.popis}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <footer className="border-t border-linka pt-6">
        <p className="popisek-uredni">Zdroje</p>
        <ul className="mt-2 text-sm">
          {obvod.zdroje.map((z) => (
            <li key={z.url}>
              <a href={z.url} className="odkaz-akcent inline-block py-1" rel="noopener">
                {z.text}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  )
}
