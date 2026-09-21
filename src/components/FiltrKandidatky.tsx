'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { FiltrVeku } from '@/components/FiltrVeku'
import { MEZ_MLADEHO_KANDIDATA, lzeFiltrovatPodleVeku } from '@/lib/vekKandidata'

/**
 * Obal kandidátské tabulky s filtrem podle věku.
 *
 * Tabulka se celá renderuje na serveru a sem přichází jako jeden neprůhledný
 * uzel — klient rozhoduje jen o tom, jestli se mají schovat řádky označené
 * `data-mlady="ne"`. Řádky tak přes hranici neputují po jednom, zůstávají
 * tam, kde vznikly, a i číslování zůstává v `<td>` ze serveru: po zapnutí
 * filtru sedí pořadí dál na hlasovací lístek, řádky ubývají a čísla se
 * nepřečíslovávají.
 *
 * Samotné schování dělá CSS (`.jen-mladi-kandidati`). Bez JavaScriptu se
 * proto vykreslí celá listina — chybí filtr, ne obsah.
 */
export function FiltrKandidatky({
  mladych,
  celkem,
  children,
}: {
  /** Kolik řádků mez věku splňuje. */
  mladych: number
  /** Kolik řádků má tabulka celkem, včetně volných pozic po škrtnutí. */
  celkem: number
  children: ReactNode
}) {
  const [jenMladi, setJenMladi] = useState(false)

  const lzeFiltrovat = lzeFiltrovatPodleVeku(mladych, celkem)
  const ucinny = lzeFiltrovat && jenMladi

  return (
    <div>
      {/*
       * Bez filtru se nevykresluje ani oznámení — živá oblast, kterou nemá co
       * měnit, by odečítači jen přidala větu navíc.
       */}
      {lzeFiltrovat && (
        <>
          <FiltrVeku zapnuto={jenMladi} naZmenu={setJenMladi} pocet={mladych} />

          {/* Zúžení výpisu musí odečítač obrazovky oznámit, jinak se tabulka „jen“ zkrátí. */}
          <p aria-live="polite" className="sr-only">
            {ucinny
              ? `Výpis zúžen na kandidáty do ${MEZ_MLADEHO_KANDIDATA} let: ${mladych}.`
              : 'Zobrazen celý výpis kandidátů.'}
          </p>
        </>
      )}

      <div className={ucinny ? 'jen-mladi-kandidati' : undefined}>{children}</div>
    </div>
  )
}
