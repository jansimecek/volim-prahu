import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { VyrokyOsoby } from '@/components/VyrokyOsoby'
import { celeJmeno, kandidaturyOsoby } from '@/lib/kandidatky'

type Parametry = { params: Promise<{ slug: string }> }

/**
 * Profilů kandidátů jsou tisíce, takže se generují na vyžádání (ISR) a build
 * zůstává v minutách. Předgenerujeme prázdný seznam a necháme dynamické segmenty.
 */
export const dynamicParams = true
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { slug } = await params
  const kandidatury = kandidaturyOsoby(slug)
  const prvni = kandidatury[0]
  if (!prvni) return {}
  return {
    title: celeJmeno(prvni.kandidat),
    description: `${celeJmeno(prvni.kandidat)} — kandidatura v pražských komunálních volbách 2026 podle otevřených dat ČSÚ.`,
  }
}

export default async function StrankaKandidata({ params }: Parametry) {
  const { slug } = await params
  const kandidatury = kandidaturyOsoby(slug)
  if (kandidatury.length === 0) notFound()

  const osoba = kandidatury[0]!.kandidat

  return (
    <div className="space-y-10">
      <header>
        <p className="popisek-uredni">Kandidát</p>
        <h1 className="mt-2 text-4xl">{celeJmeno(osoba)}</h1>
      </header>

      <dl className="grid grid-cols-2 gap-px border border-inkoust bg-linka sm:grid-cols-4">
        <Udaj popisek="Věk" hodnota={String(osoba.vek)} />
        <Udaj popisek="Povolání" hodnota={osoba.povolani || '—'} />
        <Udaj popisek="Bydliště" hodnota={osoba.bydliste || '—'} />
        <Udaj popisek="Kandidatur" hodnota={String(kandidatury.length)} />
      </dl>

      <section>
        <h2 className="text-2xl">
          {kandidatury.length === 1 ? 'Kandidatura' : 'Kandidatury'}
        </h2>
        <ul className="mt-4 space-y-4">
          {kandidatury.map(({ kandidat, strana, zastupitelstvo }) => (
            <li key={kandidat.id} className="border-l-2 border-linka pl-4">
              <p className="font-display font-semibold">
                {zastupitelstvo.slug === 'magistrat' ? (
                  <Link href="/praha" className="no-underline">
                    Zastupitelstvo hl. m. Prahy
                  </Link>
                ) : (
                  <Link href={`/mestska-cast/${zastupitelstvo.slug}`} className="no-underline">
                    {zastupitelstvo.nazev}
                  </Link>
                )}
              </p>
              <p className="mt-1 text-sm">
                {strana.nazev} — {kandidat.poradi}. místo na kandidátce
              </p>
              <p className="popisek-uredni mt-1">
                navrhující strana {kandidat.navrhujiciStrana || 'neuvedeno'} · politická
                příslušnost {kandidat.politickaPrislusnost || 'neuvedeno'}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <VyrokyOsoby osobaSlug={slug} />

      {/*
        Automatické párování podle jména se nikdy nezobrazuje jako fakt. Bez ručně
        ověřené shody nabízíme jen odkaz na vyhledávání, ne převzatá data.
      */}
      <section className="max-w-prose border-t border-linka pt-6">
        <h2 className="text-2xl">Veřejné rejstříky</h2>
        <p className="mt-3">
          Otevřená data ČSÚ neobsahují datum narození, takže tuhle osobu nelze spolehlivě
          strojově ztotožnit se záznamy ve veřejných rejstřících. Žádné údaje odjinud proto
          nepřebíráme — můžete si je ale sami vyhledat.
        </p>
        <p className="mt-3">
          <a
            href={`https://www.hlidacstatu.cz/hledat?q=${encodeURIComponent(`${osoba.jmeno} ${osoba.prijmeni}`)}`}
            className="odkaz-akcent"
            rel="noopener nofollow"
          >
            Vyhledat v Hlídači státu
          </a>
        </p>
      </section>

      <p className="popisek-uredni">
        Údaje pocházejí z{' '}
        <a href="https://volby.gov.cz/opendata/kv2026/kv2026_opendata.htm" className="underline">
          otevřených dat ČSÚ
        </a>
        , sada kv2026. Neupravujeme je.
      </p>
    </div>
  )
}

function Udaj({ popisek, hodnota }: { popisek: string; hodnota: string }) {
  return (
    <div className="bg-papir p-3">
      <dt className="popisek-uredni">{popisek}</dt>
      <dd className="mt-1 text-sm">{hodnota}</dd>
    </div>
  )
}
