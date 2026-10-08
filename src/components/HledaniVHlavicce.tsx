'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Hledani, Lupa } from '@/components/Hledani'

/**
 * Hledání dostupné z každé stránky.
 *
 * Dřív bylo jen jako desátá položka menu — na telefonu tedy dvě klepnutí
 * a přechod na jinou stránku, než šlo začít psát. Teď je to tlačítko
 * v hlavičce, které otevře okno s polem rovnou zaměřeným.
 *
 * Bez JavaScriptu je to obyčejný odkaz na /hledani; skript ho jen přebere.
 * Okno je nativní `<dialog>` otevřený přes `showModal()`, takže past na
 * focus, Escape a skrytí zbytku stránky před odečítačem dělá prohlížeč.
 *
 * Na klávesnici se otevírá lomítkem jako na GitHubu nebo YouTube
 * a Ctrl/⌘+K — ale ne, když čtenář zrovna píše do jiného pole.
 */
export function HledaniVHlavicce() {
  const okno = useRef<HTMLDialogElement>(null)
  const [otevreno, setOtevreno] = useState(false)
  const cesta = usePathname()

  function otevri() {
    okno.current?.showModal()
    setOtevreno(true)
  }

  function zavri() {
    okno.current?.close()
  }

  useEffect(() => {
    const naKlavesu = (e: KeyboardEvent) => {
      const cil = e.target as HTMLElement | null
      const piseDoPole =
        cil?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(cil?.tagName ?? '')
      const zkratka =
        (e.key === '/' && !piseDoPole && !e.metaKey && !e.ctrlKey && !e.altKey) ||
        (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))
      if (!zkratka || okno.current?.open) return
      e.preventDefault()
      otevri()
    }
    document.addEventListener('keydown', naKlavesu)
    return () => document.removeEventListener('keydown', naKlavesu)
  }, [])

  // Na samotné stránce hledání by okno jen zdvojilo pole, které už je vidět.
  const naStranceHledani = cesta === '/hledani'

  return (
    <>
      <Link
        href="/hledani"
        onClick={(e) => {
          if (naStranceHledani) return
          // Nové okno nebo panel má dostat stránku, ne okno uvnitř téhle.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
          e.preventDefault()
          otevri()
        }}
        aria-haspopup="dialog"
        aria-current={naStranceHledani ? 'page' : undefined}
        // Na telefonu vedle menu, na desktopu až za přepínačem jazyků.
        className="odkaz-navigace flex min-h-11 items-center gap-2 sm:order-last sm:min-h-0"
      >
        <Lupa />
        Hledat
      </Link>

      <dialog
        ref={okno}
        aria-label="Hledat na webu"
        onClose={() => setOtevreno(false)}
        // Klepnutí na ztmavené pozadí zavírá. Klik uvnitř okna má cíl
        // v obsahu, takže sem dorazí jen klik přímo na <dialog>, tedy mimo něj.
        onClick={(e) => {
          if (e.target === e.currentTarget) zavri()
        }}
        className="okno-hledani"
      >
        <div className="flex items-center justify-between border-b border-inkoust px-4 py-2">
          <p className="popisek-uredni">Hledat na webu</p>
          <button
            type="button"
            onClick={zavri}
            className="odkaz-navigace flex min-h-11 items-center gap-2"
          >
            <span aria-hidden="true" className="text-base leading-none">
              ✕
            </span>
            Zavřít
          </button>
        </div>
        <div className="px-4 pt-4 pb-8">
          {/* Komponenta se připojí až s otevřením: autofocus pak padne do pole
              a každé otevření začíná s prázdným dotazem. */}
          {otevreno && <Hledani vOkne poVyberu={zavri} />}
        </div>
      </dialog>
    </>
  )
}
