import { vyroky } from '#content'

const POPIS_TYPU: Record<string, string> = {
  redakcni: '',
  'tiskova-zprava': 'tisková zpráva subjektu, ne novinářský text',
  'stranicky-web': 'text na webu strany, ne nezávislé médium',
}

import { datumCesky } from '@/lib/cestina'

export function VyrokyOsoby({ osobaSlug }: { osobaSlug: string }) {
  const osoba = vyroky.osoby.find((o) => o.osobaSlug === osobaSlug)
  if (!osoba) return null

  const zdrojPodleId = new Map(vyroky.zdroje.map((z) => [z.id, z]))

  if (osoba.vyroky.length === 0) {
    return (
      <section className="max-w-prose border-t border-linka pt-6">
        <h2 className="text-2xl">Výroky v médiích</h2>
        <p className="mt-3">
          K tématům pražské samosprávy jsme u téhle osoby nedohledali žádný doložitelný
          veřejný výrok. {osoba.poznamka}
        </p>
        <p className="mt-3 text-sm text-seda-uredni">
          Neznamená to, že žádný neexistuje — jen ho nemáme doložený. Publikujeme
          výhradně doslovné citace s uvedeným zdrojem a datem.
        </p>
      </section>
    )
  }

  return (
    <section className="border-t border-linka pt-6">
      <h2 className="text-2xl">Výroky v médiích</h2>
      <p className="mt-1 max-w-prose text-sm text-seda-uredni">
        Doslovné citace k tématům, o kterých rozhoduje pražská samospráva. Nic
        neshrnujeme vlastními slovy a nic nehodnotíme — u každého výroku je zdroj
        a datum.
      </p>

      <div className="mt-6 border-t border-inkoust">
        {osoba.vyroky.map((v, i) => {
          const zdroj = zdrojPodleId.get(v.zdroj)
          return (
            <article key={i} className="border-b border-linka py-5">
              <p className="popisek-uredni">{v.tema}</p>
              <blockquote className="mt-2 max-w-prose border-l-2 border-inkoust pl-4 font-cteci text-lg">
                {`„${v.citace}“`}
                {v.pokracovani && (
                  <span className="text-seda-uredni">{` […${v.pokracovani}]`}</span>
                )}
              </blockquote>
              <p className="mt-2 max-w-prose text-sm">{v.kontext}</p>

              {v.poznamka && (
                <p className="mt-2 max-w-prose border-l-2 border-okr pl-4 text-sm">
                  <span className="popisek-uredni block">Poznámka redakce</span>
                  {v.poznamka}
                </p>
              )}

              {zdroj && (
                <p className="popisek-uredni mt-3">
                  <a href={zdroj.url} className="underline" rel="noopener nofollow">
                    {zdroj.medium}
                  </a>
                  , {datumCesky(zdroj.datum)}
                  {POPIS_TYPU[zdroj.typ] ? ` · ${POPIS_TYPU[zdroj.typ]}` : ''}
                </p>
              )}
            </article>
          )
        })}
      </div>

      {osoba.poznamka && (
        <p className="mt-5 max-w-prose border-l-2 border-linka pl-4 text-sm">
          <span className="popisek-uredni block">Co jsme nepublikovali</span>
          {osoba.poznamka}
        </p>
      )}
    </section>
  )
}
