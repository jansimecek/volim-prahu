import type { Metadata } from 'next'
import Link from 'next/link'
import { datumCesky } from '@/lib/cestina'
import {
  type Debata,
  debatyBezTerminu,
  denDebaty,
  overenoDebaty,
  rozdelDebaty,
  ucastniciDebaty,
} from '@/lib/debaty'

export const metadata: Metadata = {
  title: 'Debaty kandidátů na primátora',
  description:
    'Kdy a kde se v televizi, rozhlase a na webu utkají kandidáti na pražského primátora. Termíny podle ohlášení médií, u proběhlých debat odkaz na záznam.',
}

export default function StrankaDebat() {
  // Dělí se při vyřizování požadavku (layout revaliduje po 15 minutách),
  // ne při buildu — jinak by debata zůstala „nadcházející" až do dalšího nasazení.
  const { nadchazejici, probehle } = rozdelDebaty()
  const bezTerminu = debatyBezTerminu()

  return (
    <div className="space-y-10">
      <header className="max-w-prose">
        <p className="popisek-uredni">Před volbami</p>
        <h1 className="mt-2 text-4xl">Debaty kandidátů na primátora</h1>
        <p className="mt-4">
          Kdy a kde se utkají lídři pražských kandidátek ve velkých médiích. Termín, čas
          i složení uvádíme jen podle ohlášení pořadatele a u každé debaty na něj odkazujeme.
          Kde čas nebo účastníky pořadatel zatím nezveřejnil, píšeme to.
        </p>
        <p className="mt-3">
          Co kandidáti v debatách řekli, najdete doslovně na jejich profilech a na stránce{' '}
          <Link href="/koalice" className="odkaz-akcent">
            Kdo s kým po volbách
          </Link>
          .
        </p>
      </header>

      <section aria-labelledby="nadchazejici">
        <h2 id="nadchazejici" className="text-2xl">
          Nadcházející debaty
        </h2>
        {nadchazejici.length === 0 ? (
          <p className="mt-3 max-w-prose">Žádnou další ohlášenou debatu teď neznáme.</p>
        ) : (
          <SeznamDebat debaty={nadchazejici} />
        )}

        {bezTerminu.length > 0 && (
          <div className="mt-6 max-w-prose border-l-2 border-praha pl-5 text-sm">
            <p className="popisek-uredni">Ohlášené bez přesného termínu</p>
            <ul className="mt-2 space-y-2">
              {bezTerminu.map((d) => (
                <li key={d.poradatel}>
                  <strong>{d.poradatel}.</strong> {d.text}{' '}
                  <a href={d.zdroj.url} className="odkaz-akcent" rel="noopener">
                    Zdroj
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {probehle.length > 0 && (
        <section aria-labelledby="probehle">
          <h2 id="probehle" className="text-2xl">
            Proběhlé debaty
          </h2>
          <SeznamDebat debaty={probehle} probehle />
        </section>
      )}

      <footer className="border-t border-linka pt-6">
        <p className="popisek-uredni">
          Výpis není úplný, sledujeme velká celostátní a pražská média · ověřeno{' '}
          {datumCesky(overenoDebaty())}
        </p>
      </footer>
    </div>
  )
}

function SeznamDebat({ debaty, probehle = false }: { debaty: Debata[]; probehle?: boolean }) {
  // U proběhlé debaty chybějící údaj neznamená, že ho pořadatel „zatím" neoznámil,
  // jen že ho nemáme ověřený — a čas začátku už čtenáři k ničemu není.
  const bezCasu = probehle ? '' : ' · čas zatím neoznámen'
  const bezUcastniku = probehle ? 'Složení neuvádíme' : 'Složení pořadatel nezveřejnil'

  return (
    <div className="mt-3 border-t border-inkoust">
      {debaty.map((d) => {
        const ucastnici = ucastniciDebaty(d)
        return (
          <article key={d.id} id={d.id} className="scroll-mt-20 border-b border-linka-silna py-5">
            <p className="popisek-uredni">
              <time dateTime={d.datum.slice(0, 10)}>{denDebaty(d)}</time>
              {d.cas ? ` · ${d.cas}` : bezCasu} · {d.poradatel}
            </p>
            <h3 className="mt-2 text-xl">{d.nazev}</h3>
            <dl className="mt-2 grid max-w-prose gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-seda-uredni">Kde</dt>
              <dd>{d.kde ?? 'Zatím neoznámeno'}</dd>
              <dt className="text-seda-uredni">Kdo</dt>
              <dd>
                {ucastnici.length === 0
                  ? bezUcastniku
                  : ucastnici.map((u, i) => (
                      <span key={u.slug}>
                        {i > 0 && ', '}
                        <Link href={`/kandidat/${u.slug}`} className="odkaz-akcent">
                          {u.jmeno}
                        </Link>
                      </span>
                    ))}
              </dd>
              {d.moderuje && (
                <>
                  <dt className="text-seda-uredni">Moderuje</dt>
                  <dd>{d.moderuje}</dd>
                </>
              )}
              {d.verejnost && (
                <>
                  <dt className="text-seda-uredni">Osobně</dt>
                  <dd>{d.verejnost}</dd>
                </>
              )}
            </dl>
            {d.poznamka && <p className="mt-2 max-w-prose text-sm">{d.poznamka}</p>}
            <p className="mt-3 flex flex-wrap gap-x-5 text-sm">
              {d.zaznam && (
                <a href={d.zaznam} className="odkaz-akcent inline-block py-1" rel="noopener">
                  Záznam nebo článek o debatě
                </a>
              )}
              <a href={d.zdroj.url} className="odkaz-akcent inline-block py-1" rel="noopener">
                Zdroj: {d.zdroj.text}
              </a>
            </p>
          </article>
        )
      })}
    </div>
  )
}
