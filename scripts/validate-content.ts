/**
 * Kontrola obsahu nad rámec Zod schémat.
 *
 *   pnpm validate            # varování vypíše, ale neshodí běh
 *   pnpm validate --strict   # cokoli otevřeného shodí běh (před spuštěním webu)
 *   pnpm validate --odkazy   # navíc ověří, že odkazy ve zdrojích opravdu fungují
 *
 * Zod hlídá tvar dat. Tohle hlídá věci, které tvar nezachytí: nedopsané
 * pasáže, slovník verdiktu tam, kde má být slovník proveditelnosti,
 * a nefunkční odkazy ve zdrojích hodnocení.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { jeOdkazMrtvy, popisChybyOdkazu } from '../src/lib/odkazy'

const KOREN = join(__dirname, '..')
const OBSAH = join(KOREN, 'content')

const strict = process.argv.includes('--strict')
const kontrolovatOdkazy = process.argv.includes('--odkazy')

/**
 * Web hodnotí proveditelnost, ne pravdivost. Tenhle slovník se v hodnoceních
 * nesmí objevit — jinak z metodiky vzniká verdikt, který neumíme obhájit.
 *
 * Hranice slova se musí psát přes \p{L}: JavaScriptové \b je ASCII, takže
 * „lež" ani „lhal" by s ním nešly zachytit vůbec.
 */
const hranice = (jadro: string) => new RegExp(`(?<!\\p{L})(?:${jadro})(?!\\p{L})`, 'iu')

const ZAKAZANY_SLOVNIK = [
  hranice('lež|lži|lží|lžou|lže|lhal\\w*|lživ\\w*'),
  hranice('podvod\\w*'),
  hranice('nepravd\\w*'),
]

/**
 * Slovník verdiktu se kontroluje jen tam, kde hodnotíme vlastními slovy.
 *
 * Kontrolují se kolekce, kde redakce píše vlastními slovy o subjektech:
 * hodnocení programů a aktuality. Při přidání další takové rubriky se sem
 * musí dopsat, jinak v ní pravidlo mlčky přestane platit.
 *
 * Metodika o slovníku mluvit musí — vysvětluje, proč takové výroky
 * nevydáváme. A profily subjektů citují registrované názvy volebních stran,
 * které si strany zvolily samy; jeden z pražských názvů je několikasetznakový
 * text obsahující i slova z tohoto seznamu. Citovat ho doslova je povinnost,
 * ne náš verdikt, takže se `content/strany/` nekontroluje.
 */
const KONTROLOVAT_SLOVNIK = (soubor: string) =>
  soubor.startsWith('content/programy/') || soubor.startsWith('content/aktualne/')

type Nalez = { soubor: string; radek: number; zprava: string; tvrde: boolean }

function vsechnySoubory(adresar: string): string[] {
  const polozky = readdirSync(adresar)
  return polozky.flatMap((polozka) => {
    const cesta = join(adresar, polozka)
    if (statSync(cesta).isDirectory()) return vsechnySoubory(cesta)
    return cesta.endsWith('.mdx') || cesta.endsWith('.yaml') ? [cesta] : []
  })
}

const nalezy: Nalez[] = []
const odkazyKOvereni = new Set<string>()

for (const cesta of vsechnySoubory(OBSAH)) {
  const soubor = relative(KOREN, cesta)
  const radky = readFileSync(cesta, 'utf8').split('\n')

  radky.forEach((text, i) => {
    if (text.includes('DOPLNIT')) {
      nalezy.push({
        soubor,
        radek: i + 1,
        zprava: 'Nedopsaná pasáž (DOPLNIT)',
        tvrde: strict,
      })
    }

    for (const vzor of KONTROLOVAT_SLOVNIK(soubor) ? ZAKAZANY_SLOVNIK : []) {
      if (vzor.test(text)) {
        nalezy.push({
          soubor,
          radek: i + 1,
          zprava: `Slovník verdiktu místo slovníku proveditelnosti: „${text.trim().slice(0, 80)}"`,
          tvrde: true,
        })
        break
      }
    }

    for (const odkaz of text.match(/https?:\/\/[^\s)"'<>\]]+/g) ?? []) {
      odkazyKOvereni.add(odkaz)
    }
  })
}

/**
 * Sociální sítě odpovídají automatizovaným požadavkům 403 nebo 999 bez ohledu
 * na to, jestli profil existuje. Kontrolovat je nemá smysl — jen by to
 * spolehlivě shazovalo validaci.
 */
const NEOVEROVAT = ['instagram.com', 'x.com', 'twitter.com', 'facebook.com', 'linkedin.com']

/** Stavy, které mohou být přechodné a stojí za druhý pokus. */
const PRECHODNE_STAVY = new Set([408, 425, 429, 500, 502, 503, 504])

async function overOdkazy() {
  // `new URL` na neplatné adrese vyhodí výjimku. Bez ošetření by překlep
  // ve zdroji shodil celý běh dřív, než se vypíšou už posbírané nálezy —
  // redakce by místo reportu dostala stack trace.
  const seznam: string[] = []
  for (const odkaz of odkazyKOvereni) {
    let hostitel: string
    try {
      hostitel = new URL(odkaz).hostname
    } catch {
      nalezy.push({ soubor: '(odkazy)', radek: 0, zprava: `Neplatná adresa: ${odkaz}`, tvrde: true })
      continue
    }
    if (!NEOVEROVAT.some((host) => hostitel.endsWith(host))) seznam.push(odkaz)
  }
  console.log(`Ověřuji ${seznam.length} odkazů …`)

  for (const odkaz of seznam) {
    const vysledek = await zkusOdkaz(odkaz)
    if (vysledek) nalezy.push(vysledek)
  }
}

const cekej = (ms: number) => new Promise((hotovo) => setTimeout(hotovo, ms))

/**
 * Jeden odkaz, s jedním opakováním.
 *
 * Opakování tu není pro pohodlí. Bez něj hlásila validace jako mrtvé
 * i adresy, které odpovídají do jedné sekundy — úřední desky Prahy 2,
 * Prahy 4, Dubče a Křeslic propadly na jednom běhu a na dalším prošly.
 * Jeden výpadek sítě uprostřed stošedesáti sekvenčních požadavků tak
 * vypadal stejně jako zrušená stránka, což je nejhorší možná záměna:
 * skutečné mrtvé odkazy se ztratí v šumu falešných.
 *
 * Opakuje se jen to, co může být přechodné — chyba spojení, vypršení
 * časového limitu a odpovědi 429 a 503. Čtyřsetčtyřka je odpověď serveru,
 * ne náhoda, a opakovat ji nemá smysl.
 */
async function zkusOdkaz(odkaz: string): Promise<Nalez | null> {
  for (const pokus of [1, 2]) {
    try {
      const odpoved = await fetch(odkaz, {
        method: 'GET',
        redirect: 'follow',
        // Bez User-Agent vrací část právních serverů (zakonyprolidi.cz) 403,
        // což by validaci shazovalo na odkazech, které fungují.
        headers: { 'user-agent': 'Mozilla/5.0 (kontrola odkazu, volimprahu.cz)' },
        signal: AbortSignal.timeout(20_000),
      })
      if (odpoved.ok) return null
      if (pokus === 1 && PRECHODNE_STAVY.has(odpoved.status)) {
        await cekej(3_000)
        continue
      }
      return {
        soubor: '(odkazy)',
        radek: 0,
        zprava: `Nefunkční odkaz (${odpoved.status}): ${odkaz}`,
        tvrde: true,
      }
    } catch (chyba) {
      const { druh, popis } = popisChybyOdkazu(chyba)
      // Neúplný řetěz certifikátů je vada serveru, kterou vidí jen strojový
      // klient — v prohlížeči odkaz funguje. Hlásit ho jako mrtvý by zahltilo
      // report a skutečné mrtvé odkazy by se v tom šumu ztratily.
      if (!jeOdkazMrtvy(druh)) {
        return { soubor: '(odkazy)', radek: 0, zprava: `${popis} ${odkaz}`, tvrde: false }
      }
      if (pokus === 1) {
        await cekej(3_000)
        continue
      }
      return {
        soubor: '(odkazy)',
        radek: 0,
        zprava: `Odkaz nedostupný ani na druhý pokus (${popis}): ${odkaz}`,
        tvrde: strict,
      }
    }
  }
  return null
}

/**
 * Referenční integrita mezi kolekcemi. Velite kontroluje každý soubor zvlášť,
 * takže překlep ve slugu subjektu uvnitř průzkumu by prošel a projevil by se
 * až tím, že by se strana v seřazeném výpisu tiše propadla na konec.
 */
function overKrizoveOdkazy() {
  const velite = join(KOREN, '.velite')
  // Chybějící .velite není „nic ke kontrole", ale neproběhlá kontrola.
  // Tiché přeskočení by znamenalo, že po čerstvém klonu validace ohlásí
  // „Obsah je v pořádku" i s překlepem ve slugu subjektu.
  if (!existsSync(join(velite, 'pruzkumy.json')) || !existsSync(join(velite, 'strany.json'))) {
    nalezy.push({
      soubor: '(křížové odkazy)',
      radek: 0,
      zprava: 'Kontrola křížových odkazů neproběhla — chybí adresář .velite. Spusťte nejdřív `pnpm content`.',
      tvrde: true,
    })
    return
  }

  const strany = JSON.parse(readFileSync(join(velite, 'strany.json'), 'utf8')) as {
    slug: string
    uroven: string
  }[]
  const pruzkumy = JSON.parse(readFileSync(join(velite, 'pruzkumy.json'), 'utf8')) as {
    pruzkumy: {
      id: string
      uroven: string
      vysledky: { subjekt: string }[]
    }[]
  }

  for (const pruzkum of pruzkumy.pruzkumy) {
    for (const vysledek of pruzkum.vysledky) {
      const existuje = strany.some(
        (s) => s.slug === vysledek.subjekt && s.uroven === pruzkum.uroven,
      )
      if (!existuje) {
        nalezy.push({
          soubor: 'content/pruzkumy.yaml',
          radek: 0,
          zprava: `Průzkum "${pruzkum.id}" uvádí subjekt "${vysledek.subjekt}", který na úrovni "${pruzkum.uroven}" v content/strany neexistuje.`,
          tvrde: true,
        })
      }
    }
  }
}

async function main() {
  overKrizoveOdkazy()
  if (kontrolovatOdkazy) await overOdkazy()

  if (nalezy.length === 0) {
    console.log('Obsah je v pořádku.')
    return
  }

  const tvrde = nalezy.filter((n) => n.tvrde)
  for (const nalez of nalezy) {
    const uroven = nalez.tvrde ? 'CHYBA' : 'pozn.'
    const misto = nalez.radek > 0 ? `${nalez.soubor}:${nalez.radek}` : nalez.soubor
    console.log(`  ${uroven}  ${misto} — ${nalez.zprava}`)
  }

  console.log(
    `\n${nalezy.length} nálezů, z toho ${tvrde.length} blokujících.` +
      (strict ? '' : ' Spuštění před ostrým provozem: pnpm validate --strict --odkazy'),
  )
  if (tvrde.length > 0) process.exitCode = 1
}

main().catch((chyba: unknown) => {
  console.error(chyba)
  process.exitCode = 1
})
