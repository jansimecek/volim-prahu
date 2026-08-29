'use client'

import { useId } from 'react'
import { POPISEK_RAZENI, type KlicRazeni } from '@/lib/razeni'

/**
 * Přepínač pořadí výpisu.
 *
 * Přepínače jsou skutečné <input type="radio">, jen vizuálně skryté —
 * stav „vybráno" tak dostane odečítač obrazovky zadarmo a skupina se ovládá
 * šipkami jako každá jiná. Rámeček focusu se kreslí na štítek přes
 * has-[:focus-visible], protože samotný input vidět není.
 *
 * Svislé odsazení drží dotykový cíl nad 24 px podle WCAG 2.2 (2.5.8).
 */
export function PrepinacRazeni({
  klice,
  klic,
  naZmenu,
  popisek = 'Řadit',
  popisky,
}: {
  klice: readonly KlicRazeni[]
  klic: KlicRazeni
  naZmenu: (novy: KlicRazeni) => void
  popisek?: string
  /**
   * Přejmenování volby pro daný seznam. U lidí není „abecedně" dost přesné —
   * řadí se podle příjmení, zatímco ve sloupci stojí jméno s tituly zepředu,
   * takže by pořadí vypadalo náhodně.
   */
  popisky?: Partial<Record<KlicRazeni, string>>
}) {
  const skupina = useId()
  if (klice.length < 2) return null

  return (
    <fieldset className="mt-4 border-0 p-0">
      <legend className="popisek-uredni float-left mr-4 py-2">{popisek}</legend>
      <div className="flex flex-wrap gap-2">
        {klice.map((moznost) => (
          <label
            key={moznost}
            className={`cursor-pointer border px-3 py-2 font-mono text-drobne tracking-wider uppercase has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-praha ${
              klic === moznost
                ? 'border-inkoust bg-inkoust text-papir'
                : 'border-linka-silna text-seda-uredni hover:border-inkoust hover:text-inkoust'
            }`}
          >
            <input
              type="radio"
              name={skupina}
              value={moznost}
              checked={klic === moznost}
              onChange={() => naZmenu(moznost)}
              className="sr-only"
            />
            {popisky?.[moznost] ?? POPISEK_RAZENI[moznost]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
