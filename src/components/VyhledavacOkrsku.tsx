'use client'

import Link from 'next/link'
import { useId, useMemo, useRef, useState } from 'react'
import type { OdpovedOkrsku } from '@/app/api/okrsky/[slug]/route'
import { POPIS_ZDROJE, type Mistnost } from '@/lib/mistnostiTypy'
import { najdiAdresu, normalizujUlici, type NalezenaAdresa } from '@/lib/okrskyHledani'

/**
 * Vyhledávač adresa → volební okrsek nad daty ČÚZK (data/okrsky).
 *
 * Postup: index ulic (asi 11 tisíc názvů → městské části) se stáhne při
 * prvním psaní; po odeslání se stáhnou adresy jen těch částí, kde ulice
 * leží, a hledá se v nich. Celá Praha má 135 tisíc adres, ty se na klienta
 * nikdy netahají najednou.
 *
 * Výsledek nikdy neodhaduje: cizí ulici nedoplní, nejednoznačné číslo vrátí
 * všechny možnosti. Poslat voliče do špatné místnosti je horší než říct
 * „nenašli jsme".
 */

type IndexUlic = Record<string, string[]>

type Vysledek = NalezenaAdresa & {
  mestskaCast: string
  nazevMC: string
  mistnost?: Mistnost
  urlDesky?: string
  stazeno: string
}

type Stav =
  | { typ: 'klid' }
  | { typ: 'hleda' }
  | { typ: 'chyba' }
  | { typ: 'ulice-nenalezena' }
  | { typ: 'cislo-nenalezeno'; casti: string[] }
  | { typ: 'nalezeno'; vysledky: Vysledek[] }

const KUDY_K_VOLBAM = 'https://kudykvolbam.iprpraha.cz'
const MAX_NAPOVED = 8

const cacheCasti = new Map<string, Promise<OdpovedOkrsku>>()

function nactiCast(slug: string): Promise<OdpovedOkrsku> {
  let slib = cacheCasti.get(slug)
  if (!slib) {
    slib = fetch(`/api/okrsky/${slug}`).then((o) => {
      if (!o.ok) throw new Error(`Adresy ${slug}: ${o.status}`)
      return o.json() as Promise<OdpovedOkrsku>
    })
    cacheCasti.set(slug, slib)
  }
  return slib
}

export function VyhledavacOkrsku() {
  const [ulice, setUlice] = useState('')
  const [cislo, setCislo] = useState('')
  const [index, setIndex] = useState<IndexUlic | null>(null)
  const [indexChyba, setIndexChyba] = useState(false)
  const [stav, setStav] = useState<Stav>({ typ: 'klid' })
  const [napovedaOtevrena, setNapovedaOtevrena] = useState(false)
  const slibIndexu = useRef<Promise<IndexUlic | null> | null>(null)
  const id = useId()

  /** Index se stahuje jednou; odeslání formuláře na něj počká. */
  function nactiIndex(): Promise<IndexUlic | null> {
    slibIndexu.current ??= fetch('/api/okrsky/ulice')
      .then(async (odpoved) => {
        if (!odpoved.ok) throw new Error(String(odpoved.status))
        const nacteny = ((await odpoved.json()) as { ulice: IndexUlic }).ulice
        setIndex(nacteny)
        return nacteny
      })
      .catch(() => {
        setIndexChyba(true)
        return null
      })
    return slibIndexu.current
  }

  /** Klíče indexu bez diakritiky, spočítané jednou. */
  const normalizovany = useMemo(() => {
    if (!index) return []
    return Object.keys(index).map((nazev) => ({ nazev, klic: normalizujUlici(nazev) }))
  }, [index])

  const napovedy = useMemo(() => {
    const hledane = normalizujUlici(ulice)
    if (!napovedaOtevrena || hledane.length < 2) return []
    const zacina = normalizovany.filter((u) => u.klic.startsWith(hledane))
    const obsahuje = normalizovany.filter((u) => !u.klic.startsWith(hledane) && u.klic.includes(hledane))
    return [...zacina, ...obsahuje].slice(0, MAX_NAPOVED).map((u) => u.nazev)
  }, [normalizovany, ulice, napovedaOtevrena])

  async function hledej(e: React.FormEvent) {
    e.preventDefault()
    setNapovedaOtevrena(false)
    const aktualni = index ?? (await nactiIndex())
    if (!aktualni) return
    const hledana = normalizujUlici(ulice)
    const slugy = [
      ...new Set(
        Object.keys(aktualni)
          .filter((nazev) => normalizujUlici(nazev) === hledana)
          .flatMap((nazev) => aktualni[nazev] ?? []),
      ),
    ]
    if (slugy.length === 0) {
      setStav({ typ: 'ulice-nenalezena' })
      return
    }
    setStav({ typ: 'hleda' })
    try {
      const casti = await Promise.all(slugy.map(nactiCast))
      const vysledky: Vysledek[] = casti.flatMap((cast) =>
        najdiAdresu(
          { mestskaCast: cast.mestskaCast, kodMomc: '', stazeno: cast.stazeno, sloupce: ['cislo', 'okrsek', 'adm', 'lat', 'lon'], ulice: cast.ulice },
          ulice,
          cislo,
        ).map((n) => ({
          ...n,
          mestskaCast: cast.mestskaCast,
          nazevMC: cast.nazev,
          mistnost: cast.mistnosti[n.okrsek],
          urlDesky: cast.urlDesky,
          stazeno: cast.stazeno,
        })),
      )
      setStav(
        vysledky.length > 0
          ? { typ: 'nalezeno', vysledky }
          : { typ: 'cislo-nenalezeno', casti: casti.map((c) => c.nazev) },
      )
    } catch {
      setStav({ typ: 'chyba' })
    }
  }

  return (
    <div>
      <form onSubmit={hledej} className="grid max-w-xl gap-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
        <div className="relative">
          <label htmlFor={`${id}-ulice`} className="popisek-uredni">
            Ulice
          </label>
          <input
            id={`${id}-ulice`}
            type="text"
            value={ulice}
            onChange={(e) => {
              setUlice(e.target.value)
              setNapovedaOtevrena(true)
              void nactiIndex()
            }}
            onFocus={() => void nactiIndex()}
            onBlur={() => setTimeout(() => setNapovedaOtevrena(false), 150)}
            placeholder="například Partyzánská"
            autoComplete="off"
            required
            role="combobox"
            aria-autocomplete="list"
            aria-controls={`${id}-napoveda`}
            aria-expanded={napovedy.length > 0}
            className="mt-1 w-full border border-inkoust bg-papir px-3 py-2 font-mono text-sm placeholder:text-seda-uredni"
          />
          {napovedy.length > 0 && (
            <ul
              id={`${id}-napoveda`}
              role="listbox"
              aria-label="Návrhy ulic"
              className="absolute left-0 right-0 z-10 mt-1 border border-inkoust bg-papir shadow-sm"
            >
              {napovedy.map((n) => (
                <li key={n} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setUlice(n)
                      setNapovedaOtevrena(false)
                      document.getElementById(`${id}-cislo`)?.focus()
                    }}
                    className="block w-full px-3 py-2 text-left font-mono text-sm hover:bg-papir-tmavsi"
                  >
                    {n}
                    {(index?.[n]?.length ?? 0) > 1 && (
                      <span className="popisek-uredni ml-2">{index![n]!.length}× v Praze</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label htmlFor={`${id}-cislo`} className="popisek-uredni">
            Číslo domu
          </label>
          <input
            id={`${id}-cislo`}
            type="text"
            value={cislo}
            onChange={(e) => setCislo(e.target.value)}
            placeholder="18/23"
            autoComplete="off"
            required
            inputMode="text"
            className="mt-1 w-full border border-inkoust bg-papir px-3 py-2 font-mono text-sm placeholder:text-seda-uredni"
          />
        </div>
        <button type="submit" className="border border-praha px-4 py-2 text-praha">
          Najít okrsek
        </button>
      </form>

      <p className="popisek-uredni mt-2">
        Číslo domu stačí orientační (ze štítku na domě) nebo popisné. Na diakritice nezáleží.
      </p>

      <div aria-live="polite" className="mt-6">
        {indexChyba && <p>Seznam ulic se nepodařilo načíst. Zkuste stránku obnovit.</p>}
        {stav.typ === 'hleda' && <p className="popisek-uredni">Hledám…</p>}
        {stav.typ === 'chyba' && <p>Data se nepodařilo načíst. Zkuste to znovu.</p>}
        {stav.typ === 'ulice-nenalezena' && (
          <p>
            Ulici <strong>{ulice.trim()}</strong> jsme v Praze nenašli. Zkuste ji vybrat z nabídky — název
            musí sedět celý. U adres bez ulice (Hradčany, Malá Strana) zadejte název části obce.
          </p>
        )}
        {stav.typ === 'cislo-nenalezeno' && (
          <p>
            Ulice <strong>{ulice.trim()}</strong> leží v části {stav.casti.join(' a ')}, ale číslo{' '}
            <strong>{cislo.trim()}</strong> v ní registr adres nezná. Zkuste druhé číslo z domovního
            štítku, nebo ověřte adresu v aplikaci{' '}
            <a href={KUDY_K_VOLBAM} className="odkaz-akcent" rel="noopener">
              Kudy k volbám
            </a>
            .
          </p>
        )}
        {stav.typ === 'nalezeno' && (
          <>
            {stav.vysledky.length > 1 && (
              <p className="mb-4">
                Zadání odpovídá {stav.vysledky.length} adresám — vyberte tu svou podle celého čísla.
              </p>
            )}
            <ul className="space-y-4">
              {stav.vysledky.map((v) => (
                <li key={`${v.mestskaCast}-${v.adm}`} className="border border-inkoust bg-papir p-4">
                  <p className="popisek-uredni">
                    {v.ulice} {v.cislo} · {v.nazevMC}
                  </p>
                  <p className="mt-1 font-display text-2xl">
                    Volební okrsek <span className="font-mono">{v.okrsek}</span>
                  </p>
                  {v.mistnost ? (
                    <div className="mt-3">
                      <p>
                        <strong>{v.mistnost.nazev}</strong>
                        {v.mistnost.adresa !== v.mistnost.nazev && <>, {v.mistnost.adresa}</>}
                        {v.mistnost.bezbarierova && <span className="popisek-uredni ml-2">bezbariérová</span>}
                      </p>
                      {v.mistnost.poznamka && <p className="mt-1 text-sm">{v.mistnost.poznamka}</p>}
                      <p className="popisek-uredni mt-2">
                        {POPIS_ZDROJE[v.mistnost.zdroj.typ]}
                        {v.mistnost.zdroj.url && (
                          <>
                            {' · '}
                            <a href={v.mistnost.zdroj.url} className="odkaz-akcent" rel="noopener">
                              zdroj
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm">
                      Adresu volební místnosti pro tento okrsek zatím neznáme. Zveřejní ji{' '}
                      {v.urlDesky ? (
                        <a href={v.urlDesky} className="odkaz-akcent" rel="noopener">
                          úřední deska {v.nazevMC}
                        </a>
                      ) : (
                        <>úřední deska {v.nazevMC}</>
                      )}{' '}
                      nejpozději 24. září 2026.
                    </p>
                  )}
                  <p className="popisek-uredni mt-3">
                    <Link href={`/mestska-cast/${v.mestskaCast}`} className="odkaz-akcent">
                      Kdo kandiduje v části {v.nazevMC}
                    </Link>
                    {' · '}registr adres ČÚZK k {new Date(v.stazeno).toLocaleDateString('cs-CZ')}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
