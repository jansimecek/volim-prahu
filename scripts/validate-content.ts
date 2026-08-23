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
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

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
 * Slovník verdiktu se kontroluje jen tam, kde se hodnotí. Metodika o něm
 * naopak musí mluvit — vysvětluje, proč se takové výroky nevydávají.
 */
const KONTROLOVAT_SLOVNIK = (soubor: string) =>
  soubor.startsWith('content/programy/') || soubor.startsWith('content/strany/')

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

async function overOdkazy() {
  const seznam = [...odkazyKOvereni].filter(
    (odkaz) => !NEOVEROVAT.some((host) => new URL(odkaz).hostname.endsWith(host)),
  )
  console.log(`Ověřuji ${seznam.length} odkazů …`)
  // Sekvenčně a s krátkým timeoutem — cílem není zátěžový test cizích serverů.
  for (const odkaz of seznam) {
    try {
      const odpoved = await fetch(odkaz, {
        method: 'GET',
        redirect: 'follow',
        // Bez User-Agent vrací část právních serverů (zakonyprolidi.cz) 403,
        // což by validaci shazovalo na odkazech, které fungují.
        headers: { 'user-agent': 'Mozilla/5.0 (kontrola odkazu, volimprahu.cz)' },
        signal: AbortSignal.timeout(15_000),
      })
      if (!odpoved.ok) {
        nalezy.push({
          soubor: '(odkazy)',
          radek: 0,
          zprava: `Nefunkční odkaz (${odpoved.status}): ${odkaz}`,
          tvrde: true,
        })
      }
    } catch {
      nalezy.push({
        soubor: '(odkazy)',
        radek: 0,
        zprava: `Odkaz nedostupný: ${odkaz}`,
        tvrde: strict,
      })
    }
  }
}

async function main() {
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

main()
