import { senat } from '#content'
import type { SenatniObvod } from '#content'

/**
 * V roce 2026 se v Praze volí jen ve třech z deseti senátních obvodů. Pro
 * většinu městských částí je proto správná odpověď „senátní lístek nedostanete",
 * a to je informace, kterou volič jinde těžko hledá.
 */
export type SenatniStav =
  | { stav: 'voli'; obvod: SenatniObvod }
  | { stav: 'castecne'; obvod: SenatniObvod; popis: string }
  | { stav: 'nevoli' }

export function senatniStavMestskeCasti(slugMC: string): SenatniStav {
  for (const obvod of senat) {
    if (obvod.mestskeCasti.includes(slugMC)) return { stav: 'voli', obvod }
    const cast = obvod.mestskeCastiCastecne.find((c) => c.slug === slugMC)
    if (cast) return { stav: 'castecne', obvod, popis: cast.popis }
  }
  return { stav: 'nevoli' }
}

export const OBVODY = [...senat].sort((a, b) => a.cislo - b.cislo)

/** Kolik městských částí letos senátora volí, byť jen částí území. */
export function pocetDotcenychMC(): number {
  const slugy = new Set<string>()
  for (const obvod of senat) {
    obvod.mestskeCasti.forEach((s) => slugy.add(s))
    obvod.mestskeCastiCastecne.forEach((c) => slugy.add(c.slug))
  }
  return slugy.size
}
