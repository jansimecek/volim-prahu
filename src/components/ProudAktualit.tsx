import { Aktualita } from '@/components/Aktualita'
import { poDnech, type Aktualita as Data } from '@/lib/aktuality'

/**
 * Proud aktualit seskupený po dnech.
 *
 * Datum se píše jednou nad skupinu, ne u každé položky — v den voleb jich
 * bude na jeden den několik a opakovaný datum by z toho udělal kaši.
 */
export function ProudAktualit({ aktuality }: { aktuality: Data[] }) {
  const dny = poDnech(aktuality)

  return (
    <div className="space-y-10">
      {dny.map((den) => (
        <section key={den.den} aria-labelledby={`den-${den.aktuality[0]!.slug}`}>
          <h2
            id={`den-${den.aktuality[0]!.slug}`}
            className="border-b-2 border-inkoust pb-1 font-display text-lg"
          >
            {den.den}
          </h2>
          {den.aktuality.map((z) => (
            <Aktualita key={z.slug} aktualita={z} jenCas />
          ))}
        </section>
      ))}
    </div>
  )
}
