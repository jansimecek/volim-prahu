/**
 * Nahrání obrázku ke aktualitě do Vercel Blobu.
 *
 *   pnpm obrazek foto.jpg
 *   pnpm obrazek foto.jpg --nazev volebni-listek-2026
 *
 * Vypíše hotový blok `obrazek:` do frontmatteru aktuality, včetně rozměrů —
 * ty jsou ve schématu povinné, aby stránka při načtení nepodskočila.
 * Alternativní text a zdroj skript nevymýšlí: doplňuje se ručně, protože
 * obrázek bez popisu je pro část čtenářů prázdné místo a fotka bez uvedeného
 * autora je cizí práce vydávaná za vlastní.
 *
 * Bez BLOB_READ_WRITE_TOKEN skript nic nenahrává, jen spočítá rozměry —
 * pak stačí soubor položit vedle .mdx a použít `soubor:` místo `url:`.
 */
import { readFileSync, statSync } from 'node:fs'
import { basename, extname } from 'node:path'
import { rozmery } from '../src/lib/obrazky'
import { bezDiakritiky } from '../src/lib/slug'

const TYPY: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

async function main() {
  const argumenty = process.argv.slice(2)
  const cesta = argumenty.find((a) => !a.startsWith('--'))
  if (!cesta) {
    console.error('Použití: pnpm obrazek <soubor> [--nazev vlastni-nazev]')
    process.exitCode = 1
    return
  }

  const pripona = extname(cesta).toLowerCase()
  const typ = TYPY[pripona]
  if (!typ) {
    console.error(`Nepodporovaná přípona "${pripona}". Podporované: ${Object.keys(TYPY).join(', ')}`)
    process.exitCode = 1
    return
  }

  const data = readFileSync(cesta)
  const velikost = statSync(cesta).size
  const mira = rozmery(data)

  const indexNazvu = argumenty.indexOf('--nazev')
  // Bez téhle kontroly by `--nazev` na konci řádky nahrálo soubor pod
  // jménem „undefined" a autor by se to dozvěděl až z adresy v Blobu.
  const vlastniNazev = indexNazvu >= 0 ? argumenty[indexNazvu + 1] : undefined
  if (indexNazvu >= 0 && !vlastniNazev) {
    console.error('Přepínač --nazev je bez hodnoty.')
    process.exitCode = 1
    return
  }
  const nazev = bezDiakritiky(vlastniNazev ?? basename(cesta, pripona))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (!nazev) {
    console.error('Z názvu nezbyl po očištění žádný znak. Zadejte --nazev s písmeny nebo číslicemi.')
    process.exitCode = 1
    return
  }

  // Bez rozměrů se do Blobu nenahrává: schéma aktuality je u obrázku z Blobu
  // vyžaduje a redaktor by je neměl odkud vzít. U lokálního souboru je doplní
  // Velite sám, tam to vadí míň.
  if (!mira) {
    console.error(
      'Rozměry se ze souboru nepodařilo přečíst.' +
        (process.env.BLOB_READ_WRITE_TOKEN
          ? ' Do Blobu ho proto nenahrávám — položte ho vedle .mdx a použijte `soubor:`.'
          : ''),
    )
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      process.exitCode = 1
      return
    }
  }
  if (velikost > 1_000_000) {
    console.error(
      `Varování: soubor má ${(velikost / 1_048_576).toFixed(1)} MB. Obrázky ke aktualitám ` +
        'zmenšujte na šířku kolem 1600 px — web je servíruje tak, jak je nahrajete.',
    )
  }
  if (mira && mira.sirka > 2000) {
    console.error(`Varování: šířka ${mira.sirka} px je zbytečná, sloupec textu má nejvýš 672 px.`)
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  let adresa: string | null = null

  if (token) {
    const { put } = await import('@vercel/blob')
    const vysledek = await put(`aktualne/${nazev}${pripona}`, data, {
      access: 'public',
      contentType: typ,
      // Náhodná přípona schválně: kdyby se přepsal obrázek, na který už někdo
      // odkazuje ze staré aktuality, změnil by se význam staré stránky.
      addRandomSuffix: true,
      cacheControlMaxAge: 31_536_000,
    })
    adresa = vysledek.url
    console.log(`Nahráno: ${adresa}\n`)
  } else {
    console.log(
      'BLOB_READ_WRITE_TOKEN není nastavený, takže se nic nenahrávalo.\n' +
        'Buď ho doplňte (vercel env pull), nebo soubor položte vedle .mdx\n' +
        'a použijte `soubor:` místo `url:`.\n',
    )
  }

  console.log('Vložte do frontmatteru aktuality a doplňte alt, popisek a zdroj:\n')
  console.log('obrazek:')
  if (adresa) {
    console.log(`  url: ${adresa}`)
    if (mira) {
      console.log(`  sirka: ${mira.sirka}`)
      console.log(`  vyska: ${mira.vyska}`)
    }
  } else {
    console.log(`  soubor: ./${basename(cesta)}`)
    if (mira) console.log(`  # rozměry ${mira.sirka}×${mira.vyska} px doplní Velite sám`)
  }
  console.log('  alt: POPIŠTE, CO JE NA OBRÁZKU — pro čtenáře, kteří ho nevidí')
  console.log('  popisek: Nepovinný popisek pod obrázkem.')
  console.log('  zdroj: KDO OBRÁZEK POŘÍDIL')
  console.log('  # zdrojUrl: https://…')
  console.log('  # licence: CC BY 4.0')
}

main().catch((chyba: unknown) => {
  console.error(chyba)
  process.exitCode = 1
})
