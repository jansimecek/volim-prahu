'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'

/**
 * Hlavní navigace se stavem „jsem tady".
 *
 * Bez toho web neříkal, na které stránce čtenář je — což je u průvodce
 * o osmi rozcestích ta nejlevnější orientační pomůcka, jakou lze mít.
 * Stav se nese atributem aria-current i podtržením, ne jen barvou.
 */
export function HlavniNavigace({
  polozky,
  trida,
  popisek = 'Hlavní navigace',
}: {
  polozky: readonly { href: Route; popisek: string }[]
  trida?: string
  /** Popisek navigace pro odečítač. V cizojazyčné verzi musí být v jejím jazyce. */
  popisek?: string
}) {
  const cesta = usePathname()

  return (
    <nav aria-label={popisek} className={trida}>
      <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-0">
        {polozky.map((polozka) => {
          // Rozcestník sekce se shoduje jen přesně, ostatní i na podstránkách:
          // z profilu strany má čtenář vidět, že je pořád v sekci Magistrát.
          // `/en` a `/uk` jsou rozcestníky svých sekcí stejně jako `/`.
          const jeRozcestnik = /^\/(en|uk)?$/.test(polozka.href)
          const aktivni = jeRozcestnik
            ? cesta === polozka.href
            : cesta === polozka.href || cesta.startsWith(`${polozka.href}/`)

          return (
            <li key={polozka.href}>
              <Link
                href={polozka.href}
                aria-current={aktivni ? 'page' : undefined}
                className="odkaz-navigace"
              >
                {polozka.popisek}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
