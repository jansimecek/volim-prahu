import { type ClenRady, radaPodleSubjektu } from '@/lib/vyjednavani'

/**
 * Rada po stranách: kolik míst má který subjekt, kdo je zasedne a jaké
 * oblasti povede. Stejně pro zvolené vedení i pro ohlášenou, ještě
 * nezvolenou radu — rozdíl řekne nadpis a poznámka nad tím.
 */
export function RadaPodleStran({
  clenove,
  nazev,
  nadpis = 'h4',
}: {
  clenove: readonly ClenRady[]
  nazev: (slug: string) => string
  /** O úroveň níž než nadpis sekce, ve které rada stojí. */
  nadpis?: 'h3' | 'h4'
}) {
  const H = nadpis
  const skupiny = radaPodleSubjektu(clenove)
  return (
    <div className="grid gap-px border border-inkoust bg-linka-silna md:grid-cols-2">
      {skupiny.map((s) => {
        const oblasti = [...new Set(s.clenove.flatMap((c) => c.gesce))]
        return (
          <section key={s.subjekt} className="bg-papir p-4 md:odd:last:col-span-2">
            <H className="font-display text-lg font-medium">
              {nazev(s.subjekt)}{' '}
              <span className="popisek-uredni">
                · {s.clenove.length} {s.clenove.length === 1 ? 'místo' : s.clenove.length < 5 ? 'místa' : 'míst'}
              </span>
            </H>
            {oblasti.length > 0 && <p className="mt-1 text-sm">{oblasti.join(', ')}</p>}
            <ul className="mt-3 space-y-2">
              {s.clenove.map((c) => (
                <li key={`${c.funkce}-${c.jmeno}`}>
                  <span className="font-medium">{c.jmeno}</span>{' '}
                  <span className="popisek-uredni">{c.funkce}</span>
                  {c.gesce.length > 0 && <span className="block text-sm">{c.gesce.join(', ')}</span>}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
