import type { Metadata } from 'next'
import Link from 'next/link'
import { ProudZpravicek } from '@/components/ProudZpravicek'
import { sPoctem } from '@/lib/cestina'
import { kZobrazeni, stranka } from '@/lib/zpravicky'

export const metadata: Metadata = {
  title: 'Zprávičky',
  description:
    'Krátké zápisy o průběhu pražských voleb 2026 — co se stalo, kdy a odkud to víme. Každá zprávička má uvedený zdroj.',
  alternates: {
    types: { 'application/rss+xml': '/zpravicky/feed.xml' },
  },
}

export default async function StrankaZpravicek() {
  const { zpravicky, celkem } = await stranka(1)
  const celkemZpravicek = (await kZobrazeni()).length

  return (
    <div className="space-y-8">
      <header className="max-w-prose">
        <p className="popisek-uredni">Průběžně</p>
        <h1 className="mt-2 text-4xl">Zprávičky</h1>
        <p className="mt-4">
          Krátké zápisy o tom, co se kolem pražských voleb děje: registrace kandidátek,
          losování čísel, zveřejněné programy, termíny. Věci, které jsou zajímavé, ale
          nevydají na vlastní stránku.
        </p>
        <p className="mt-3">
          Každá zprávička o volbách má uvedený zdroj, na který se dá kliknout — stejné
          pravidlo jako u všeho ostatního na webu. Poznámky o samotném webu jsou označené
          zvlášť, tam jsme zdrojem my. Zprávičky nekomentují a nikoho nedoporučují;
          k tomu, co který slib znamená, slouží{' '}
          <Link href="/jak-hodnotime" className="odkaz-akcent">
            hodnocení proveditelnosti
          </Link>
          .
        </p>
      </header>

      {zpravicky.length === 0 ? (
        <p className="max-w-prose border-l-2 border-praha pl-5">
          Zatím tu nic není. První zprávičky přibudou, jakmile se kolem voleb začne dít
          něco, co stojí za zápis.
        </p>
      ) : (
        <>
          <p className="popisek-uredni">
            {sPoctem(celkemZpravicek, 'zprávička', 'zprávičky', 'zpráviček')}
            {celkem > 1 && ` · strana 1 z ${celkem}`}
          </p>
          <ProudZpravicek zpravicky={zpravicky} />
        </>
      )}

      <footer className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-linka pt-6">
        <p className="text-sm">
          <a href="/zpravicky/feed.xml" className="odkaz-akcent">
            Odebírat zprávičky (RSS)
          </a>
        </p>
        {celkem > 1 && (
          <p className="text-sm">
            <Link href="/zpravicky/strana/2" className="odkaz-akcent">
              Starší zprávičky →
            </Link>
          </p>
        )}
      </footer>
    </div>
  )
}
