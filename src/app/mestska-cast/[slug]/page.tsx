import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/mdx'
import { MESTSKE_CASTI, SADA_CISELNIKU, cislo, mestskaCastPodleSlugu } from '@/lib/obsah'
import { senatniStavMestskeCasti } from '@/lib/senat'

type Parametry = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return MESTSKE_CASTI.map((mc) => ({ slug: mc.slug }))
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { slug } = await params
  const mc = mestskaCastPodleSlugu(slug)
  if (!mc) return {}
  return {
    title: mc.nazev,
    description: `Volby do zastupitelstva ${mc.nazev} 2026: ${mc.mandaty} mandátů, kandidující subjekty a místní témata.`,
  }
}

export default async function StrankaMestskeCasti({ params }: Parametry) {
  const { slug } = await params
  const mc = mestskaCastPodleSlugu(slug)
  const zastupitelstvo = MESTSKE_CASTI.find((z) => z.slug === slug)
  if (!mc || !zastupitelstvo) notFound()

  const senat = senatniStavMestskeCasti(slug)

  return (
    <div className="space-y-10">
      <header>
        <p className="popisek-uredni">
          <Link href="/mestska-cast" className="no-underline">
            Městské části
          </Link>
        </p>
        <h1 className="mt-2 text-4xl">{mc.nazev}</h1>
      </header>

      {/* Údaje z číselníku ČSÚ — needitovatelné ručně, proto vizuálně odděleno od textu. */}
      <dl className="grid grid-cols-2 gap-px border border-inkoust bg-linka sm:grid-cols-4">
        <Udaj popisek="Mandátů" hodnota={cislo(mc.mandaty)} />
        <Udaj popisek="Volebních okrsků" hodnota={cislo(mc.okrsky)} />
        <Udaj popisek="Obyvatel" hodnota={cislo(zastupitelstvo.pocetObyvatel)} />
        <Udaj popisek="Kód ČSÚ" hodnota={mc.kodZastupitelstva} />
      </dl>

      {/* Jestli tady člověk dostane i senátní lístek, se jinde zjišťuje těžko. */}
      <section className="max-w-prose border-l-2 border-praha pl-5">
        <h2 className="popisek-uredni">Senátní volby 2026</h2>
        {senat.stav === 'voli' && (
          <p className="mt-1">
            Kromě zastupitelstev tady volíte i senátora — spadáte do{' '}
            <Link href={`/senat/${senat.obvod.slug}`} className="odkaz-akcent">
              obvodu č. {senat.obvod.cislo} ({senat.obvod.nazev})
            </Link>
            .
          </p>
        )}
        {senat.stav === 'castecne' && (
          <p className="mt-1">
            Tahle městská část je rozdělená mezi dva senátní obvody. Do{' '}
            <Link href={`/senat/${senat.obvod.slug}`} className="odkaz-akcent">
              obvodu č. {senat.obvod.cislo} ({senat.obvod.nazev})
            </Link>
            , kde se letos volí, patří {senat.popis}. Ve zbytku území se senátor letos
            nevolí — rozhoduje adresa, ne příslušnost k městské části.
          </p>
        )}
        {senat.stav === 'nevoli' && (
          <p className="mt-1">
            Senátora tady letos nevolíte. Senát se obměňuje po třetinách a{' '}
            <Link href="/senat" className="odkaz-akcent">
              obvod, do kterého tahle část patří
            </Link>
            , přijde na řadu až v dalších letech. Ve volební místnosti dostanete jen
            lístky pro zastupitelstvo města a městské části.
          </p>
        )}
      </section>

      <div className="proza max-w-prose">
        <MDXContent code={mc.content} />
      </div>

      {mc.temata.length > 0 && (
        <section>
          <h2 className="text-2xl">Místní témata</h2>
          <ul className="mt-4 space-y-4">
            {mc.temata.map((tema) => (
              <li key={tema.nadpis} className="max-w-prose border-l-2 border-linka pl-4">
                <h3 className="font-display font-semibold">{tema.nadpis}</h3>
                <p className="mt-1">{tema.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="max-w-prose border-t border-linka pt-6">
        <h2 className="text-2xl">Kandidující subjekty</h2>
        <p className="mt-3">
          Kandidátní listiny pro volby 2026 zatím Český statistický úřad nezveřejnil.
          Jakmile je vydá, objeví se tady seznam volebních stran i jednotlivých kandidátů.
        </p>
        <p className="popisek-uredni mt-4">
          Údaje o mandátech a okrscích jsou ze sady {SADA_CISELNIKU} · zdroj:{' '}
          <a href="https://volby.gov.cz/opendata/opendata.htm" className="underline">
            otevřená data ČSÚ
          </a>
        </p>
      </section>

      {!mc.publikovano && (
        <p className="border border-okr px-4 py-3 text-sm text-okr">
          Textová část téhle stránky je zatím rozpracovaná. Údaje z číselníku ČSÚ výše
          jsou platné.
        </p>
      )}
    </div>
  )
}

function Udaj({ popisek, hodnota }: { popisek: string; hodnota: string }) {
  return (
    <div className="bg-papir p-3">
      <dt className="popisek-uredni">{popisek}</dt>
      <dd className="mt-1 font-mono text-lg">{hodnota}</dd>
    </div>
  )
}
