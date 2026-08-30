import { pruzkumy } from '#content'
import { BlokPruzkumu } from '@/components/BlokPruzkumu'
import { datumCesky } from '@/lib/cestina'
import { procenta as formatProcent } from '@/lib/pruzkumy'

/**
 * Tabulka jednoho průzkumu. Používá se z MDX v rubrice Aktuálně.
 *
 * Prochází přes BlokPruzkumu, i když aktualita, ve které stojí, má vlastní
 * bránu moratoria. Je to schválně dvojitá pojistka: kdyby někdo zapomněl
 * u aktuality příznak `obsahujePruzkum`, tabulka se v zakázané lhůtě
 * i tak neukáže.
 *
 * S průzkumem jde vždycky, kdo ho dělal, kdy sbíral data a jak velký měl
 * vzorek. Číslo bez těchhle údajů je jen dojem.
 */
export function PruzkumTabulka({ id }: { id: string }) {
  const pruzkum = pruzkumy.pruzkumy.find((p) => p.id === id)
  if (!pruzkum) {
    throw new Error(`V content/pruzkumy.yaml chybí průzkum s id "${id}".`)
  }

  const serazene = [...pruzkum.vysledky].sort((a, b) => b.procenta - a.procenta)
  const nejvic = serazene[0]?.procenta ?? 100

  return (
    <BlokPruzkumu>
      <figure className="not-prose my-6 border border-inkoust p-4 sm:p-5">
        <figcaption className="mb-4">
          <p className="font-display font-semibold">
            {pruzkum.agentura} pro {pruzkum.zadavatel}
          </p>
          <p className="popisek-uredni mt-1">
            Sběr {datumCesky(pruzkum.sberOd)} – {datumCesky(pruzkum.sberDo)} ·{' '}
            {pruzkum.velikostVzorku} respondentů
          </p>
          <p className="mt-1 text-sm text-seda-uredni">{pruzkum.metoda}</p>
        </figcaption>

        <ul className="space-y-2">
          {serazene.map((v) => (
            <li key={v.subjekt} className="grid grid-cols-[9rem_3.5rem_1fr] items-center gap-3">
              <span className="text-sm">{v.subjekt}</span>
              <span className="text-right font-mono tabular-nums">
                {formatProcent(v.procenta)}
              </span>
              {/* Hodnota stojí vedle, pruh sám nenese informaci navíc. */}
              <span aria-hidden="true" className="block h-3 bg-papir-tmavsi">
                <span
                  className="block h-3 min-w-[3px] bg-inkoust"
                  style={{ width: `${(v.procenta / nejvic) * 100}%` }}
                />
              </span>
            </li>
          ))}
        </ul>

        {pruzkum.vyhrady && (
          <p className="mt-4 max-w-prose border-l-2 border-praha pl-4 text-sm">
            <span className="popisek-uredni block">Co k číslům patří</span>
            {pruzkum.vyhrady}
          </p>
        )}

        <p className="popisek-uredni mt-4">
          Zdroj:{' '}
          <a href={pruzkum.urlPrimarni ?? pruzkum.url} className="underline" rel="noopener">
            {pruzkum.urlPrimarni ? 'tisková zpráva agentury' : 'zveřejnění průzkumu'}
          </a>
        </p>
      </figure>
    </BlokPruzkumu>
  )
}
