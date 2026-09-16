import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TestZpusobilosti } from '@/components/TestZpusobilosti'
import { ZdrojeZakonu } from '@/components/ZdrojeZakonu'
import { JAZYKY, jazykoveVarianty, jeJazyk } from '@/lib/jazyky'
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
    title: t.canIVote.h1,
    description: t.canIVote.perex,
    alternates: { languages: jazykoveVarianty(`/${jazyk}/can-i-vote`) },
  }
}

export default async function CanIVote({ params }: { params: Promise<{ jazyk: string }> }) {
  const { jazyk } = await params
  if (!jeJazyk(jazyk)) notFound()
  const t = preklad(jazyk)
  const s = t.canIVote

  return (
    <div className="space-y-12">
      <section>
        <h1 className="max-w-3xl text-3xl sm:text-4xl">{s.h1}</h1>
        <p className="mt-5 max-w-prose text-lg">{s.perex}</p>
      </section>

      <TestZpusobilosti t={t} />

      <section aria-labelledby="zakon">
        <h2 id="zakon" className="text-2xl">
          {s.zakonNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.zakonUvod}</p>
        <ul className="mt-5 space-y-px bg-linka-silna">
          {s.podminky.map((p) => (
            <li key={p.nadpis} className="bg-papir p-5">
              <h3 className="text-lg">{p.nadpis}</h3>
              <p className="mt-1 max-w-prose">{p.text}</p>
            </li>
          ))}
        </ul>

        <h3 className="mt-8 text-xl">{s.smlouvaNadpis}</h3>
        <p className="mt-2 max-w-prose">{s.smlouvaText}</p>
        <p className="mt-3 max-w-prose text-sm text-seda-uredni">{s.smlouvaPoznamka}</p>
      </section>

      {/* Nejdůležitější sekce stránky. Zastaralá rada „musíte se zapsat
          do dodatku" koluje dál a dokáže člověka odradit od voleb víc než
          cokoli jiného — proto má vlastní rámeček, ne odstavec v textu. */}
      <section aria-labelledby="registrace" className="border border-inkoust bg-papir-tmavsi p-5 sm:p-6">
        <h2 id="registrace" className="text-2xl">
          {s.registraceNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.registraceText}</p>
        <p className="mt-3 max-w-prose">{s.registraceText2}</p>

        <h3 className="mt-6 text-lg">{s.overeniNadpis}</h3>
        <ul className="mt-2 max-w-prose list-disc space-y-1 ps-5">
          {s.overeniKroky.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-seda-uredni">{s.overeniPoznamka}</p>
      </section>

      <section aria-labelledby="chybi">
        <h2 id="chybi" className="text-2xl">
          {s.chybiNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.chybiText}</p>
      </section>

      <section aria-labelledby="prekazky">
        <h2 id="prekazky" className="text-2xl">
          {s.prekazkyNadpis}
        </h2>
        <ul className="mt-3 max-w-prose list-disc space-y-1 ps-5">
          {s.prekazky.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="senat">
        <h2 id="senat" className="text-2xl">
          {s.senatNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.senatText}</p>
      </section>

      <ZdrojeZakonu nadpis={s.zdrojeNadpis} zdroje={s.zdroje} />
    </div>
  )
}
