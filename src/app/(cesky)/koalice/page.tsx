import type { Metadata } from 'next'
import Link from 'next/link'
import { koalice } from '#content'
import { DeklaraceKoalic } from '@/components/DeklaraceKoalic'
import { Obsah } from '@/components/Obsah'
import { VyjednavaniZastupitelstva } from '@/components/VyjednavaniZastupitelstva'
import { MDXContent } from '@/components/mdx'
import { datumCesky } from '@/lib/cestina'
import { KONECNE_VYSLEDKY, stranySMandaty } from '@/lib/konecneVysledky'
import { vetsina } from '@/lib/koalice'
import { nadpisyStranky } from '@/lib/nadpisy'
import { strankaPodleSlugu } from '@/lib/obsah'
import {
  jeSledovane,
  POPIS_STAVU,
  posledniUdalost,
  stavVyjednavani,
  vyjednavaniZastupitelstva,
} from '@/lib/vyjednavani'
import { KOD_MAGISTRATU } from '@/lib/vysledky'

const stranka = strankaPodleSlugu('koalice')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

export default function StrankaKoalic() {
  const vysledky = KONECNE_VYSLEDKY.zastupitelstva
  const magistrat = vysledky.find((z) => z.kod === KOD_MAGISTRATU)
  const casti = vysledky
    .filter((z) => z.kod !== KOD_MAGISTRATU)
    .sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs', { numeric: true }))
  const sledovane = casti.filter((z) => jeSledovane(z.slug))
  const ostatni = casti.filter((z) => !jeSledovane(z.slug))

  return (
    <article className="space-y-12">
      <header className="max-w-prose">
        <p className="popisek-uredni">Po volbách 2026</p>
        <h1 className="mt-2 text-4xl">{stranka.title}</h1>
      </header>

      <Obsah
        polozky={[
          { id: 'magistrat', text: 'Magistrát' },
          { id: 'mestske-casti', text: 'Městské části' },
          ...nadpisyStranky(stranka.surovy),
          { id: 'deklarace', text: 'Co kdo řekl před volbami' },
        ]}
      />

      {magistrat && (
        <section id="magistrat" className="scroll-mt-20 space-y-4">
          <h2 className="text-3xl">Magistrát</h2>
          <p className="max-w-prose">
            {stranySMandaty(magistrat)
              .map((s) => `${s.nazev} ${s.mandaty}`)
              .join(' · ')}
            . Primátora a radu zvolí 65 zastupitelů, většina je {vetsina(magistrat.mandatuCelkem)}.{' '}
            <Link href="/vysledky#magistrat" className="odkaz-akcent">
              Výsledky a zvolení zastupitelé
            </Link>
          </p>
          <VyjednavaniZastupitelstva z={magistrat} nadpis="h3" />
        </section>
      )}

      <section id="mestske-casti" className="scroll-mt-20">
        <h2 className="text-3xl">Městské části</h2>
        <p className="mt-2 max-w-prose">
          Podrobně sledujeme Prahu 1 až 22. Ve zbylých 35 menších částech zapisujeme vyjednávání,
          když o něm píšou média. U každé části jsou na její stránce výsledky, zvolení zastupitelé
          a sestavy, které mají většinu.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-inkoust">
                <th className="popisek-uredni py-2 pr-3">Městská část</th>
                <th className="popisek-uredni py-2 pr-3">Nejsilnější</th>
                <th className="popisek-uredni py-2 pr-3 text-right">Většina</th>
                <th className="popisek-uredni py-2 pr-3">Stav vyjednávání</th>
                <th className="popisek-uredni py-2">Poslední zpráva</th>
              </tr>
            </thead>
            <tbody>
              {sledovane.map((z) => {
                const v = vyjednavaniZastupitelstva(z.slug)
                const posledni = posledniUdalost(v)
                const prvni = stranySMandaty(z)[0]
                const samostatne = prvni && prvni.mandaty >= vetsina(z.mandatuCelkem)
                return (
                  <tr key={z.kod} className="border-b border-linka-silna align-top">
                    <td className="py-2 pr-3">
                      <Link href={`/mestska-cast/${z.slug}#vyjednavani`} className="odkaz-akcent">
                        {z.nazev}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">
                      {prvni ? `${prvni.nazev} ${prvni.mandaty}/${z.mandatuCelkem}` : '—'}
                      {samostatne && <span className="popisek-uredni block">má sama většinu</span>}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono">{vetsina(z.mandatuCelkem)}</td>
                    <td className="py-2 pr-3">{POPIS_STAVU[stavVyjednavani(v)]}</td>
                    <td className="py-2">{posledni ? datumCesky(posledni.datum) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <h3 className="mt-8 text-xl">Další městské části</h3>
        <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {ostatni.map((z) => {
            const v = vyjednavaniZastupitelstva(z.slug)
            return (
              <li key={z.kod}>
                <Link href={`/mestska-cast/${z.slug}#vyjednavani`} className="odkaz-akcent">
                  {z.nazev}
                </Link>
                {v && <span className="popisek-uredni"> · {POPIS_STAVU[stavVyjednavani(v)]}</span>}
              </li>
            )
          })}
        </ul>
      </section>

      <div className="proza max-w-prose">
        <MDXContent code={stranka.content} />
      </div>

      <section className="space-y-4">
        <p className="max-w-prose text-seda-uredni">
          Níže jsou vyjádření o spolupráci na magistrátu, která zazněla před volbami. Nejsou to
          závazky; zapisujeme je, aby šlo porovnat, co kdo řekl před volbami a co dělá po nich.
        </p>
        <DeklaraceKoalic />
      </section>

      <footer className="border-t border-linka pt-6">
        <p className="popisek-uredni">
          {koalice.deklarace.length} doložených předvolebních vyjádření · ověřeno{' '}
          {datumCesky(koalice.overeno)} · aktualizováno {datumCesky(stranka.aktualizovano)}
        </p>
      </footer>
    </article>
  )
}
