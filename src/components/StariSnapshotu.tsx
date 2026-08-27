'use client'

import { useEffect, useState } from 'react'
import { PRAH_ZASTARALOSTI_MINUT, stariMinut } from '@/lib/cerstvost'

/**
 * Relativní stáří se musí počítat v prohlížeči. Kdyby ho vykreslil server,
 * zapeklo by se do ISR cache a čtenář by po delší odmlce viděl „před 2 min“
 * u dat starých hodinu — bez varovného proužku.
 */
export function StariSnapshotu({ stazeno }: { stazeno: string }) {
  const [minut, setMinut] = useState<number | null>(null)

  useEffect(() => {
    const spocitej = () => {
      const m = stariMinut({ stazeno })
      setMinut(Number.isFinite(m) ? m : null)
    }
    spocitej()
    const timer = setInterval(spocitej, 30_000)
    return () => clearInterval(timer)
  }, [stazeno])

  if (minut === null) return null

  return (
    <>
      <span className="popisek-uredni ml-2">před {minut} min</span>
      {minut > PRAH_ZASTARALOSTI_MINUT && (
        <p className="mt-2 text-praha">
          Data jsou starší než {PRAH_ZASTARALOSTI_MINUT} minut. Buď se sčítání nehýbe,
          nebo se nám nedaří stahovat z ČSÚ — ukazujeme poslední údaje, které máme.
        </p>
      )}
    </>
  )
}
