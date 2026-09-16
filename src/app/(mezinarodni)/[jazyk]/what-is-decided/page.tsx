import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JAZYKY, jazykoveVarianty, jeJazyk } from '@/lib/jazyky'
import { pocetMandatu } from '@/lib/mandatyPrehled'
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
    title: t.whatIsDecided.h1,
    description: t.whatIsDecided.perex,
    alternates: { languages: jazykoveVarianty(`/${jazyk}/what-is-decided`) },
  }
}

export default async function WhatIsDecided({ params }: { params: Promise<{ jazyk: string }> }) {
  const { jazyk } = await params
  if (!jeJazyk(jazyk)) notFound()
  const t = preklad(jazyk)
  const s = t.whatIsDecided

  // Počty mandátů se berou z číselníku, ne z textu překladu: kdyby se změnily,
  // nesmí zůstat zabetonované ve třech jazykových verzích zvlášť.
  const mandaty = pocetMandatu()
  const pocty = [`${mandaty.magistrat}`, `${mandaty.mcOd}–${mandaty.mcDo}`]

  return (
    <div className="space-y-12">
      <section>
        <h1 className="max-w-3xl text-3xl sm:text-4xl">{s.h1}</h1>
        <p className="mt-5 max-w-prose text-lg">{s.perex}</p>
      </section>

      <section aria-labelledby="urovne">
        <h2 id="urovne" className="text-2xl">
          {s.urovneNadpis}
        </h2>
        <ul className="mt-5 grid gap-px bg-linka-silna sm:grid-cols-2">
          {s.urovne.map((u, i) => (
            <li key={u.nazev} className="bg-papir p-5">
              <h3 className="text-xl">{u.nazev}</h3>
              <p className="popisek-uredni mt-1">
                {pocty[i]} {u.mandaty}
              </p>
              <p className="mt-2">{u.popis}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="proc">
        <h2 id="proc" className="text-2xl">
          {s.procNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.procText}</p>
        <p className="mt-4">
          <Link href="/kdo-o-cem-rozhoduje" className="odkaz-akcent text-lg" hrefLang="cs">
            {s.procOdkaz}
          </Link>
        </p>
      </section>

      <section aria-labelledby="hodnoceni">
        <h2 id="hodnoceni" className="text-2xl">
          {s.hodnoceniNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.hodnoceniText}</p>
        <p className="mt-4">
          <Link href="/jak-hodnotime" className="odkaz-akcent" hrefLang="cs">
            {s.hodnoceniOdkaz}
          </Link>
        </p>
      </section>

      <section aria-labelledby="rozpocet">
        <h2 id="rozpocet" className="text-2xl">
          {s.rozpocetNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.rozpocetText}</p>
        <p className="mt-4">
          <Link href="/rozpoctovy-ramec" className="odkaz-akcent" hrefLang="cs">
            {s.rozpocetOdkaz}
          </Link>
        </p>
      </section>

      <section aria-labelledby="senat">
        <h2 id="senat" className="text-2xl">
          {s.senatNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.senatText}</p>
        <p className="mt-4">
          <Link href="/senat" className="odkaz-akcent" hrefLang="cs">
            {s.senatOdkaz}
          </Link>
        </p>
      </section>
    </div>
  )
}
