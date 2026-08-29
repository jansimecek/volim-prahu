import { plneni } from '#content'
import { POPIS_KATEGORIE, POPIS_STAVU, type StavPlneni } from '@/lib/plneni'

/** Pořadí sekcí odpovídá infografice, aby proklik ze shrnutí nepřeskakoval. */
const PORADI_KATEGORII = Object.keys(POPIS_KATEGORIE) as (keyof typeof POPIS_KATEGORIE)[]

export function PlneniProhlaseni() {
  const { mereni, zavazky, dokument } = plneni
  const podil = (n: number) => Math.round((n / mereni.zavazkuCelkem) * 100)
  const serazene = [...zavazky].sort(
    (a, b) =>
      PORADI_KATEGORII.indexOf(a.kategorie as keyof typeof POPIS_KATEGORIE) -
      PORADI_KATEGORII.indexOf(b.kategorie as keyof typeof POPIS_KATEGORIE),
  )

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-2xl">Jak jsme k číslům došli</h2>
        <dl className="mt-5 grid grid-cols-2 gap-px border border-inkoust bg-linka-silna sm:grid-cols-4">
          <Udaj popisek="Závazků celkem" hodnota={String(mereni.zavazkuCelkem)} />
          <Udaj
            popisek="Obsahuje číslici"
            hodnota={`${mereni.sJakymkoliCislem}`}
            doplnek={`${podil(mereni.sJakymkoliCislem)} %`}
          />
          <Udaj
            popisek="Obsahuje letopočet"
            hodnota={`${mereni.sLetopoctem}`}
            doplnek={`${podil(mereni.sLetopoctem)} %`}
          />
          <Udaj
            popisek="Má měřitelný cíl"
            hodnota={`${mereni.sKonkretnimCilem}`}
            doplnek={`${podil(mereni.sKonkretnimCilem)} %`}
          />
        </dl>

        <div className="mt-5 max-w-prose border-l-2 border-linka-silna pl-4">
          <h3 className="popisek-uredni">Jak jsme počítali</h3>
          <p className="mt-1 text-sm">{mereni.metoda}</p>
          <p className="mt-2 text-sm">
            Zdroj:{' '}
            <a href={dokument.url} className="odkaz-akcent inline-block py-1" rel="noopener">
              {dokument.nazev}
            </a>{' '}
            ({dokument.stran} stran)
          </p>
        </div>
      </section>

      <section>
        <h2 id="zavazky" className="text-2xl">
          Devět měřitelných závazků
        </h2>
        <p className="mt-1 max-w-prose text-sm text-seda-uredni">
          Zbylých {mereni.zavazkuCelkem - mereni.sKonkretnimCilem} závazků neuvádí
          číslo ani termín, takže se u nich nedá objektivně určit, zda byly splněny.
          Výsledky jsme naposledy ověřovali 29. srpna 2026.
        </p>

        <div className="mt-6 border-t border-inkoust">
          {serazene.map((zavazek) => {
            const stav = POPIS_STAVU[zavazek.stav as StavPlneni]
            return (
              <article
                key={zavazek.id}
                id={zavazek.id}
                /* Barevný pruh drží stav vidět i po prokliku z infografiky. */
                className={`scroll-mt-20 border-b border-l-4 border-b-linka-silna py-5 pl-4 ${stav.pruh}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <p className="popisek-uredni">
                    {zavazek.oblast} · {POPIS_KATEGORIE[zavazek.kategorie as keyof typeof POPIS_KATEGORIE]}
                  </p>
                  <p className={`razitko-hodnota ${stav.trida}`}>
                    <span className="znacka" aria-hidden="true">
                      {stav.znacka}
                    </span>
                    <span>{stav.nazev}</span>
                  </p>
                </div>

                <blockquote className="mt-2 max-w-prose border-l-2 border-linka-silna pl-4">
                  {`„${zavazek.zneni}“`}
                </blockquote>

                <p className="mt-3 max-w-prose text-sm">{zavazek.vysledek}</p>

                <ul className="mt-2">
                  {zavazek.zdroje.map((z) => (
                    <li key={z.url} className="text-sm">
                      <a href={z.url} className="odkaz-akcent inline-block py-1" rel="noopener">
                        {z.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Udaj({
  popisek,
  hodnota,
  doplnek,
}: {
  popisek: string
  hodnota: string
  doplnek?: string
}) {
  return (
    <div className="bg-papir p-3">
      <dt className="popisek-uredni">{popisek}</dt>
      <dd className="mt-1 font-mono text-lg">
        {hodnota}
        {doplnek && <span className="ml-2 text-sm text-seda-uredni">{doplnek}</span>}
      </dd>
    </div>
  )
}
