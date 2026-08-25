import { rozpocet } from '#content'

const STAV_POPIS: Record<string, string> = {
  schvaleny: 'schválený rozpočet',
  navrh: 'návrh rozpočtu',
  skutecnost: 'skutečnost',
  vyhled: 'střednědobý výhled',
}

export function RozpoctovyRamec() {
  const zdrojPodleId = new Map(rozpocet.zdroje.map((z) => [z.id, z]))

  return (
    <div className="space-y-14">
      {rozpocet.skupiny.map((skupina) => {
        const polozky = rozpocet.polozky.filter((p) => p.skupina === skupina.id)
        if (polozky.length === 0) return null

        return (
          <section key={skupina.id} id={skupina.id} className="scroll-mt-20">
            <h2 className="text-2xl">{skupina.nadpis}</h2>
            <p className="mt-1 max-w-prose text-sm text-seda-uredni">{skupina.popis}</p>

            <div className="mt-5 border-t border-inkoust">
              {polozky.map((polozka) => (
                <article key={polozka.id} id={polozka.id} className="border-b border-linka py-5 scroll-mt-20">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="font-display text-lg font-semibold">{polozka.nazev}</h3>
                    <p className="popisek-uredni">
                      {polozka.rok} · {STAV_POPIS[polozka.stav]}
                    </p>
                  </div>

                  <p className="mt-2 font-mono text-xl">{polozka.hodnota}</p>
                  <p className="mt-2 max-w-prose">{polozka.vysvetleni}</p>

                  {polozka.poznamka && (
                    <p className="mt-3 max-w-prose border-l-2 border-okr pl-4 text-sm">
                      <span className="popisek-uredni block">Výhrada k údaji</span>
                      {polozka.poznamka}
                    </p>
                  )}

                  <ul className="mt-3 space-y-0.5">
                    {polozka.opora.map((id) => {
                      const zdroj = zdrojPodleId.get(id)
                      if (!zdroj) return null
                      return (
                        <li key={id} className="text-sm">
                          <a href={zdroj.url} className="odkaz-akcent" rel="noopener">
                            {zdroj.nazev}
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )
      })}

      <section id="priklady-mc" className="scroll-mt-20">
        <h2 className="text-2xl">Rozpočty pěti městských částí</h2>
        <p className="mt-1 max-w-prose text-sm text-seda-uredni">
          Vzorek napříč velikostmi, ne úplný přehled. Ukazuje, jak moc se poměry na
          jednotlivých radnicích liší.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-inkoust">
                <th className="popisek-uredni py-2">Městská část</th>
                <th className="popisek-uredni py-2 text-right">Obyvatel</th>
                <th className="popisek-uredni py-2">Rozpočet 2026</th>
                <th className="popisek-uredni py-2">Z magistrátu</th>
                <th className="popisek-uredni py-2">Investice</th>
              </tr>
            </thead>
            <tbody>
              {rozpocet.mestskeCastiPriklady.map((mc) => (
                <tr key={mc.slug} className="border-b border-linka align-top">
                  <td className="py-2">
                    <a href={`/mestska-cast/${mc.slug}`} className="odkaz-akcent">
                      {mc.nazev}
                    </a>
                    {mc.stav === 'navrh' && (
                      <span className="popisek-uredni block">zatím jen návrh</span>
                    )}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {new Intl.NumberFormat('cs-CZ').format(mc.obyvatel)}
                  </td>
                  <td className="py-2 font-mono">{mc.rozpocet}</td>
                  <td className="py-2 font-mono">{mc.zMagistratu}</td>
                  <td className="py-2 font-mono">{mc.investice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
