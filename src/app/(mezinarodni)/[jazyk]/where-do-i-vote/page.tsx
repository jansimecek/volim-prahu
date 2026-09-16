import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { VyhledavacOkrsku } from '@/components/VyhledavacOkrsku'
import { JAZYKY, jazykoveVarianty, jeJazyk } from '@/lib/jazyky'
import { pokrytiMistnosti } from '@/lib/mistnosti'
import { prehledOkrsku } from '@/lib/okrsky'
import { dosad } from '@/lib/sablony'
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
    title: t.whereDoIVote.h1,
    description: t.whereDoIVote.perex,
    alternates: { languages: jazykoveVarianty(`/${jazyk}/where-do-i-vote`) },
  }
}

/**
 * Vyhledávač okrsku v jazyce čtenáře.
 *
 * Je to jediná stránka cizojazyčné sekce, která odpovídá na otázku „kam
 * mám v sobotu jít" konkrétní adresou, ne výkladem. Dřív se sem odkazovalo
 * do české verze s poznámkou, že stačí zadat ulici a číslo — jenže ve
 * chvíli, kdy vyhledávač nic nenajde, je celá odpověď česky a čtenář
 * nepozná, jestli udělal chybu, nebo je nástroj rozbitý.
 *
 * Zadaná adresa zůstává v prohlížeči. Stahují se jen statické soubory
 * s adresami té městské části, kde ulice leží — server se nikdy nedozví,
 * na co se kdo ptal. U cizince, který zjišťuje svůj pobytový status, to
 * není detail.
 */
export default async function WhereDoIVote({ params }: { params: Promise<{ jazyk: string }> }) {
  const { jazyk } = await params
  if (!jeJazyk(jazyk)) notFound()
  const t = preklad(jazyk)
  const s = t.whereDoIVote

  const pokryti = pokrytiMistnosti(prehledOkrsku()?.okrsky ?? [])
  const cislo = (n: number) => n.toLocaleString(t.formatLocale)

  return (
    <div className="space-y-12">
      <section>
        <h1 className="max-w-3xl text-3xl sm:text-4xl">{s.h1}</h1>
        <p className="mt-5 max-w-prose text-lg">{s.perex}</p>
      </section>

      <section
        aria-labelledby="vyhledavac"
        className="border border-inkoust bg-papir p-5 sm:p-8"
      >
        <h2 id="vyhledavac" className="text-2xl">
          {s.nastrojNadpis}
        </h2>
        <p className="mt-2 max-w-prose">{s.nastrojPopis}</p>
        <div className="mt-6">
          <VyhledavacOkrsku texty={t.vyhledavac} locale={t.formatLocale} />
        </div>
        <p className="popisek-uredni mt-6">
          {dosad(s.pokryti, {
            sMistnosti: cislo(pokryti.okrskuSMistnosti),
            celkem: cislo(pokryti.okrskuCelkem),
            podle2026:
              pokryti.okrskuPodle2026 > 0
                ? dosad(s.pokryti2026, { pocet: cislo(pokryti.okrskuPodle2026) })
                : '',
          })}
          {' · '}
          <a href="https://kudykvolbam.iprpraha.cz" className="odkaz-akcent" rel="noopener" hrefLang="cs">
            {s.oficialniNastroj}
          </a>
        </p>
      </section>

      <section aria-labelledby="lhuta">
        <h2 id="lhuta" className="text-2xl">
          {s.lhutaNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.lhutaText}</p>
      </section>

      <section aria-labelledby="dalsi" className="border-t border-linka pt-8">
        <h2 id="dalsi" className="text-2xl">
          {s.dalsiNadpis}
        </h2>
        <ul className="mt-4 space-y-2">
          {s.dalsi.map((d) => (
            <li key={d.cil}>
              <Link href={`/${jazyk}/${d.cil}`} className="odkaz-akcent text-lg">
                {d.text}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
