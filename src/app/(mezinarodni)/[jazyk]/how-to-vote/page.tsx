import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ZdrojeZakonu } from '@/components/ZdrojeZakonu'
import { JAZYKY, jazykoveVarianty, jeJazyk } from '@/lib/jazyky'
import { dosad, pocetMandatu } from '@/lib/mandatyPrehled'
import { preklad } from '@/preklady'

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
    title: t.howToVote.h1,
    description: t.howToVote.perex,
    alternates: { languages: jazykoveVarianty(`/${jazyk}/how-to-vote`) },
  }
}

export default async function HowToVote({ params }: { params: Promise<{ jazyk: string }> }) {
  const { jazyk } = await params
  if (!jeJazyk(jazyk)) notFound()
  const t = preklad(jazyk)
  const s = t.howToVote
  const mandaty = pocetMandatu()

  return (
    <div className="space-y-12">
      <section>
        <h1 className="max-w-3xl text-3xl sm:text-4xl">{s.h1}</h1>
        <p className="mt-5 max-w-prose text-lg">{s.perex}</p>
      </section>

      <section aria-labelledby="kdy">
        <h2 id="kdy" className="text-2xl">
          {s.kdyNadpis}
        </h2>
        <ul className="mt-3 max-w-prose space-y-1">
          {s.kdyRadky.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-seda-uredni">{s.kdyPoznamka}</p>
      </section>

      <section aria-labelledby="kde">
        <h2 id="kde" className="text-2xl">
          {s.kdeNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.kdeText}</p>
        {/* Vyhledávač okrsku je česky, ale zadává se do něj adresa a vypadne
            z něj adresa a mapa — to je použitelné i bez češtiny. Odkaz proto
            vede přímo tam, jen s upozorněním, do jakého jazyka klikáte. */}
        <p className="mt-4">
          <Link href="/kde-volim" className="odkaz-akcent text-lg" hrefLang="cs">
            {s.kdeNastroj}
          </Link>
        </p>
        <p className="mt-1 max-w-prose text-sm text-seda-uredni">{s.kdeNastrojPopis}</p>
        <p className="mt-4 max-w-prose">{s.kdeOznameni}</p>
      </section>

      <section aria-labelledby="doklad">
        <h2 id="doklad" className="text-2xl">
          {s.dokladNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.dokladUvod}</p>
        <dl className="mt-5 grid gap-px bg-linka-silna sm:grid-cols-2">
          {s.dokladSkupiny.map((d) => (
            <div key={d.kdo} className="bg-papir p-5">
              <dt className="popisek-uredni">{d.kdo}</dt>
              <dd className="mt-2">{d.doklady}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 max-w-prose text-sm text-seda-uredni">{s.dokladEdoklad}</p>
      </section>

      <section aria-labelledby="listky">
        <h2 id="listky" className="text-2xl">
          {s.listkyNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.listkyText}</p>
        <p className="mt-3 max-w-prose">{s.listkyDodani}</p>
      </section>

      {/* Tři způsoby označení lístku jsou to, co na komunálních volbách plete
          i rodilé voliče. Číslované, aby se daly porovnat vedle sebe. */}
      <section aria-labelledby="znacky">
        <h2 id="znacky" className="text-2xl">
          {s.znackyNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{dosad(s.znackyUvod, mandaty)}</p>
        <ol className="mt-5 space-y-px bg-linka-silna">
          {s.zpusoby.map((z, i) => (
            <li key={z.nazev} className="bg-papir p-5">
              <h3 className="text-lg">
                <span className="popisek-uredni me-2">{i + 1}</span>
                {z.nazev}
              </h3>
              <p className="mt-1 max-w-prose">{z.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-prose text-sm text-seda-uredni">{s.znackyStejnaStrana}</p>
      </section>

      <section aria-labelledby="neplatne">
        <h2 id="neplatne" className="text-2xl">
          {s.neplatneNadpis}
        </h2>
        <ul className="mt-3 max-w-prose list-disc space-y-1 ps-5">
          {s.neplatne.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-seda-uredni">{s.neplatnePoznamka}</p>
      </section>

      <section aria-labelledby="senat">
        <h2 id="senat" className="text-2xl">
          {s.senatNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.senatText}</p>
      </section>

      <section aria-labelledby="pomoc">
        <h2 id="pomoc" className="text-2xl">
          {s.pomocNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.pomocText}</p>
      </section>

      <ZdrojeZakonu nadpis={s.zdrojeNadpis} zdroje={s.zdroje} />
    </div>
  )
}
