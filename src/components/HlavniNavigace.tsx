'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import type { Route } from 'next'
import { odstranJazyk } from '@/lib/jazyky'

type Polozka = { href: Route; popisek: string }

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
 *
 * Rozbalené menu na telefonu je panel přes obsah, ne pruh, který obsah
 * odsune: hlavička je přilepená k hornímu okraji, takže se menu otevírá
 * i z půlky dlouhé kandidátky a čtenář po zavření zůstane, kde byl.
 * Položky jsou ve dvou sloupcích s dotykovým cílem 44 px a pod nimi
 * `dalsi` — odkazy, které jinak žijí jen v patičce.
 */
export function HlavniNavigace({
  polozky,
  dalsi = [],
  trida,
  popisek = 'Hlavní navigace',
  popisekTlacitka = 'Menu',
  popisekDalsi = 'Další',
}: {
  polozky: readonly Polozka[]
  /** Doplňkové odkazy jen do rozbaleného menu na telefonu. */
  dalsi?: readonly Polozka[]
  trida?: string
  /** Popisek navigace pro odečítač. V cizojazyčné verzi musí být v jejím jazyce. */
  popisek?: string
  /** Popisek rozbalovacího tlačítka na úzké obrazovce. */
  popisekTlacitka?: string
  popisekDalsi?: string
}) {
  const cesta = usePathname()
  const [otevreno, setOtevreno] = useState(false)
  const id = useId()
  const obal = useRef<HTMLElement>(null)

  // Escape zavírá stejně jako jinde v prohlížeči; bez toho je jediná cesta
  // ven trefit se zpátky na tlačítko. Klepnutí mimo panel taky — panel
  // zakrývá obsah a čtenář čeká, že ho klepnutím vedle schová.
  useEffect(() => {
    if (!otevreno) return
    const naKlavesu = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOtevreno(false)
    }
    const naKlepnuti = (e: PointerEvent) => {
      if (!obal.current?.contains(e.target as Node)) setOtevreno(false)
    }
    document.addEventListener('keydown', naKlavesu)
    document.addEventListener('pointerdown', naKlepnuti)
    return () => {
      document.removeEventListener('keydown', naKlavesu)
      document.removeEventListener('pointerdown', naKlepnuti)
    }
  }, [otevreno])

  function jeAktivni(href: Route) {
    // Rozcestník sekce se shoduje jen přesně, ostatní i na podstránkách:
    // z profilu strany má čtenář vidět, že je pořád v sekci Magistrát.
    // `/en`, `/uk` a `/sk` jsou rozcestníky svých sekcí stejně jako `/`.
    const jeRozcestnik = href === '/' || odstranJazyk(href) === ''
    return jeRozcestnik ? cesta === href : cesta === href || cesta.startsWith(`${href}/`)
  }

  function odkaz(polozka: Polozka) {
    const aktivni = jeAktivni(polozka.href)
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
          className="odkaz-navigace odkaz-navigace-panel"
        >
          {polozka.popisek}
        </Link>
      </li>
    )
  }

  return (
    <nav ref={obal} aria-label={popisek} className={trida}>
      <button
        type="button"
        onClick={() => setOtevreno((o) => !o)}
        aria-expanded={otevreno}
        aria-controls={id}
        className="odkaz-navigace flex min-h-11 items-center gap-2 sm:hidden"
      >
        <span aria-hidden="true" className="w-4 text-center font-mono text-base leading-none">
          {otevreno ? '✕' : '☰'}
        </span>
        {popisekTlacitka}
      </button>

      <div
        id={id}
        className={`${
          otevreno ? 'block' : 'hidden'
        } absolute inset-x-0 top-full max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-inkoust bg-papir px-4 pt-2 pb-5 shadow-[0_12px_24px_-12px_rgb(22_28_36/0.35)] sm:static sm:block sm:max-h-none sm:overflow-visible sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}
      >
        <ul className="grid grid-cols-2 gap-x-4 sm:flex sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-5">
          {polozky.map(odkaz)}
        </ul>
        {dalsi.length > 0 && (
          <div className="mt-4 border-t border-linka pt-3 sm:hidden">
            <p className="popisek-uredni">{popisekDalsi}</p>
            <ul className="mt-1 grid grid-cols-2 gap-x-4">{dalsi.map(odkaz)}</ul>
          </div>
        )}
      </div>
    </nav>
  )
}
