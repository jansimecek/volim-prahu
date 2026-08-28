import Link from 'next/link'
import { POPIS_REZIMU, rezimWebu } from '@/lib/rezim'

/**
 * Pruh nad obsahem, který říká, v jaké fázi voleb se čtenář nachází.
 * V archivním režimu je to nejdůležitější informace na stránce — bez ní
 * by web tvrdil věci v přítomném čase o volbách, které dávno proběhly.
 */
export function PruhRezimu() {
  const rezim = rezimWebu()
  const popis = POPIS_REZIMU[rezim]
  if (!popis) return null

  const archiv = rezim === 'archiv'

  return (
    <div className={`border-b ${archiv ? 'border-praha bg-papir-tmavsi' : 'border-linka'}`}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <span className={`popisek-uredni ${archiv ? 'text-praha' : ''}`}>
          {archiv ? 'Archiv' : 'Volby probíhají'}
        </span>
        <span className="max-w-prose">{popis}</span>
        {rezim !== 'pred-volbami' && (
          <Link href="/vysledky" className="odkaz-akcent">
            Výsledky
          </Link>
        )}
      </div>
    </div>
  )
}
