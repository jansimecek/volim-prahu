'use client'

import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { PrepinacRazeni } from '@/components/PrepinacRazeni'
import { sPoctem } from '@/lib/cestina'
import {
  POPISEK_RAZENI,
  VYSVETLENI_RAZENI,
  dostupneKlice,
  serad,
  type KlicRazeni,
  type PolozkaKRazeni,
} from '@/lib/razeni'

export type PolozkaSeznamu = PolozkaKRazeni & {
  /** Hotový výstup ze serveru. Klient ho jen přerovnává, nesahá do něj. */
  obsah: ReactNode
}

/**
 * Výpis subjektů s přepínačem řazení.
 *
 * Položky se renderují na serveru a sem přicházejí jako neprůhledné uzly —
 * klient rozhoduje jen o pořadí. Díky tomu vypadá stránka bez JavaScriptu
 * stejně jako s ním, jen bez možnosti přepnout: výchozí abecední pořadí se
 * vykreslí na serveru a je to zároveň to pořadí, které nikoho nezvýhodňuje.
 */
export function RazenySeznam({
  polozky,
  tridaSeznamu,
  popisSeznamu,
  pruzkumPuvod,
  pruzkumOdkaz,
  duvodBezPruzkumu,
  zdrojeDuvodu,
  jednotka = ['položka', 'položky', 'položek'],
}: {
  polozky: PolozkaSeznamu[]
  tridaSeznamu: string
  /** Popis pro odečítač obrazovky, např. „Kandidující subjekty“. */
  popisSeznamu: string
  /**
   * Odkud čísla průzkumu pocházejí. Vyplňuje se vždy, když nějaká procenta
   * přijdou — schéma průzkumu agenturu i zadavatele vyžaduje, takže
   * neatribuovaná čísla nemají jak vzniknout.
   */
  pruzkumPuvod?: string
  pruzkumOdkaz?: string
  /** Proč volba „podle průzkumu“ chybí. Zobrazí se, jen když opravdu chybí. */
  duvodBezPruzkumu?: string | null
  /** Zdroje k poznámce. Tvrzení o jmenovaném subjektu bez nich nepublikujeme. */
  zdrojeDuvodu?: { text: string; url: string }[]
  /** Tvary pro skloňování v oznámení pro odečítač: 1 / 2–4 / 5+. */
  jednotka?: [string, string, string]
}) {
  const klice = useMemo(() => dostupneKlice(polozky), [polozky])
  const [klic, setKlic] = useState<KlicRazeni>('abecedne')
  const serazene = useMemo(() => serad(polozky, klic), [polozky, klic])

  return (
    <div>
      <PrepinacRazeni klice={klice} klic={klic} naZmenu={setKlic} />

      {/* Každé pořadí něco tvrdí. Čtenář má u sebe mít napsané co. */}
      {klice.length > 1 && (
        <p className="mt-3 max-w-prose text-sm text-seda-uredni">
          {VYSVETLENI_RAZENI[klic]}
          {klic === 'pruzkum' && pruzkumPuvod && (
            <>
              {' '}
              Zdroj čísel: {pruzkumPuvod}
              {pruzkumOdkaz && (
                <>
                  {' · '}
                  <a href={pruzkumOdkaz} className="odkaz-akcent inline-block py-1" rel="noopener">
                    zveřejnění průzkumu
                  </a>
                </>
              )}
              .
            </>
          )}
        </p>
      )}

      {/* Změnu pořadí musí odečítač obrazovky oznámit, jinak se seznam „jen“ přeskládá. */}
      <p aria-live="polite" className="sr-only">
        {popisSeznamu}: {sPoctem(serazene.length, ...jednotka)}, seřazeno —{' '}
        {POPISEK_RAZENI[klic].toLowerCase()}.
      </p>

      <ul aria-label={popisSeznamu} className={tridaSeznamu}>
        {serazene.map((polozka) => (
          <Fragment key={polozka.slug}>{polozka.obsah}</Fragment>
        ))}
      </ul>

      {/* Chybějící volba se musí vysvětlit, ale patří pod výpis, ne nad něj —
          jinak čtenář čte odstavec o tom, co na stránce není, dřív než to,
          co na ní je. Sbalené, protože je to poznámka k metodě. */}
      {duvodBezPruzkumu && (
        <details className="mt-4 max-w-prose text-sm">
          <summary className="popisek-uredni cursor-pointer py-1">
            <span className="pl-1.5">Bez řazení podle průzkumu</span>
          </summary>
          <p className="mt-2 text-seda-uredni">{duvodBezPruzkumu}</p>
          {zdrojeDuvodu && zdrojeDuvodu.length > 0 && (
            <ul className="mt-2">
              {zdrojeDuvodu.map((z) => (
                <li key={z.url}>
                  <a href={z.url} className="odkaz-akcent inline-block py-1" rel="noopener">
                    {z.text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </details>
      )}
    </div>
  )
}
