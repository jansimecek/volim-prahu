/**
 * Nácvik volební noci proti reálným datům z roku 2022.
 *
 *   pnpm nacvik
 *
 * Zadání to žádá jako povinnost: volební noc není okamžik na první ostré
 * spuštění pipeline. Skript projde celou cestu — stažení z ČSÚ, parsování,
 * uložení snapshotu, načtení zpět — a ověří známé výsledky roku 2022.
 * Nekončí nulou, pokud cokoli neodpovídá.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { nactiSnapshot, stariMinut, ulozSnapshot } from '../src/lib/snapshot'
import { celkovyPostup, stahniVysledky, type Snapshot } from '../src/lib/vysledky'

const KOREN = join(__dirname, '..')

/** Skutečné výsledky voleb do ZHMP 2022, proti kterým se nácvik měří. */
const OCEKAVANO = {
  zastupitelstev: 58,
  magistrat: {
    mandatuCelkem: 65,
    okrskyCelkem: 1123,
    ucastProcenta: 43.91,
    vitez: { nazev: 'SPOLU pro Prahu (ODS, TOP 09, KDU-ČSL)', procenta: 24.72, mandaty: 19 },
    poradiPrvnichPeti: [19, 14, 13, 11, 5],
  },
}

let chyb = 0
function kontrola(popis: string, podminka: boolean, detail = ''): void {
  if (podminka) {
    console.log(`  ✓ ${popis}`)
  } else {
    chyb++
    console.log(`  ✗ ${popis}${detail ? ` — ${detail}` : ''}`)
  }
}

async function main() {
  console.log('Nácvik volební noci proti datům kv2022\n')

  const ciselnik = JSON.parse(
    readFileSync(join(KOREN, 'data/ciselniky/zastupitelstva.json'), 'utf8'),
  ) as { zastupitelstva: { kod: string; slug: string }[] }
  const slugPodleKodu = new Map(ciselnik.zastupitelstva.map((z) => [z.kod, z.slug]))

  console.log('1. Stažení a parsování z ČSÚ')
  const zacatek = Date.now()
  let snapshot: Snapshot
  try {
    snapshot = await stahniVysledky(slugPodleKodu, 'kv2022', '20220923')
  } catch (chyba) {
    console.log(`  ✗ stažení selhalo: ${chyba instanceof Error ? chyba.message : chyba}`)
    process.exit(1)
  }
  const trvani = Date.now() - zacatek
  kontrola(`staženo a naparsováno za ${trvani} ms`, trvani < 45_000)
  kontrola(
    `${snapshot.zastupitelstva.length} zastupitelstev`,
    snapshot.zastupitelstva.length === OCEKAVANO.zastupitelstev,
    `očekáváno ${OCEKAVANO.zastupitelstev}`,
  )
  kontrola('každé zastupitelstvo má slug z číselníku', snapshot.zastupitelstva.every((z) => !/^\d+$/.test(z.slug)))

  console.log('\n2. Kontrola známých výsledků magistrátu 2022')
  const m = snapshot.zastupitelstva.find((z) => z.kod === '554782')
  if (!m) {
    console.log('  ✗ magistrát ve výsledcích chybí')
    process.exit(1)
  }
  kontrola(`${m.mandatuCelkem} mandátů`, m.mandatuCelkem === OCEKAVANO.magistrat.mandatuCelkem)
  kontrola(`${m.okrskyCelkem} okrsků`, m.okrskyCelkem === OCEKAVANO.magistrat.okrskyCelkem)
  kontrola(`účast ${m.ucastProcenta} %`, m.ucastProcenta === OCEKAVANO.magistrat.ucastProcenta)
  kontrola('sečteno', m.spocteno)

  const vitez = m.strany[0]
  kontrola(
    `vítěz ${vitez?.nazev}`,
    vitez?.nazev === OCEKAVANO.magistrat.vitez.nazev,
    `očekáváno ${OCEKAVANO.magistrat.vitez.nazev}`,
  )
  kontrola(`vítěz ${vitez?.procenta} %`, vitez?.procenta === OCEKAVANO.magistrat.vitez.procenta)
  kontrola(`vítěz ${vitez?.mandaty} mandátů`, vitez?.mandaty === OCEKAVANO.magistrat.vitez.mandaty)
  kontrola(
    'strany seřazené sestupně podle procent',
    m.strany.every((s, i) => i === 0 || s.procenta <= m.strany[i - 1]!.procenta),
  )
  kontrola(
    'mandáty prvních pěti sedí',
    JSON.stringify(m.strany.slice(0, 5).map((s) => s.mandaty)) ===
      JSON.stringify(OCEKAVANO.magistrat.poradiPrvnichPeti),
    JSON.stringify(m.strany.slice(0, 5).map((s) => s.mandaty)),
  )
  const soucetMandatu = m.strany.reduce((n, s) => n + s.mandaty, 0)
  kontrola(`součet mandátů ${soucetMandatu}`, soucetMandatu === m.mandatuCelkem)

  console.log('\n3. Konzistence napříč všemi zastupitelstvy')
  const spatneMandaty = snapshot.zastupitelstva.filter(
    (z) => z.strany.reduce((n, s) => n + s.mandaty, 0) !== z.mandatuCelkem,
  )
  kontrola(
    'v každém zastupitelstvu sedí součet mandátů',
    spatneMandaty.length === 0,
    spatneMandaty.map((z) => z.nazev).join(', '),
  )
  const bezStran = snapshot.zastupitelstva.filter((z) => z.strany.length === 0)
  kontrola('každé zastupitelstvo má aspoň jednu stranu', bezStran.length === 0)
  const spatnaUcast = snapshot.zastupitelstva.filter(
    (z) => z.ucastProcenta <= 0 || z.ucastProcenta > 100,
  )
  kontrola('účast je všude v rozmezí 0–100 %', spatnaUcast.length === 0)

  const postup = celkovyPostup(snapshot)
  kontrola(`postup sčítání ${postup.procenta} %`, postup.procenta === 100)

  console.log('\n4. Uložení a načtení snapshotu')
  await ulozSnapshot(snapshot)
  const nactene = await nactiSnapshot()
  kontrola('snapshot se načetl zpět', nactene !== null)
  kontrola(
    'načtený snapshot má stejná data',
    nactene?.zastupitelstva.length === snapshot.zastupitelstva.length &&
      nactene?.generovano === snapshot.generovano,
  )
  kontrola('stáří snapshotu je vyčíslitelné', Number.isFinite(stariMinut(nactene!)))

  console.log('\n5. Chování při výpadku')
  const rozbite = await stahniVysledky(slugPodleKodu, 'kv2026', '20991231').then(
    () => 'neselhalo',
    (e: Error) => e.message,
  )
  kontrola('neplatný dotaz na ČSÚ selže a nepřepíše snapshot', rozbite !== 'neselhalo', rozbite)
  const poVypadku = await nactiSnapshot()
  kontrola('po neúspěchu zůstal poslední dobrý snapshot', poVypadku?.generovano === snapshot.generovano)

  console.log(
    `\n${chyb === 0 ? 'NÁCVIK PROŠEL' : `NÁCVIK SELHAL — ${chyb} kontrol neprošlo`}`,
  )
  process.exit(chyb === 0 ? 0 : 1)
}

main().catch((chyba) => {
  console.error(chyba)
  process.exit(1)
})
