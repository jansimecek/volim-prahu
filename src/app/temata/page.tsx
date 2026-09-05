import type { Metadata } from 'next'
import Link from 'next/link'
import { vyroky } from '#content'
import { datumCesky, sPoctem } from '@/lib/cestina'
import { POPIS_ZAVER } from '@/lib/hodnoceni'
import { PostojeOkruhu } from '@/components/PostojeOkruhu'
import { OKRUHY, bezPostoje, bezVyroku, postojeOkruhu, slibyOkruhu, vyrokyOkruhu } from '@/lib/temata'

export const metadata: Metadata = {
  title: 'Srovnání témat',
  description:
    'Co lídři pražských kandidátek řekli o bydlení, dopravě, územním plánu, rozpočtu a školství — doslovné citace vedle sebe, s uvedeným zdrojem.',
}

const POPIS_TYPU_ZDROJE: Record<string, string> = {
  redakcni: '',
  'tiskova-zprava': 'tisková zpráva subjektu',
  'stranicky-web': 'web strany',
}

export default function StrankaTemat() {
  const zdrojPodleId = new Map(vyroky.zdroje.map((z) => [z.id, z]))

  return (
    <div className="space-y-12">
      <header className="max-w-prose">
        <p className="popisek-uredni">Srovnání</p>
        <h1 className="mt-2 text-4xl">Co lídři říkají k zásadním tématům</h1>
        <p className="mt-4">
          Doslovné citace vedle sebe, u každé zdroj a datum. Nic neshrnujeme vlastními
          slovy a nikoho nehodnotíme — čtete přesně to, co dotyčný řekl a kde.
        </p>
        <p className="mt-4">
          <Link href="/rozhovory" className="odkaz-akcent">
            Rozhovory s kandidáty v médiích
          </Link>
        </p>
        <p className="mt-3 border-l-2 border-praha pl-5">
          Většina lídrů se k většině témat veřejně nevyjádřila, nebo se nám to
          nepodařilo doložit. U každého okruhu proto uvádíme i to, u koho nemáme nic —
          jinak by srovnání vypadalo úplněji, než jaké je.
        </p>
      </header>

      <nav aria-label="Okruhy" className="border-y border-inkoust py-3">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {OKRUHY.map((o) => (
            <li key={o.id}>
              <a href={`#${o.id}`} className="odkaz-navigace">
                {o.nazev}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {OKRUHY.map((okruh) => {
        const vyrokyOk = vyrokyOkruhu(okruh)
        const sliby = slibyOkruhu(okruh)
        const chybi = bezVyroku(okruh)
        const postojeOk = postojeOkruhu(okruh)
        const bezPostojeOk = bezPostoje(okruh)

        return (
          <section key={okruh.id} id={okruh.id} className="scroll-mt-20">
            <h2 className="text-2xl">{okruh.nazev}</h2>
            <p className="mt-1 max-w-prose text-sm text-seda-uredni">{okruh.popis}</p>
            <p className="popisek-uredni mt-3">
              Doložený výrok má {new Set(vyrokyOk.map((v) => v.osobaSlug)).size} z{' '}
              {chybi.length + new Set(vyrokyOk.map((v) => v.osobaSlug)).size} lídrů
              {sliby.length > 0 &&
                ` · ${sPoctem(sliby.length, 'hodnocený slib', 'hodnocené sliby', 'hodnocených slibů')}`}
            </p>

            {postojeOk.length > 0 && (
              <>
                <h3 className="mt-6 text-lg">Co k tomu subjekty říkají</h3>
                <PostojeOkruhu postoje={postojeOk} chybi={bezPostojeOk} />
                <h3 className="mt-8 text-lg">Doslovné výroky lídrů</h3>
              </>
            )}

            {vyrokyOk.length === 0 ? (
              <p className="mt-5 max-w-prose">
                K tomuhle okruhu nemáme doložený výrok od žádného lídra.
              </p>
            ) : (
              <div className="mt-5 border-t border-inkoust">
                {vyrokyOk.map((v, i) => {
                  const zdroj = zdrojPodleId.get(v.zdroj)
                  return (
                    <article key={`${v.osobaSlug}-${i}`} className="border-b border-linka-silna py-5">
                      <p className="font-display font-semibold">
                        {v.jmeno}
                        <Link
                          href={`/praha/strana/${v.subjekt}`}
                          className="popisek-uredni ml-2 no-underline"
                        >
                          {v.zkratkaStrany}
                        </Link>
                      </p>
                      <blockquote className="mt-2 max-w-prose border-l-2 border-inkoust pl-4 font-cteci text-lg">
                        {`„${v.citace}“`}
                        {v.pokracovani && (
                          <span className="text-seda-uredni">{` […${v.pokracovani}]`}</span>
                        )}
                      </blockquote>
                      <p className="mt-2 max-w-prose text-sm">{v.kontext}</p>
                      {zdroj && (
                        <p className="popisek-uredni mt-2">
                          <a
                            href={zdroj.url}
                            className="underline"
                            rel="noopener nofollow"
                          >
                            {zdroj.medium}
                          </a>
                          , {datumCesky(zdroj.datum)}
                          {POPIS_TYPU_ZDROJE[zdroj.typ]
                            ? ` · ${POPIS_TYPU_ZDROJE[zdroj.typ]}`
                            : ''}
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}

            {sliby.length > 0 && (
              <div className="mt-6">
                <h3 className="popisek-uredni">Hodnocené sliby z programů</h3>
                <ul className="mt-2 space-y-2">
                  {sliby.map((s, i) => (
                    <li key={i} className="max-w-prose border-l-2 border-linka-silna pl-4 text-sm">
                      <Link href={`/praha/strana/${s.subjekt}/program`} className="odkaz-akcent">
                        {s.zkratkaStrany}
                      </Link>
                      : {s.slib}
                      <span className="popisek-uredni ml-2">
                        {POPIS_ZAVER[s.zaver as keyof typeof POPIS_ZAVER].nazev}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {chybi.length > 0 && (
              <details className="mt-5 max-w-prose">
                <summary className="cursor-pointer popisek-uredni">
                  <span className="pl-1.5">
                    U {sPoctem(chybi.length, 'lídra', 'lídrů', 'lídrů')} k tomuhle okruhu
                    nic doloženého nemáme
                  </span>
                </summary>
                <p className="mt-2 text-sm">
                  {chybi.map((c) => c.jmeno).join(', ')}. Neznamená to, že se k tématu
                  nevyjádřili — jen že jsme doslovný výrok se zdrojem nenašli.
                </p>
              </details>
            )}
          </section>
        )
      })}

      <p className="popisek-uredni">
        Výroky prošly nezávislým ověřením proti zdroji. Parafráze a věty známé jen
        z titulků nepublikujeme.{' '}
        <Link href="/jak-hodnotime" className="underline">
          Jak hodnotíme
        </Link>
      </p>
    </div>
  )
}
