import { slugify } from './slug'

export type Nadpis = { id: string; text: string; uroven: 2 | 3 }

/**
 * Nadpisy druhé úrovně ze surového MDX.
 *
 * Referenční stránky mají i devět sekcí a bez obsahu se v nich čtenář, který
 * přišel z vyhledávače na konkrétní dotaz, musí prorolovat. Identifikátory
 * se počítají stejnou funkcí jako v `mdx.tsx`, aby kotva a odkaz seděly.
 *
 * Nadpisy uvnitř bloků kódu se ignorují — `## ` na začátku řádku uvnitř
 * ```bloku``` není nadpis, ale komentář.
 */
export function nadpisyStranky(surovy: string): Nadpis[] {
  const nadpisy: Nadpis[] = []
  let vKodu = false

  for (const radek of surovy.split('\n')) {
    if (/^\s*```/.test(radek)) {
      vKodu = !vKodu
      continue
    }
    if (vKodu) continue

    const shoda = radek.match(/^(#{2})\s+(.+?)\s*$/)
    if (!shoda) continue

    // Markdownové zvýraznění a odkazy do obsahu nepatří, jen jejich text.
    const text = shoda[2]!
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*_`]/g, '')
      .trim()
    if (text) nadpisy.push({ id: slugify(text), text, uroven: 2 })
  }

  return nadpisy
}
