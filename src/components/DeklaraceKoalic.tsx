import Link from 'next/link'
import { koalice, strany, type Koalice } from '#content'
import { datumCesky } from '@/lib/cestina'

type Deklarace = Koalice['deklarace'][number]

/**
 * U lídra kandidátky je funkce už v poli `kdo`, i ve správném rodě, takže se
 * neopakuje. Úroveň se vypisuje tam, kde něco dodává — hlavně u celostátních
 * vedení, která za pražskou kandidátku nemluví.
 */
const POPIS_UROVNE: Record<Deklarace['uroven'], string> = {
  'prazska-organizace': 'pražská organizace',
  'lidr-kandidatky': '',
  'celostatni-vedeni': 'celostátní vedení strany',
}

/**
 * Jak je vyjádření doložené, jde ven vždycky a dřív než jeho obsah. Parafráze
 * médií a usnesení strany vypadají vysázené stejně, ale čtenář z nich smí
 * vyvozovat úplně jiné věci.
 */
const POPIS_DOKLADU: Record<Deklarace['doklad'], string> = {
  usneseni: 'usnesení strany',
  citace: 'doslovná citace',
  parafraze: 'parafráze médií',
}

/**
 * Doložená vyjádření o povolební spolupráci, po subjektech.
 *
 * Subjekty bez vyjádření jsou vypsané na konci jmenovitě. Mlčení musí být
 * vidět — jinak by přehled vypadal úplnější, než je, a čtenář by z chybějícího
 * řádku vyvozoval, že subjekt s nikým problém nemá.
 */
export function DeklaraceKoalic() {
  const magistrat = strany.filter((s) => s.uroven === 'magistrat')
  const zkratka = (slug: string) => magistrat.find((s) => s.slug === slug)?.zkratka ?? slug
  const zdrojPodleId = new Map(koalice.zdroje.map((z) => [z.id, z]))
  const cesky = (a: string, b: string) => zkratka(a).localeCompare(zkratka(b), 'cs')

  const sVyjadrenim = [...new Set(koalice.deklarace.map((d) => d.subjekt))].sort(cesky)
  const bezVyjadreni = magistrat
    .filter((s) => !sVyjadrenim.includes(s.slug))
    .sort((a, b) => a.zkratka.localeCompare(b.zkratka, 'cs'))

  return (
    <section aria-labelledby="deklarace" className="space-y-6">
      <div className="max-w-prose">
        <h2 id="deklarace" className="scroll-mt-20 text-2xl">
          Kdo koho vyloučil
        </h2>
        <p className="mt-3">
          U každého vyjádření je, kdo ho řekl, kdy, jak je doložené a odkaz na zdroj. Vyjádření
          celostátních vedení stran jsou výslovně označená — nemluví za ně lídři pražských kandidátek.
        </p>
      </div>

      {sVyjadrenim.map((subjekt) => (
        <div key={subjekt} className="border-t border-inkoust pt-4">
          <h3 className="text-xl">
            <Link href={`/praha/strana/${subjekt}`} className="no-underline">
              {zkratka(subjekt)}
            </Link>
          </h3>

          {koalice.deklarace
            .filter((d) => d.subjekt === subjekt)
            .sort((a, b) => b.datum.localeCompare(a.datum))
            .map((d) => (
              <article
                key={d.id}
                id={`deklarace-${d.id}`}
                className="scroll-mt-20 border-b border-linka-silna py-4 last:border-b-0"
              >
                <p className="popisek-uredni">
                  {[d.kdo, POPIS_UROVNE[d.uroven], datumCesky(d.datum), POPIS_DOKLADU[d.doklad]]
                    .filter(Boolean)
                    .join(' · ')}
                </p>

                {d.citace && (
                  <blockquote className="mt-2 max-w-prose border-l-2 border-inkoust pl-4 font-cteci text-lg">
                    {`„${d.citace}“`}
                  </blockquote>
                )}

                <p className="mt-2 max-w-prose">{d.shrnuti}</p>

                {(d.vylucuje.length > 0 || d.pripousti.length > 0) && (
                  <dl className="mt-2 grid max-w-prose gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                    {d.vylucuje.length > 0 && (
                      <>
                        <dt className="popisek-uredni">Vylučuje</dt>
                        <dd>{d.vylucuje.map(zkratka).join(', ')}</dd>
                      </>
                    )}
                    {d.pripousti.length > 0 && (
                      <>
                        <dt className="popisek-uredni">Výslovně nevylučuje</dt>
                        <dd>{d.pripousti.map(zkratka).join(', ')}</dd>
                      </>
                    )}
                  </dl>
                )}

                {d.poznamka && (
                  <p className="mt-2 max-w-prose border-l-2 border-okr pl-4 text-sm">
                    <span className="popisek-uredni block">Poznámka redakce</span>
                    {d.poznamka}
                  </p>
                )}

                <p className="popisek-uredni mt-3">
                  {d.zdroje.map((id, i) => {
                    const zdroj = zdrojPodleId.get(id)
                    if (!zdroj) return null
                    return (
                      <span key={id}>
                        {i > 0 && ' · '}
                        <a href={zdroj.url} className="underline" rel="noopener nofollow">
                          {zdroj.medium}
                        </a>
                        , {datumCesky(zdroj.datum)}
                      </span>
                    )
                  })}
                </p>
              </article>
            ))}
        </div>
      ))}

      <p className="max-w-prose border-t border-inkoust pt-4 text-sm text-seda-uredni">
        Bez doloženého vyjádření o povolební spolupráci:{' '}
        {bezVyjadreni.map((s) => s.zkratka).join(', ')}. Neznamená to, že spolupráci s někým
        vylučují ani že ji nabízejí — jen že jsme jejich veřejné vyjádření nedohledali nebo
        neověřili.
      </p>
    </section>
  )
}
