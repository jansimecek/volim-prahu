'use client'

import { useMemo, useState } from 'react'
import { PrepinacRazeni } from '@/components/PrepinacRazeni'
import { POPISEK_RAZENI, dostupneKlice, serad, type KlicRazeni } from '@/lib/razeni'
import { PosuvnaTabulka } from '@/components/PosuvnaTabulka'

export type RadekKandidata = {
  slug: string
  cislo: number | null
  jmeno: string
  prijmeni: string
  celeJmeno: string
  vek: number
  volebniStrana: string
  povolani: string
}

/**
 * Kandidáti do Senátu v jednom obvodu.
 *
 * Výchozí pořadí je tady jiné než u volebních stran: podle vylosovaného
 * čísla, protože přesně tak kandidáty uvidíte na hlasovacím lístku a podle
 * čísla se v Senátu volí. Abecední pořadí je druhá volba pro hledání
 * konkrétního jména.
 */
const POPISKY = { abecedne: 'Podle příjmení' } as const

export function KandidatiSenatu({ kandidati }: { kandidati: RadekKandidata[] }) {
  const polozky = useMemo(
    () =>
      kandidati.map((k) => ({
        ...k,
        // Abeceda u lidí znamená podle příjmení, ne podle křestního jména —
        // a přepínač se proto jmenuje „Podle příjmení", ne „Abecedně".
        nazev: `${k.prijmeni} ${k.jmeno}`,
        procenta: null,
      })),
    [kandidati],
  )

  /**
   * Klíče se odvozují z dat, ne natvrdo. Před losováním jsou všechna čísla
   * null a přepínač by se tvářil, že řadí podle něčeho, co ve sloupci není
   * — přesně tomu má `dostupneKlice` bránit.
   */
  const klice = useMemo<KlicRazeni[]>(() => {
    // Na hlasovacím lístku je pořadí podle čísla, takže má být první.
    return dostupneKlice(polozky).includes('cislo') ? ['cislo', 'abecedne'] : ['abecedne']
  }, [polozky])

  const [klic, setKlic] = useState<KlicRazeni>(klice[0]!)
  const ucinny = klice.includes(klic) ? klic : klice[0]!

  const serazeni = useMemo(() => serad(polozky, ucinny), [polozky, ucinny])

  return (
    <div>
      <PrepinacRazeni klice={klice} klic={ucinny} naZmenu={setKlic} popisky={POPISKY} />

      <p aria-live="polite" className="sr-only">
        Kandidáti do Senátu: {serazeni.length}, seřazeno —{' '}
        {(POPISKY[ucinny as keyof typeof POPISKY] ?? POPISEK_RAZENI[ucinny]).toLowerCase()}.
      </p>

      <PosuvnaTabulka popisek="Kandidáti do Senátu" trida="mt-5">
        <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-inkoust">
              <th className="popisek-uredni py-2 pr-3 text-right">#</th>
              <th className="popisek-uredni py-2 pr-3">Jméno</th>
              <th className="popisek-uredni py-2 pr-3 text-right">Věk</th>
              <th className="popisek-uredni py-2 pr-3">Navrhla</th>
              <th className="popisek-uredni py-2">Povolání</th>
            </tr>
          </thead>
          <tbody>
            {serazeni.map((k) => (
              <tr key={k.slug} className="border-b border-linka-silna align-top">
                <td className="py-2 pr-3 text-right font-mono">{k.cislo ?? '—'}</td>
                <td className="py-2 pr-3">{k.celeJmeno}</td>
                <td className="py-2 pr-3 text-right font-mono">{k.vek}</td>
                <td className="py-2 pr-3">{k.volebniStrana || '—'}</td>
                <td className="py-2">{k.povolani || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PosuvnaTabulka>
    </div>
  )
}
