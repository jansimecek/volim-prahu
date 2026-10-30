'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Popisek k mapě městských částí. Mapa samotná se kreslí na serveru; tady se
 * jen čtou data-atributy části pod myší nebo s fokusem z klávesnice, takže se
 * do prohlížeče neposílá geometrie podruhé.
 */
type Popisek = { nazev: string; radky: string[]; x: number; y: number; sirka: number }

export function PopiskyMapy() {
  const [popisek, setPopisek] = useState<Popisek | null>(null)
  const ramec = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const kontejner = ramec.current?.parentElement
    if (!kontejner) return
    const cast = (e: Event) => (e.target as Element | null)?.closest<SVGAElement>('a[data-mc]')
    const ukaz = (el: SVGAElement, x: number, y: number) =>
      setPopisek({
        nazev: el.dataset.nazev ?? '',
        radky: (el.dataset.radky ?? '').split('\n'),
        x,
        y,
        sirka: kontejner.clientWidth,
      })

    const pohyb = (e: PointerEvent) => {
      const el = cast(e)
      if (!el) return setPopisek(null)
      const r = kontejner.getBoundingClientRect()
      ukaz(el, e.clientX - r.left, e.clientY - r.top)
    }
    const fokus = (e: FocusEvent) => {
      const el = cast(e)
      if (!el) return
      const r = kontejner.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      ukaz(el, b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top)
    }
    const pryc = () => setPopisek(null)
    kontejner.addEventListener('pointermove', pohyb)
    kontejner.addEventListener('pointerleave', pryc)
    kontejner.addEventListener('focusin', fokus)
    kontejner.addEventListener('focusout', pryc)
    return () => {
      kontejner.removeEventListener('pointermove', pohyb)
      kontejner.removeEventListener('pointerleave', pryc)
      kontejner.removeEventListener('focusin', fokus)
      kontejner.removeEventListener('focusout', pryc)
    }
  }, [])

  // V pravé polovině mapy se popisek otočí doleva, ať nepřetéká z okna.
  const vlevo = popisek !== null && popisek.x > popisek.sirka / 2
  return (
    <div ref={ramec} aria-hidden="true">
      {popisek && (
        <div
          className="pointer-events-none absolute z-10 w-64 max-w-[80%] border border-inkoust bg-papir p-3 text-sm shadow-sm"
          style={{
            top: popisek.y + 14,
            left: vlevo ? undefined : popisek.x + 14,
            right: vlevo ? popisek.sirka - popisek.x + 14 : undefined,
          }}
        >
          <p className="font-display font-semibold">{popisek.nazev}</p>
          {popisek.radky.map((r) => (
            <p key={r} className="mt-1">
              {r}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
