import Link from 'next/link'
import { POPIS_REZIMU, rezimWebu } from '@/lib/rezim'

/**
 * Pruh nad obsahem, který říká, v jaké fázi voleb se čtenář nachází.
 * Po volbách je to nejdůležitější informace na stránce — bez ní by
 * předvolební obsah tvrdil v přítomném čase věci o volbách, které proběhly.
 */
export function PruhRezimu() {
  const rezim = rezimWebu()
  const popis = POPIS_REZIMU[rezim]
  if (!popis) return null

  const poVolbach = rezim === 'vyjednavani'

  return (
    <div className={`border-b ${poVolbach ? 'border-praha bg-papir-tmavsi' : 'border-linka'}`}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <span className={`popisek-uredni ${poVolbach ? 'text-praha' : ''}`}>
          {poVolbach ? 'Po volbách' : 'Volby probíhají'}
        </span>
        <span className="max-w-prose">{popis}</span>
        {rezim !== 'pred-volbami' && (
          <span className="flex gap-4">
            <Link href="/vysledky" className="odkaz-akcent">
              Výsledky
            </Link>
            {poVolbach && (
              <Link href="/koalice" className="odkaz-akcent">
                Vyjednávání
              </Link>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
