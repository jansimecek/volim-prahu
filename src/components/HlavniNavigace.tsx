'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import type { Route } from 'next'
import { odstranJazyk } from '@/lib/jazyky'

/**
 * Hlavní navigace se stavem „jsem tady".
 *
 * Bez toho web neříkal, na které stránce čtenář je — což je u průvodce
 * o osmi rozcestích ta nejlevnější orientační pomůcka, jakou lze mít.
 * Stav se nese atributem aria-current i podtržením, ne jen barvou.
 *
 * Na úzké obrazovce se položky schovávají za tlačítko. Deset odkazů
 * v mono verzálkách zabíralo na telefonu tři řádky a s přepínačem jazyků
 * čtyři — tedy zhruba 40 % první obrazovky dřív, než začal obsah. Většina
 * návštěv přitom přijde z telefonu. Od `sm` výš je seznam vidět pořád
 * a tlačítko zmizí z DOMu i z přístupnostního stromu.
 */
export function HlavniNavigace({
  polozky,
  trida,
  popisek = 'Hlavní navigace',
  popisekTlacitka = 'Menu',
}: {
  polozky: readonly { href: Route; popisek: string }[]
  trida?: string
  /** Popisek navigace pro odečítač. V cizojazyčné verzi musí být v jejím jazyce. */
  popisek?: string
  /** Popisek rozbalovacího tlačítka na úzké obrazovce. */
  popisekTlacitka?: string
}) {
  const cesta = usePathname()
  const [otevreno, setOtevreno] = useState(false)
  const id = useId()

  // Escape zavírá stejně jako jinde v prohlížeči; bez toho je jediná cesta
  // ven trefit se zpátky na tlačítko.
  useEffect(() => {
    if (!otevreno) return
    const naKlavesu = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOtevreno(false)
    }
    document.addEventListener('keydown', naKlavesu)
    return () => document.removeEventListener('keydown', naKlavesu)
  }, [otevreno])

  return (
    <nav aria-label={popisek} className={trida}>
      <button
        type="button"
        onClick={() => setOtevreno((o) => !o)}
        aria-expanded={otevreno}
        aria-controls={id}
        className="odkaz-navigace flex items-center gap-2 sm:hidden"
      >
        <span aria-hidden="true" className="font-mono text-base leading-none">
          {otevreno ? '✕' : '☰'}
        </span>
        {popisekTlacitka}
      </button>

      <ul
        id={id}
        /*
         * Rozbalený seznam visí pod tlačítkem a drží se jeho levého okraje —
         * čte se to jako panel patřící k tlačítku, ne jako část hlavičky,
         * která se náhodou objevila. Svislá linka to říká i beze slov.
         * Od `sm` výš je z toho zase obyčejná vodorovná navigace.
         */
        className={`${
          otevreno ? 'flex' : 'hidden'
        } w-full flex-col border-s-2 border-linka-silna ps-4 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-5 sm:border-s-0 sm:ps-0`}
      >
        {polozky.map((polozka) => {
          // Rozcestník sekce se shoduje jen přesně, ostatní i na podstránkách:
          // z profilu strany má čtenář vidět, že je pořád v sekci Magistrát.
          // `/en`, `/uk` a `/sk` jsou rozcestníky svých sekcí stejně jako `/`.
          const jeRozcestnik = polozka.href === '/' || odstranJazyk(polozka.href) === ''
          const aktivni = jeRozcestnik
            ? cesta === polozka.href
            : cesta === polozka.href || cesta.startsWith(`${polozka.href}/`)

          return (
            <li key={polozka.href}>
              <Link
                href={polozka.href}
                aria-current={aktivni ? 'page' : undefined}
                // Zavřít při kliknutí, ne až po změně cesty: čtenář by se
                // jinak dostal na stránku zakrytou seznamem, kterým si ji
                // právě otevřel. A funguje to i u odkazu na tutéž stránku,
                // kde se cesta nezmění.
                onClick={() => setOtevreno(false)}
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
