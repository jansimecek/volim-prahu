/**
 * Vygeneruje obsahový skelet pro všech 57 městských částí z číselníku ČSÚ.
 *
 *   pnpm gen:mc
 *
 * Existující soubory nepřepisuje — ručně dopsaný text je vždycky cennější než
 * šablona. Přidá jen ty, které chybí (například po vzniku nové MČ v číselníku).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KOREN = join(__dirname, '..')
const CILOVY_ADRESAR = join(KOREN, 'content/mestske-casti')

type Zastupitelstvo = {
  kod: string
  nazev: string
  slug: string
  jeMagistrat: boolean
  mandaty: number
  okrskyCelkem: number
  pocetObyvatel: number
}

const ciselnik = JSON.parse(
  readFileSync(join(KOREN, 'data/ciselniky/zastupitelstva.json'), 'utf8'),
) as { sada: string; zastupitelstva: Zastupitelstvo[] }

function sablona(z: Zastupitelstvo): string {
  return `---
nazev: ${z.nazev}
slug: ${z.slug}
kodZastupitelstva: "${z.kod}"
mandaty: ${z.mandaty}
okrsky: ${z.okrskyCelkem}
temata: []
publikovano: false
---

Do zastupitelstva ${z.nazev} se volí **${z.mandaty} zastupitelů** v ${pocetOkrsku(z.okrskyCelkem)}.

{/*
  Co sem patří, než se stránka označí jako publikovaná (publikovano: true):

  1. Dvě až tři věty o tom, co tahle městská část ve skutečnosti rozhoduje —
     tedy čím se liší od magistrátu. Právě tohle voliči nevědí.
  2. 2–4 klíčová lokální témata do frontmatteru \`temata\` (nadpis + text).
  3. Odkaz na úřad do pole \`urad\`.
  4. Složení koalice po roce 2022 do pole \`koalice2022\`.

  Údaje o mandátech a okrscích jsou z číselníku ČSÚ (sada ${ciselnik.sada}) — needitovat ručně,
  přepíše je \`pnpm import:csu\`.
*/}
`
}

function pocetOkrsku(n: number): string {
  return n === 1 ? 'jednom volebním okrsku' : `${n} volebních okrscích`
}

mkdirSync(CILOVY_ADRESAR, { recursive: true })

let vytvoreno = 0
let preskoceno = 0

for (const z of ciselnik.zastupitelstva) {
  if (z.jeMagistrat) continue // magistrát má vlastní sekci /praha, ne stránku MČ
  const cesta = join(CILOVY_ADRESAR, `${z.slug}.mdx`)
  if (existsSync(cesta)) {
    preskoceno++
    continue
  }
  writeFileSync(cesta, sablona(z))
  vytvoreno++
}

console.log(
  `Skelety městských částí: ${vytvoreno} vytvořeno, ${preskoceno} ponecháno beze změny.`,
)
