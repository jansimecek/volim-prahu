import type { Metadata } from 'next'
import Link from 'next/link'
import { Drobecky } from '@/components/Drobecky'
import { notFound } from 'next/navigation'
import { programy, strany } from '#content'
import { MDXContent } from '@/components/mdx'
import { SeznamKandidatu } from '@/components/SeznamKandidatu'
import { celeJmeno, lidr, stranaPodleKodu } from '@/lib/kandidatky'
import { POPIS_PROGRAMU } from '@/lib/strany'

type Parametry = { params: Promise<{ slug: string }> }

const magistratni = () => strany.filter((s) => s.uroven === 'magistrat')

export function generateStaticParams() {
  return magistratni().map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { slug } = await params
  const strana = magistratni().find((s) => s.slug === slug)
  if (!strana) return {}
  const nazev = stranaPodleKodu('magistrat', strana.kodStrany)?.nazev ?? strana.zkratka
  return {
    title: nazev,
    description: `${nazev} ve volbách do Zastupitelstva hlavního města Prahy 2026 — lídr, kandidátní listina a hodnocení proveditelnosti slibů.`,
  }
}

export default async function StrankaSubjektu({ params }: Parametry) {
  const { slug } = await params
  const strana = magistratni().find((s) => s.slug === slug)
  if (!strana) notFound()

  const program = programy.find((p) => p.subjekt === slug && p.uroven === 'magistrat')
  const pocetHodnocenych = program?.body.filter((b) => b.hodnoceni).length ?? 0

  const naKandidatce = stranaPodleKodu('magistrat', strana.kodStrany)
  const jednicka = lidr(naKandidatce)

  return (
    <div className="space-y-10">
      <header>
        <Drobecky
          cesta={[
            { popisek: 'Úvod', href: '/' },
            { popisek: 'Magistrát', href: '/praha' },
            { popisek: strana.zkratka },
          ]}
        />
        <h1 className="mt-3 text-4xl">{naKandidatce?.nazev ?? strana.zkratka}</h1>
        <p className="popisek-uredni mt-2">{strana.zkratka}</p>
      </header>

      <dl className="grid grid-cols-1 gap-px border border-inkoust bg-linka-silna sm:grid-cols-3">
        {jednicka && (
          <Udaj
            popisek="Lídr kandidátky"
            hodnota={celeJmeno(jednicka)}
            odkaz={`/kandidat/${jednicka.slug}`}
          />
        )}
        <Udaj
          popisek="Kandidátů"
          hodnota={naKandidatce ? String(naKandidatce.kandidati.length) : '—'}
        />
        <Udaj
          popisek="Číslo na lístku"
          hodnota={
            naKandidatce?.vylosovano && naKandidatce.cislo !== null
              ? String(naKandidatce.cislo)
              : 'zatím nevylosováno'
          }
        />
        <Udaj
          popisek="Program"
          hodnota={POPIS_PROGRAMU[strana.programStav]}
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
        <h2 className="text-2xl">Co strana slibuje</h2>
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

      {naKandidatce && (
        <section>
          <h2 className="text-2xl">Kandidátní listina</h2>
          <p className="mt-1 max-w-prose text-sm text-seda-uredni">
            {naKandidatce.kandidati.length} kandidátů na 65 mandátů. Údaje jsou
            z otevřených dat ČSÚ a neupravujeme je.
          </p>
          <div className="mt-5">
            <SeznamKandidatu strana={naKandidatce} />
          </div>
        </section>
      )}

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
