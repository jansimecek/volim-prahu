import type { Metadata } from 'next'
import Link from 'next/link'
import { ProudAktualit } from '@/components/ProudAktualit'
import { sPoctem } from '@/lib/cestina'
import { kZobrazeni, stranka } from '@/lib/aktuality'

export const metadata: Metadata = {
  title: 'Aktuálně',
  description:
    'Krátké zápisy o průběhu pražských voleb 2026 — co se stalo, kdy a odkud to víme. Každá aktualita má uvedený zdroj.',
  alternates: {
    types: { 'application/rss+xml': '/aktualne/feed.xml' },
  },
}

export default async function StrankaAktualne() {
  const { aktuality, celkem } = await stranka(1)
  const celkemAktualit = (await kZobrazeni()).length

  return (
    <div className="space-y-8">
      <header className="max-w-prose">
        <p className="popisek-uredni">Průběžně</p>
        <h1 className="mt-2 text-4xl">Aktuálně</h1>
        <p className="mt-4">
          Krátké zápisy o tom, co se kolem pražských voleb děje: registrace kandidátek,
          losování čísel, zveřejněné programy, termíny. Věci, které jsou zajímavé, ale
          nevydají na vlastní stránku.
        </p>
        <p className="mt-3">
          Každá aktualita o volbách má uvedený zdroj, na který se dá kliknout — stejné
          pravidlo jako u všeho ostatního na webu. Poznámky o samotném webu jsou označené
          zvlášť, tam jsme zdrojem my. Aktuality nekomentují a nikoho nedoporučují;
          k tomu, co který slib znamená, slouží{' '}
          <Link href="/jak-hodnotime" className="odkaz-akcent">
            hodnocení proveditelnosti
          </Link>
          .
        </p>
      </header>

      {aktuality.length === 0 ? (
        <p className="max-w-prose border-l-2 border-praha pl-5">
          Zatím tu nic není. První aktuality přibudou, jakmile se kolem voleb začne dít
          něco, co stojí za zápis.
        </p>
      ) : (
        <>
          <p className="popisek-uredni">
            {sPoctem(celkemAktualit, 'aktualita', 'aktuality', 'aktualit')}
            {celkem > 1 && ` · strana 1 z ${celkem}`}
          </p>
          <ProudAktualit aktuality={aktuality} />
        </>
      )}

      <footer className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-linka pt-6">
        <p className="text-sm">
          <a href="/aktualne/feed.xml" className="odkaz-akcent">
            Odebírat aktuality (RSS)
          </a>
          {' · '}
          <Link href="/rozhovory" className="odkaz-akcent">
            Rozhovory s kandidáty
          </Link>
        </p>
        {celkem > 1 && (
          <p className="text-sm">
            <Link href="/aktualne/strana/2" className="odkaz-akcent">
              Starší aktuality →
            </Link>
          </p>
        )}
      </footer>
    </div>
  )
}
