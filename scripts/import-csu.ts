/**
 * Import kandidátek a číselníků z otevřených dat ČSÚ.
 *
 *   pnpm import:csu              # zkusí kv2026, jinak upozorní a nic nepřepíše
 *   pnpm import:csu --rok 2022   # explicitní ročník (nácvik pipeline, historie)
 *   pnpm import:csu --jen-ciselnik
 *
 * Spouští se ručně a výsledek se commituje — chceme v Gitu vidět, co se změnilo.
 * Nikdy neběží při buildu: výpadek ČSÚ nesmí shodit deploy.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { unzipSync } from 'fflate'
import { parseCsvObjects } from '../src/lib/csv'
import { KOD_MAGISTRAT, slugKandidata, slugZastupitelstva, slugify } from '../src/lib/slug'

const KOREN = join(__dirname, '..')
const OKRES_PRAHA = '1100'

/** Hodnoty od této hranice výš jsou náhrada za dosud nevylosované pořadí. */
const HRANICE_NAHRADNIHO_CISLA = 500

type Argumenty = { rok: number; jenCiselnik: boolean; vystup: string }

function nactiArgumenty(): Argumenty {
  const argv = process.argv.slice(2)
  const hodnota = (prepinac: string) => {
    const i = argv.indexOf(prepinac)
    return i >= 0 ? argv[i + 1] : undefined
  }
  return {
    rok: Number(hodnota('--rok') ?? new Date().getFullYear()),
    jenCiselnik: argv.includes('--jen-ciselnik'),
    // Archivní ročníky se ukládají mimo `data/kandidatky`, aby se nepletly s ostrými daty.
    vystup: hodnota('--vystup') ?? 'data/kandidatky',
  }
}

/** Názvy ZIPů nesou datum snapshotu, které se mění — musí se vyčíst z rozcestníku. */
async function najdiSadu(
  rok: number,
): Promise<{ zaklad: string; registr: string; ciselniky: string } | null> {
  const zaklad = `https://volby.gov.cz/opendata/kv${rok}/`
  const odpoved = await fetch(`${zaklad}kv${rok}_opendata.htm`)
  if (!odpoved.ok) return null
  const html = await odpoved.text()
  const registr = html.match(new RegExp(`KV${rok}reg\\d+_csv\\.zip`))?.[0]
  const ciselniky = html.match(new RegExp(`KV${rok}ciselniky\\d+_csv\\.zip`))?.[0]
  if (!registr || !ciselniky) return null
  return { zaklad, registr, ciselniky }
}

async function stahniZip(url: string): Promise<Record<string, Uint8Array>> {
  const odpoved = await fetch(url)
  if (!odpoved.ok) throw new Error(`Stažení selhalo (${odpoved.status}): ${url}`)
  return unzipSync(new Uint8Array(await odpoved.arrayBuffer()))
}

function csvZeZipu(zip: Record<string, Uint8Array>, nazev: string): Record<string, string>[] {
  // `csv_od` = otevřená varianta: UTF-8 a čárka. Varianta `csv` je windows-1250 se středníky.
  const soubor = zip[`csv_od/${nazev}`]
  if (!soubor) throw new Error(`V archivu chybí csv_od/${nazev}`)
  return parseCsvObjects(new TextDecoder('utf-8').decode(soubor))
}

type Zastupitelstvo = {
  kod: string
  nazev: string
  slug: string
  jeMagistrat: boolean
  mandaty: number
  okrskyCelkem: number
  pocetObyvatel: number
  /** Rozsahy čísel okrsků — u MČ typicky jeden, u magistrátu desítky. */
  rozsahyOkrsku: { od: number; do: number }[]
}

/**
 * Číselník se skládá ze dvou souborů, protože ani jeden sám nestačí:
 *  - `kvcoco` (číselníky) má jeden řádek na zastupitelstvo, počet mandátů a okrsků
 *    a nadřazené zastupitelstvo — podle něj se Praha filtruje spolehlivě.
 *  - `kvrzcoco` (registr) má navíc počet obyvatel a rozsahy čísel okrsků,
 *    ale magistrát je v něm rozepsaný na 57 řádků, takže se musí sloučit.
 */
function sestavCiselnik(
  coco: Record<string, string>[],
  rzcoco: Record<string, string>[],
): Zastupitelstvo[] {
  const prazske = coco.filter(
    (r) => r.KODZASTUP === KOD_MAGISTRAT || r.NADRZASTUP === KOD_MAGISTRAT,
  )

  const doplnkyPodleKodu = new Map<string, { pocetObyvatel: number; rozsahy: { od: number; do: number }[] }>()
  for (const r of rzcoco) {
    if (r.OKRES !== OKRES_PRAHA) continue
    const kod = r.KODZASTUP ?? ''
    const zaznam = doplnkyPodleKodu.get(kod) ?? { pocetObyvatel: 0, rozsahy: [] }
    zaznam.pocetObyvatel = Number(r.POCOBYV ?? 0) || zaznam.pocetObyvatel
    for (let i = 1; i <= 10; i++) {
      const klic = i === 10 ? 'OKRSE10' : `OKRSEK${i}`
      const od = Number(r[`MIN${klic}`] ?? 0)
      const doo = Number(r[`MAX${klic}`] ?? 0)
      if (od > 0 && doo > 0) zaznam.rozsahy.push({ od, do: doo })
    }
    doplnkyPodleKodu.set(kod, zaznam)
  }

  return prazske
    .map((r) => {
      const kod = r.KODZASTUP ?? ''
      const nazev = r.NAZEVZAST ?? ''
      const doplnek = doplnkyPodleKodu.get(kod)
      const rozsahy = (doplnek?.rozsahy ?? [])
        .slice()
        .sort((a, b) => a.od - b.od)
      return {
        kod,
        nazev,
        slug: slugZastupitelstva(nazev, kod),
        jeMagistrat: kod === KOD_MAGISTRAT,
        mandaty: Number(r.MANDATY ?? 0),
        okrskyCelkem: Number(r.OKRSKYCELK ?? 0),
        pocetObyvatel: doplnek?.pocetObyvatel ?? 0,
        rozsahyOkrsku: rozsahy,
      }
    })
    .sort((a, b) =>
      a.jeMagistrat ? -1 : b.jeMagistrat ? 1 : a.nazev.localeCompare(b.nazev, 'cs'),
    )
}

type Kandidat = {
  id: string
  slug: string
  jmeno: string
  prijmeni: string
  titulPred: string
  titulZa: string
  vek: number
  povolani: string
  bydliste: string
  navrhujiciStrana: string
  politickaPrislusnost: string
  poradi: number
  zastupitelstvo: string
}

function sestavKandidatky(
  zastupitelstva: Zastupitelstvo[],
  kandidati: Record<string, string>[],
  strany: Record<string, string>[],
  politickeStrany: Map<string, string>,
) {
  const podleKodu = new Map(zastupitelstva.map((z) => [z.kod, z]))
  const stranaPodleKlice = new Map(
    strany
      .filter((s) => podleKodu.has(s.KODZASTUP ?? ''))
      .map((s) => [`${s.KODZASTUP}-${s.POR_STR_HL}`, s]),
  )

  const vystup = new Map<string, ReturnType<typeof prazdnaKandidatka>>()
  for (const z of zastupitelstva) vystup.set(z.kod, prazdnaKandidatka(z))

  // Stabilní pořadí = stabilní slugy při kolizích jmen.
  const serazeni = kandidati
    .filter((k) => podleKodu.has(k.KODZASTUP ?? ''))
    .sort(
      (a, b) =>
        // magistrát první, pak městské části podle kódu
        Number(b.KODZASTUP === KOD_MAGISTRAT) - Number(a.KODZASTUP === KOD_MAGISTRAT) ||
        (a.KODZASTUP ?? '').localeCompare(b.KODZASTUP ?? '') ||
        Number(a.POR_STR_HL) - Number(b.POR_STR_HL) ||
        Number(a.PORCISLO) - Number(b.PORCISLO),
    )

  const obsazeneSlugy = new Set<string>()
  /**
   * Tentýž člověk často kandiduje na magistrát i ve své městské části a má mít
   * jeden profil. Ztotožňujeme ho ale jen tehdy, když se shoduje jméno, věk
   * i obec bydliště — ČSÚ datum narození nezveřejňuje, takže shoda podle
   * samotného jména by mohla slít dva různé lidi do jednoho.
   */
  const slugPodleIdentity = new Map<string, string>()

  for (const radek of serazeni) {
    const kodZastup = radek.KODZASTUP ?? ''
    const kandidatka = vystup.get(kodZastup)!
    const cisloStrany = Number(radek.POR_STR_HL ?? 0)
    const strana = stranaPodleKlice.get(`${kodZastup}-${radek.POR_STR_HL}`)

    let zaznamStrany = kandidatka.strany.find((s) => s.poradiVDatech === cisloStrany)
    if (!zaznamStrany) {
      const nazev = strana?.NAZEVCELK ?? `Volební strana ${cisloStrany}`
      zaznamStrany = {
        /**
         * Vylosované číslo na hlasovacím lístku, nebo null.
         * ČSÚ podle popisu datové věty dosazuje za nevylosované pořadí dočasnou
         * náhradu; v datech kv2026 je to blok od 501 výš, přidělený abecedně
         * v rámci zastupitelstva. Publikovat ho jako číslo kandidátky by na
         * volebním průvodci byla hrubá chyba, proto se sem nedostane.
         */
        cislo: cisloStrany > 0 && cisloStrany < HRANICE_NAHRADNIHO_CISLA ? cisloStrany : null,
        vylosovano: cisloStrany > 0 && cisloStrany < HRANICE_NAHRADNIHO_CISLA,
        poradiVDatech: cisloStrany,
        kodStrany: radek.OSTRANA ?? '',
        nazev,
        zkratka: strana?.ZKRATKAO8 ?? '',
        slug: slugify(nazev),
        slozeni: (strana?.SLOZENI ?? '').split(',').filter(Boolean),
        kandidati: [],
      }
      kandidatka.strany.push(zaznamStrany)
    }

    const poradi = Number(radek.PORCISLO ?? 0)
    const prijmeni = radek.PRIJMENI ?? ''
    const jmeno = radek.JMENO ?? ''
    const identita = [
      slugify(prijmeni),
      slugify(jmeno),
      radek.VEK ?? '',
      slugify(radek.BYDLISTEN ?? ''),
    ].join('|')
    let slug = slugPodleIdentity.get(identita)
    if (!slug) {
      slug = slugKandidata(prijmeni, jmeno, obsazeneSlugy)
      slugPodleIdentity.set(identita, slug)
    }

    const kandidat: Kandidat = {
      id: `${kodZastup}-${cisloStrany}-${poradi}`,
      slug,
      jmeno,
      prijmeni,
      titulPred: radek.TITULPRED ?? '',
      titulZa: radek.TITULZA ?? '',
      vek: Number(radek.VEK ?? 0),
      povolani: radek.POVOLANI ?? '',
      // Publikuje se jen v rozsahu, v jakém bydliště zveřejňuje ČSÚ (obec/MČ).
      bydliste: radek.BYDLISTEN ?? '',
      // ČSÚ uvádí kódy politických stran; bez převodu by na profilu stálo
      // „příslušnost 720“, což čtenáři nic neříká. Kód 999 = bez příslušnosti.
      navrhujiciStrana: nazevPolitickeStrany(radek.NSTRANA, politickeStrany),
      politickaPrislusnost: nazevPolitickeStrany(radek.PSTRANA, politickeStrany),
      poradi,
      zastupitelstvo: podleKodu.get(kodZastup)!.slug,
    }
    zaznamStrany.kandidati.push(kandidat)
  }

  for (const kandidatka of vystup.values()) {
    // Řadíme podle pořadí v datech; dokud není vylosováno, je to abecedně.
    kandidatka.strany.sort((a, b) => a.poradiVDatech - b.poradiVDatech)
    for (const s of kandidatka.strany) s.kandidati.sort((a, b) => a.poradi - b.poradi)
  }
  return vystup
}

/**
 * Číselník `cns` mapuje kód politické strany na její zkratku. Obsahuje ale jen
 * strany, které navrhly kandidáty — kód politické příslušnosti v něm být nemusí.
 * Nerozluštěný kód proto zahazujeme a stránka napíše „neuvedeno“: vymyslet si,
 * že kód 99 znamená bez příslušnosti, by bylo tvrzení o politické příslušnosti
 * tisíců lidí, které nemáme čím doložit.
 */
function nazevPolitickeStrany(kod: string | undefined, ciselnik: Map<string, string>): string {
  if (!kod) return ''
  return ciselnik.get(kod) ?? ''
}

function prazdnaKandidatka(z: Zastupitelstvo) {
  return {
    zastupitelstvo: { kod: z.kod, nazev: z.nazev, slug: z.slug, mandaty: z.mandaty },
    sada: '',
    stazeno: '',
    strany: [] as {
      cislo: number | null
      vylosovano: boolean
      poradiVDatech: number
      kodStrany: string
      nazev: string
      zkratka: string
      slug: string
      slozeni: string[]
      kandidati: Kandidat[]
    }[],
  }
}

function zapisJson(cesta: string, data: unknown): 'nový' | 'změněn' | 'beze změny' {
  mkdirSync(join(cesta, '..'), { recursive: true })
  const novy = JSON.stringify(data, null, 2) + '\n'
  if (!existsSync(cesta)) {
    writeFileSync(cesta, novy)
    return 'nový'
  }
  if (readFileSync(cesta, 'utf8') === novy) return 'beze změny'
  writeFileSync(cesta, novy)
  return 'změněn'
}

async function main() {
  const { rok, jenCiselnik, vystup } = nactiArgumenty()
  const sada = await najdiSadu(rok)

  if (!sada) {
    console.error(
      `\n  Sada kv${rok} zatím na volby.gov.cz/opendata není.\n` +
        `  Nic se nepřepisuje. Pro nácvik pipeline proti loňským datům:\n` +
        `      pnpm import:csu --rok 2022\n`,
    )
    process.exitCode = 1
    return
  }

  console.log(`Stahuji ${sada.zaklad}${sada.ciselniky} …`)
  const zipCiselniky = await stahniZip(`${sada.zaklad}${sada.ciselniky}`)
  console.log(`Stahuji ${sada.zaklad}${sada.registr} …`)
  const zip = await stahniZip(`${sada.zaklad}${sada.registr}`)

  const zastupitelstva = sestavCiselnik(
    csvZeZipu(zipCiselniky, 'kvcoco.csv'),
    csvZeZipu(zip, 'kvrzcoco.csv'),
  )

  if (zastupitelstva.length !== 58) {
    console.warn(
      `  Varování: očekáváno 58 zastupitelstev (magistrát + 57 MČ), nalezeno ${zastupitelstva.length}.`,
    )
  }

  const stav = zapisJson(join(KOREN, 'data/ciselniky/zastupitelstva.json'), {
    sada: `kv${rok}`,
    stazeno: new Date().toISOString().slice(0, 10),
    zastupitelstva,
  })
  console.log(`  data/ciselniky/zastupitelstva.json — ${stav} (${zastupitelstva.length} záznamů)`)

  if (jenCiselnik) return

  const politickeStrany = new Map(
    csvZeZipu(zipCiselniky, 'cns.csv').map((r) => [
      r.NSTRANA ?? '',
      r.ZKRATKAN8 || r.ZKRATKAN30 || r.NAZEV_STRN || (r.NSTRANA ?? ''),
    ]),
  )

  const kandidatky = sestavKandidatky(
    zastupitelstva,
    csvZeZipu(zip, 'kvrk.csv'),
    csvZeZipu(zip, 'kvros.csv'),
    politickeStrany,
  )

  let zmeneno = 0
  let kandidatuCelkem = 0
  for (const [kod, kandidatka] of kandidatky) {
    const z = zastupitelstva.find((x) => x.kod === kod)!
    kandidatka.sada = `kv${rok}`
    kandidatka.stazeno = new Date().toISOString().slice(0, 10)
    const pocet = kandidatka.strany.reduce((n, s) => n + s.kandidati.length, 0)
    kandidatuCelkem += pocet
    const stavSouboru = zapisJson(join(KOREN, vystup, `${z.slug}.json`), kandidatka)
    if (stavSouboru !== 'beze změny') {
      zmeneno++
      console.log(
        `  ${vystup}/${z.slug}.json — ${stavSouboru}: ${kandidatka.strany.length} stran, ${pocet} kandidátů`,
      )
    }
  }

  console.log(
    `\nHotovo: ${kandidatky.size} zastupitelstev, ${kandidatuCelkem} kandidátů, ${zmeneno} souborů změněno.`,
  )
}

main().catch((chyba) => {
  console.error(chyba)
  process.exit(1)
})
