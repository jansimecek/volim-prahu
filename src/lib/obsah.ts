import { mestskeCasti, stranky } from '#content'
import ciselnikJson from '#data/ciselniky/zastupitelstva.json'
import type { Zastupitelstvo } from './typy'

const ciselnik = ciselnikJson as { sada: string; stazeno: string; zastupitelstva: Zastupitelstvo[] }

export const SADA_CISELNIKU = ciselnik.sada
export const ZASTUPITELSTVA = ciselnik.zastupitelstva

export const MAGISTRAT = ZASTUPITELSTVA.find((z) => z.jeMagistrat)!

/** 57 městských částí, seřazených tak, jak je zvyklý číst Pražan: čísla, pak názvy. */
export const MESTSKE_CASTI = ZASTUPITELSTVA.filter((z) => !z.jeMagistrat).sort(porovnejMC)

function porovnejMC(a: Zastupitelstvo, b: Zastupitelstvo): number {
  const cisloA = cisloMC(a.nazev)
  const cisloB = cisloMC(b.nazev)
  if (cisloA !== null && cisloB !== null) return cisloA - cisloB
  if (cisloA !== null) return -1
  if (cisloB !== null) return 1
  return a.nazev.localeCompare(b.nazev, 'cs')
}

function cisloMC(nazev: string): number | null {
  const shoda = nazev.match(/^Praha (\d+)$/)
  return shoda?.[1] ? Number(shoda[1]) : null
}

export function mestskaCastPodleSlugu(slug: string) {
  return mestskeCasti.find((mc) => mc.slug === slug)
}

export function zastupitelstvoPodleSlugu(slug: string) {
  return ZASTUPITELSTVA.find((z) => z.slug === slug)
}

export function strankaPodleSlugu(slug: string) {
  const stranka = stranky.find((s) => s.slug === slug)
  if (!stranka) throw new Error(`Chybí obsah stránky content/stranky/${slug}.mdx`)
  return stranka
}

/** Existují kandidátky pro dané zastupitelstvo? Zatím ne — ČSÚ je nezveřejnil. */
export function maKandidatky(): boolean {
  return false
}

const formatCisla = new Intl.NumberFormat('cs-CZ')
export const cislo = (n: number) => formatCisla.format(n)
