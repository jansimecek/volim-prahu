import { plneni } from '#content'

type Stav = (typeof plneni.zavazky)[number]['stav']

const POPIS_STAVU: Record<Stav, { nazev: string; trida: string; znacka: string }> = {
  splneno: { nazev: 'Doloženo jako splněné', trida: 'razitko-prima', znacka: '●' },
  castecne: { nazev: 'Doloženo částečně', trida: 'razitko-stredni', znacka: '◐' },
  nesplneno: { nazev: 'Doloženo jako nesplněné', trida: 'razitko-prekazka', znacka: '○' },
  'bez-dokladu': { nazev: 'Výsledek nedohledán', trida: 'razitko-nezname', znacka: '–' },
}

const POPIS_KATEGORIE: Record<string, string> = {
  'v-realizaci': 'V realizaci',
  pripravovane: 'Připravované',
  vyhled: 'Výhled',
}

export function PlneniProhlaseni() {
  const { mereni, zavazky, dokument } = plneni
  const podil = (n: number) => Math.round((n / mereni.zavazkuCelkem) * 100)

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-2xl">Kolik z prohlášení jde ověřit</h2>
        <dl className="mt-5 grid grid-cols-2 gap-px border border-inkoust bg-linka sm:grid-cols-4">
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

        <div className="mt-5 max-w-prose border-l-2 border-linka pl-4">
          <h3 className="popisek-uredni">Jak jsme počítali</h3>
          <p className="mt-1 text-sm">{mereni.metoda}</p>
          <p className="mt-2 text-sm">
            Zdroj:{' '}
            <a href={dokument.url} className="odkaz-akcent" rel="noopener">
              {dokument.nazev}
            </a>{' '}
            ({dokument.stran} stran)
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl">Devět měřitelných závazků</h2>
        <p className="mt-1 max-w-prose text-sm text-seda-uredni">
          Zbylých {mereni.zavazkuCelkem - mereni.sKonkretnimCilem} závazků neuvádí
          číslo ani termín, takže se u nich nedá objektivně určit, zda byly splněny.
        </p>

        <div className="mt-6 border-t border-inkoust">
          {zavazky.map((zavazek) => {
            const stav = POPIS_STAVU[zavazek.stav]
            return (
              <article key={zavazek.id} id={zavazek.id} className="border-b border-linka py-5 scroll-mt-20">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <p className="popisek-uredni">
                    {zavazek.oblast} · {POPIS_KATEGORIE[zavazek.kategorie]}
                  </p>
                  <p className={`razitko-hodnota ${stav.trida}`}>
                    <span className="znacka" aria-hidden="true">
                      {stav.znacka}
                    </span>
                    <span>{stav.nazev}</span>
                  </p>
                </div>

                <blockquote className="mt-2 max-w-prose border-l-2 border-linka pl-4">
                  {`„${zavazek.zneni}“`}
                </blockquote>

                <p className="mt-3 max-w-prose text-sm">{zavazek.vysledek}</p>

                <ul className="mt-2 space-y-0.5">
                  {zavazek.zdroje.map((z) => (
                    <li key={z.url} className="text-sm">
                      <a href={z.url} className="odkaz-akcent" rel="noopener">
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
