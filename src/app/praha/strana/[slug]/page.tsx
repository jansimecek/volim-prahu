import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { programy, strany } from '#content'
import { MDXContent } from '@/components/mdx'

type Parametry = { params: Promise<{ slug: string }> }

const magistratni = () => strany.filter((s) => s.uroven === 'magistrat')

export function generateStaticParams() {
  return magistratni().map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { slug } = await params
  const strana = magistratni().find((s) => s.slug === slug)
  if (!strana) return {}
  return {
    title: strana.nazev,
    description: `${strana.nazev} ve volbách do Zastupitelstva hlavního města Prahy 2026 — lídr, program a hodnocení proveditelnosti slibů.`,
  }
}

export default async function StrankaSubjektu({ params }: Parametry) {
  const { slug } = await params
  const strana = magistratni().find((s) => s.slug === slug)
  if (!strana) notFound()

  const program = programy.find((p) => p.subjekt === slug && p.uroven === 'magistrat')
  const pocetHodnocenych = program?.body.filter((b) => b.hodnoceni).length ?? 0

  return (
    <div className="space-y-10">
      <header>
        <p className="popisek-uredni">
          <Link href="/praha" className="no-underline">
            Magistrát
          </Link>
        </p>
        <h1 className="mt-2 text-4xl">{strana.nazev}</h1>
        {strana.zkratka !== strana.nazev && (
          <p className="popisek-uredni mt-2">{strana.zkratka}</p>
        )}
      </header>

      <dl className="grid grid-cols-1 gap-px border border-inkoust bg-linka sm:grid-cols-3">
        {strana.lidr && <Udaj popisek="Lídr kandidátky" hodnota={strana.lidr} />}
        <Udaj
          popisek="Program"
          hodnota={strana.programUrl ? 'zveřejněn' : 'zatím nedohledán'}
          odkaz={strana.programUrl}
        />
        <Udaj
          popisek="Hodnocených slibů"
          hodnota={pocetHodnocenych > 0 ? String(pocetHodnocenych) : '—'}
        />
      </dl>

      <div className="proza max-w-prose">
        <MDXContent code={strana.content} />
      </div>

      <section className="max-w-prose border-t border-linka pt-6">
        <h2 className="text-2xl">Program a jeho proveditelnost</h2>
        {pocetHodnocenych > 0 ? (
          <p className="mt-3">
            <Link href={`/praha/strana/${strana.slug}/program`} className="odkaz-akcent">
              Zobrazit {pocetHodnocenych} hodnocených slibů
            </Link>
          </p>
        ) : (
          <p className="mt-3">
            Hodnocení proveditelnosti u tohoto subjektu zatím nezveřejňujeme. Objeví se tady,
            jakmile bude program dohledaný a zpracovaný podle{' '}
            <Link href="/jak-hodnotime" className="odkaz-akcent">
              metodiky
            </Link>
            .
          </p>
        )}
      </section>

      {strana.web && (
        <p className="text-sm">
          <a href={strana.web} className="odkaz-akcent" rel="noopener nofollow">
            Oficiální web subjektu
          </a>
        </p>
      )}
    </div>
  )
}

function Udaj({
  popisek,
  hodnota,
  odkaz,
}: {
  popisek: string
  hodnota: string
  odkaz?: string
}) {
  return (
    <div className="bg-papir p-3">
      <dt className="popisek-uredni">{popisek}</dt>
      <dd className="mt-1 font-mono">
        {odkaz ? (
          <a href={odkaz} className="odkaz-akcent" rel="noopener nofollow">
            {hodnota}
          </a>
        ) : (
          hodnota
        )}
      </dd>
    </div>
  )
}
