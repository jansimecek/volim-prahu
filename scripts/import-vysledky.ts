/**
 * Konečné výsledky voleb 2026 do repozitáře.
 *
 *   pnpm import:vysledky
 *
 * Po sečtení se výsledky už nemění, takže nemusí viset na Blob úložišti
 * volební noci. Uložený soubor čte /vysledky, stránky zastupitelstev
 * i kalkulačka koalic. Skript odmítne zapsat cokoli, co není sečtené celé.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { stahniVysledkyVolbyhned } from '../src/lib/vysledkyVolbyhned'

const KOREN = join(__dirname, '..')
const CIL = join(KOREN, 'data/vysledky/kv2026.json')

async function main() {
  const ciselnik = JSON.parse(
    readFileSync(join(KOREN, 'data/ciselniky/zastupitelstva.json'), 'utf8'),
  ) as { zastupitelstva: { kod: string; slug: string }[] }
  const slugPodleKodu = new Map(ciselnik.zastupitelstva.map((z) => [z.kod, z.slug]))

  const snapshot = await stahniVysledkyVolbyhned(slugPodleKodu)

  const nesectene = snapshot.zastupitelstva.filter(
    (z) => !z.spocteno || z.okrskyZpracovano !== z.okrskyCelkem,
  )
  if (nesectene.length > 0) {
    throw new Error(`Nesečteno: ${nesectene.map((z) => z.nazev).join(', ')}`)
  }
  const nesedi = snapshot.zastupitelstva.filter(
    (z) =>
      z.strany.reduce((n, s) => n + s.mandaty, 0) !== z.mandatuCelkem ||
      z.strany.some((s) => (s.zvoleni?.length ?? 0) !== s.mandaty),
  )
  if (nesedi.length > 0) {
    throw new Error(`Mandáty nebo zvolení nesedí: ${nesedi.map((z) => z.nazev).join(', ')}`)
  }

  mkdirSync(join(CIL, '..'), { recursive: true })
  writeFileSync(CIL, JSON.stringify(snapshot, null, 1) + '\n')
  console.log(`Uloženo ${snapshot.zastupitelstva.length} zastupitelstev, ČSÚ ${snapshot.generovano} → ${CIL}`)
}

main().catch((chyba) => {
  console.error(chyba)
  process.exit(1)
})
