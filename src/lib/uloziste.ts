import { mkdirSync, appendFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Hlas } from './hlasovani'

/**
 * Rozhraní úložiště ankety. Dvě implementace:
 *  - Postgres pro provoz (jakýkoli, integrace na Vercelu nastaví POSTGRES_URL),
 *  - soubor pro lokální vývoj, aby šlo hlasování zkoušet bez databáze.
 *
 * Vendor-neutrální schválně: kdyby se poskytovatel měnil, mění se connection
 * string, ne aplikace.
 */
export type Uloziste = {
  ulozHlas(hlas: Hlas): Promise<void>
  ulozOdber(email: string): Promise<void>
  /** Volá se výhradně po zveřejnitelném datu — hlídá si to volající. */
  souhrn(): Promise<{ subjekt: string; uroven: string; mestskaCast: string; pocet: number }[]>
}

const SCHEMA = `
create table if not exists hlasy (
  id               bigserial primary key,
  mestska_cast     text        not null,
  vekova_kategorie text        not null,
  uroven           text        not null,
  subjekt          text        not null,
  vytvoreno        timestamptz not null default now()
);

create table if not exists odbery (
  id        bigserial primary key,
  email     text        not null unique,
  vytvoreno timestamptz not null default now()
);
`

let pripojeni: ReturnType<typeof import('postgres')> | null = null
let schemaVytvoreno = false

async function postgresUloziste(url: string): Promise<Uloziste> {
  const { default: postgres } = await import('postgres')
  pripojeni ??= postgres(url, { max: 1, idle_timeout: 20, prepare: false })
  const sql = pripojeni
  // Jen jednou za život procesu, ne při každém požadavku.
  if (!schemaVytvoreno) {
    await sql.unsafe(SCHEMA)
    schemaVytvoreno = true
  }

  return {
    async ulozHlas(hlas) {
      await sql`
        insert into hlasy (mestska_cast, vekova_kategorie, uroven, subjekt)
        values (${hlas.mestskaCast}, ${hlas.vekovaKategorie}, ${hlas.uroven}, ${hlas.subjekt})
      `
    },
    async ulozOdber(email) {
      await sql`
        insert into odbery (email) values (${email})
        on conflict (email) do nothing
      `
    },
    async souhrn() {
      const radky = await sql<
        { subjekt: string; uroven: string; mestska_cast: string; pocet: string }[]
      >`
        select subjekt, uroven, mestska_cast, count(*)::text as pocet
        from hlasy group by subjekt, uroven, mestska_cast order by count(*) desc
      `
      return radky.map((r) => ({
        subjekt: r.subjekt,
        uroven: r.uroven,
        mestskaCast: r.mestska_cast,
        pocet: Number(r.pocet),
      }))
    },
  }
}

/** Lokální náhrada pro vývoj. Do produkce se nikdy nedostane — viz nacti(). */
function souborUloziste(): Uloziste {
  const adresar = join(process.cwd(), '.data')
  mkdirSync(adresar, { recursive: true })
  const hlasy = join(adresar, 'hlasy.jsonl')
  const odbery = join(adresar, 'odbery.jsonl')

  return {
    async ulozHlas(hlas) {
      appendFileSync(hlasy, JSON.stringify({ ...hlas, vytvoreno: new Date().toISOString() }) + '\n')
    },
    async ulozOdber(email) {
      appendFileSync(odbery, JSON.stringify({ email, vytvoreno: new Date().toISOString() }) + '\n')
    },
    async souhrn() {
      if (!existsSync(hlasy)) return []
      const pocty = new Map<string, { subjekt: string; uroven: string; mestskaCast: string; pocet: number }>()
      for (const radek of readFileSync(hlasy, 'utf8').split('\n').filter(Boolean)) {
        const h = JSON.parse(radek) as Hlas
        const klic = `${h.subjekt}|${h.uroven}|${h.mestskaCast}`
        const zaznam = pocty.get(klic) ?? {
          subjekt: h.subjekt,
          uroven: h.uroven,
          mestskaCast: h.mestskaCast,
          pocet: 0,
        }
        zaznam.pocet++
        pocty.set(klic, zaznam)
      }
      return [...pocty.values()].sort((a, b) => b.pocet - a.pocet)
    },
  }
}

/**
 * Je kam ukládat? Stránka se na to musí umět zeptat dřív, než nabídne
 * formulář — jinak by čtenář vyplnil hlas a dostal chybu.
 */
export function ulozisteNastaveno(): boolean {
  if (process.env.POSTGRES_URL || process.env.DATABASE_URL) return true
  // Mimo produkci stačí soubor.
  return process.env.NODE_ENV !== 'production'
}

export class UlozisteNenastaveno extends Error {
  constructor() {
    super('Úložiště ankety není nastavené: chybí POSTGRES_URL.')
  }
}

export async function nactiUloziste(): Promise<Uloziste> {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
  if (url) return postgresUloziste(url)
  // V produkci se na souborové úložiště nespoléháme — funkce jsou efemérní
  // a zápis by se ztratil. Radši ať anketa hlásí chybu, než aby tiše mizely hlasy.
  if (process.env.NODE_ENV === 'production') throw new UlozisteNenastaveno()
  return souborUloziste()
}
