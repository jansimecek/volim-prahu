'use client'

import { sPoctem } from '@/lib/cestina'
import { MEZ_MLADEHO_KANDIDATA } from '@/lib/vekKandidata'

/**
 * Filtr výpisu na kandidáty pod mezí věku.
 *
 * Vzhledem i chováním se drží přepínače řazení: skutečný `<input>`, jen
 * vizuálně skrytý, takže stav „zaškrtnuto" dostane odečítač obrazovky
 * zadarmo a rámeček focusu se kreslí na štítek přes `has-[:focus-visible]`.
 * Zaškrtávátko schválně není přepínač se dvěma volbami — má jen jeden stav
 * navíc k výchozímu, a tím je výchozím stavem celá listina.
 *
 * Počet je ve štítku napevno, ne v živé oblasti: čtenář tak ví, kolik řádků
 * mu filtr nechá, ještě než ho zapne.
 *
 * Svislé odsazení drží dotykový cíl nad 24 px podle WCAG 2.2 (2.5.8).
 */
export function FiltrVeku({
  zapnuto,
  naZmenu,
  pocet,
}: {
  zapnuto: boolean
  naZmenu: (novy: boolean) => void
  /** Kolik kandidátů mez splňuje. Nula sem nemá chodit — filtr by neměl co ukázat. */
  pocet: number
}) {
  return (
    <fieldset className="mt-4 border-0 p-0">
      <legend className="popisek-uredni float-left mr-4 py-2">Filtr</legend>
      <div className="flex flex-wrap gap-2">
        <label
          className={`cursor-pointer border px-3 py-2 font-mono text-drobne tracking-wider uppercase has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-praha ${
            zapnuto
              ? 'border-inkoust bg-inkoust text-papir'
              : 'border-linka-silna text-seda-uredni hover:border-inkoust hover:text-inkoust'
          }`}
        >
          <input
            type="checkbox"
            checked={zapnuto}
            onChange={(e) => naZmenu(e.target.checked)}
            className="sr-only"
          />
          Jen do {MEZ_MLADEHO_KANDIDATA} let ({sPoctem(pocet, 'kandidát', 'kandidáti', 'kandidátů')}
          )
        </label>
      </div>
    </fieldset>
  )
}
