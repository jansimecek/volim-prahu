import { Zpravicka } from '@/components/Zpravicka'
import { poDnech, type Zpravicka as Data } from '@/lib/zpravicky'

/**
 * Proud zpráviček seskupený po dnech.
 *
 * Datum se píše jednou nad skupinu, ne u každé položky — v den voleb jich
 * bude na jeden den několik a opakovaný datum by z toho udělal kaši.
 */
export function ProudZpravicek({ zpravicky }: { zpravicky: Data[] }) {
  const dny = poDnech(zpravicky)

  return (
    <div className="space-y-10">
      {dny.map((den) => (
        <section key={den.den} aria-labelledby={`den-${den.zpravicky[0]!.slug}`}>
          <h2
            id={`den-${den.zpravicky[0]!.slug}`}
            className="border-b-2 border-inkoust pb-1 font-display text-lg"
          >
            {den.den}
          </h2>
          {den.zpravicky.map((z) => (
            <Zpravicka key={z.slug} zpravicka={z} jenCas />
          ))}
        </section>
      ))}
    </div>
  )
}
