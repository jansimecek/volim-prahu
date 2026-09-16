import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StrukturovanaData } from '@/components/StrukturovanaData'
import { JAZYKY, jeJazyk } from '@/lib/jazyky'
import { preklad } from '@/preklady'
import { absolutni } from '@/lib/web'

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
  return { title: t.index.h1, description: t.meta.popisSekce }
}

export default async function Rozcestnik({ params }: { params: Promise<{ jazyk: string }> }) {
  const { jazyk } = await params
  if (!jeJazyk(jazyk)) notFound()
  const t = preklad(jazyk)

  return (
    <div className="space-y-12 sm:space-y-16">
      <StrukturovanaData
        data={{
          '@type': 'FAQPage',
          inLanguage: t.htmlLang,
          mainEntity: t.index.odpovedi.map((o) => ({
            '@type': 'Question',
            name: `${t.index.h1} — ${o.obcanstvi}`,
            acceptedAnswer: { '@type': 'Answer', text: `${o.zaver} ${o.detail}` },
          })),
        }}
      />

      <section>
        <p className="popisek-uredni">{t.index.nadpisek}</p>
        <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl">{t.index.h1}</h1>
        <p className="mt-5 max-w-prose text-lg">{t.index.perex}</p>
      </section>

      {/* Jádro stránky. Odpověď stojí na občanství, tak je občanství vidět
          dřív než cokoli jiného — kdo sem přijde s otázkou „smím vůbec?",
          má ji mít zodpovězenou bez scrollování. */}
      <section aria-labelledby="odpovedi">
        <h2 id="odpovedi" className="text-2xl">
          {t.index.odpovediNadpis}
        </h2>
        <ul className="mt-6 space-y-px bg-linka-silna">
          {t.index.odpovedi.map((o) => (
            <li key={o.obcanstvi} className="bg-papir p-5 sm:p-6">
              <p className="popisek-uredni">{o.obcanstvi}</p>
              <p className={`mt-2 text-xl ${o.stav === 'ano' ? 'zpusobilost-ano' : 'zpusobilost-ne'}`}>
                <span className="znacka" aria-hidden="true">
                  {o.stav === 'ano' ? '✓' : '✕'}
                </span>{' '}
                {o.zaver}
              </p>
              <p className="mt-2 max-w-prose">{o.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5">
          <Link href={`/${jazyk}/can-i-vote`} className="odkaz-akcent text-lg">
            {t.index.overitVyzva}
          </Link>
        </p>
      </section>

      <section aria-labelledby="fakta">
        <h2 id="fakta" className="text-2xl">
          {t.index.faktaNadpis}
        </h2>
        <dl className="mt-6 grid gap-px border border-inkoust bg-linka-silna sm:grid-cols-3">
          {t.index.fakta.map((f) => (
            <div key={f.popisek} className="bg-papir p-5">
              <dt className="popisek-uredni">{f.popisek}</dt>
              <dd className="mt-2">{f.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="rozcestnik">
        <h2 id="rozcestnik" className="text-2xl">
          {t.index.rozcestnikNadpis}
        </h2>
        <ul className="mt-6 grid gap-px bg-linka-silna sm:grid-cols-2">
          {t.index.rozcestnik.map((r) => (
            <li key={r.cil} className="bg-papir p-5">
              <h3 className="text-xl">
                <Link href={`/${jazyk}/${r.cil}`} className="odkaz-akcent">
                  {r.nadpis}
                </Link>
              </h3>
              <p className="mt-2">{r.popis}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="o-webu" className="border-t border-linka pt-8">
        <h2 id="o-webu" className="text-2xl">
          {t.index.oWebuNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{t.index.oWebu}</p>
        <p className="popisek-uredni mt-4">
          <a href={absolutni('/')} className="underline" hrefLang="cs" lang="cs">
            www.volimprahu.cz
          </a>
        </p>
      </section>
    </div>
  )
}
