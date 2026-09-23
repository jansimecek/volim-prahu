'use client'

import Link from 'next/link'
import { useId, useMemo, useRef, useState } from 'react'
import type { OdpovedOkrsku } from '@/app/api/okrsky/[slug]/route'
import { MapaOkrsku } from '@/components/MapaOkrsku'
import { vzdalenostMetru } from '@/lib/geokodovani'
import type { Mistnost } from '@/lib/mistnostiTypy'
import { najdiAdresu, normalizujUlici, type NalezenaAdresa } from '@/lib/okrskyHledani'
import { dosad } from '@/lib/sablony'
import { Parkovani } from '@/components/Parkovani'
import { Zastavka } from '@/components/Zastavka'
import type { Preklad } from '@/preklady'
import { LOCALE_CESKY, VYHLEDAVAC_CESKY } from '@/preklady/vyhledavacCesky'

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
 *
 * Texty bere zvenčí, aby tentýž vyhledávač obsloužil českou i cizojazyčnou
 * stránku. Přeložit se musí i stavy, kdy nic nenajde: hlášku „ulici jsme
 * nenašli" v češtině nepřečte ten, kdo česky neumí, a odejde s dojmem, že
 * je nástroj rozbitý. Názvy ulic a městských částí zůstávají české — jsou
 * to jména míst, ne text k překladu, a člověk je musí poznat na ceduli.
 */

type IndexUlic = Record<string, string[]>

type Vysledek = NalezenaAdresa & {
  mestskaCast: string
  nazevMC: string
  mistnost?: Mistnost
  okoliParkovaniMetru: number
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

const MAX_NAPOVED = 8

const cacheCasti = new Map<string, Promise<OdpovedOkrsku>>()

/** „450 m", nad kilometr „1,3 km" — přesnost na metry by byla falešná. */
export function popisVzdalenosti(
  metru: number,
  texty: Preklad['vyhledavac'],
  locale: string,
): string {
  if (metru < 40) return texty.naAdrese
  const vzdalenost =
    metru < 1000
      ? `${Math.max(50, Math.round(metru / 50) * 50)} ${texty.jednotkaM}`
      : `${(Math.round(metru / 100) / 10).toLocaleString(locale)} ${texty.jednotkaKm}`
  return dosad(texty.vzdusnouCarou, { vzdalenost })
}

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

export function VyhledavacOkrsku({
  texty = VYHLEDAVAC_CESKY,
  locale = LOCALE_CESKY,
}: {
  texty?: Preklad['vyhledavac']
  locale?: string
} = {}) {
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
          okoliParkovaniMetru: cast.okoliParkovaniMetru,
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
            {texty.ulice}
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
            placeholder={texty.ulicePlaceholder}
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
              aria-label={texty.navrhyUlic}
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
                      <span className="popisek-uredni ml-2">
                        {dosad(texty.vicekrat, { pocet: index![n]!.length })}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label htmlFor={`${id}-cislo`} className="popisek-uredni">
            {texty.cisloDomu}
          </label>
          <input
            id={`${id}-cislo`}
            type="text"
            value={cislo}
            onChange={(e) => setCislo(e.target.value)}
            placeholder={texty.cisloPlaceholder}
            autoComplete="off"
            required
            inputMode="text"
            className="mt-1 w-full border border-inkoust bg-papir px-3 py-2 font-mono text-sm placeholder:text-seda-uredni"
          />
        </div>
        <button type="submit" className="border border-praha px-4 py-2 text-praha">
          {texty.odeslat}
        </button>
      </form>

      <p className="popisek-uredni mt-2">{texty.napovedaCisla}</p>

      <div aria-live="polite" className="mt-6">
        {indexChyba && <p>{texty.indexChyba}</p>}
        {stav.typ === 'hleda' && <p className="popisek-uredni">{texty.hleda}</p>}
        {stav.typ === 'chyba' && <p>{texty.chyba}</p>}
        {stav.typ === 'ulice-nenalezena' && (
          <p>{dosad(texty.uliceNenalezena, { ulice: `„${ulice.trim()}"` })}</p>
        )}
        {stav.typ === 'cislo-nenalezeno' && (
          <p>
            {dosad(texty.cisloNenalezeno, {
              ulice: `„${ulice.trim()}"`,
              casti: stav.casti.join(' + '),
              cislo: cislo.trim(),
            })}
          </p>
        )}
        {stav.typ === 'nalezeno' && (
          <>
            {stav.vysledky.length > 1 && (
              <p className="mb-4">{dosad(texty.viceAdres, { pocet: stav.vysledky.length })}</p>
            )}
            <ul className="space-y-4">
              {stav.vysledky.map((v) => (
                <li key={`${v.mestskaCast}-${v.adm}`} className="border border-inkoust bg-papir p-4">
                  <p className="popisek-uredni">
                    {v.ulice} {v.cislo} · {v.nazevMC}
                  </p>
                  <p className="mt-1 font-display text-2xl">
                    {texty.volebniOkrsek} <span className="font-mono">{v.okrsek}</span>
                  </p>
                  {v.mistnost ? (
                    <div className="mt-3">
                      <p>
                        <strong>{v.mistnost.nazev}</strong>
                        {v.mistnost.adresa !== v.mistnost.nazev && <>, {v.mistnost.adresa}</>}
                        {v.mistnost.bezbarierova && (
                          <span className="popisek-uredni ml-2">{texty.bezbarierova}</span>
                        )}
                      </p>
                      {v.mistnost.poznamka && <p className="mt-1 text-sm">{v.mistnost.poznamka}</p>}
                      {v.mistnost.zastavka && (
                        <Zastavka zastavka={v.mistnost.zastavka} texty={texty} locale={locale} />
                      )}
                      {v.mistnost.zona !== undefined && (
                        <Parkovani
                          zona={v.mistnost.zona}
                          okoliMetru={v.okoliParkovaniMetru}
                          texty={texty}
                        />
                      )}
                      {v.mistnost.poloha && (
                        <p className="mt-1 text-sm">
                          {popisVzdalenosti(
                            vzdalenostMetru(v.poloha, v.mistnost.poloha),
                            texty,
                            locale,
                          )}
                        </p>
                      )}
                      <p className="popisek-uredni mt-2">
                        {texty.zdrojeMistnosti[v.mistnost.zdroj.typ]}
                        {v.mistnost.zdroj.url && (
                          <>
                            {' · '}
                            <a href={v.mistnost.zdroj.url} className="odkaz-akcent" rel="noopener">
                              {texty.zdroj}
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm">
                      {texty.mistnostNeznamaUvod}
                      {v.urlDesky ? (
                        <a href={v.urlDesky} className="odkaz-akcent" rel="noopener">
                          {dosad(texty.uredniDeska, { mc: v.nazevMC })}
                        </a>
                      ) : (
                        dosad(texty.uredniDeska, { mc: v.nazevMC })
                      )}
                      {texty.mistnostNeznamaLhuta}
                    </p>
                  )}
                  <MapaOkrsku
                    mestskaCast={v.mestskaCast}
                    okrsek={v.okrsek}
                    poloha={v.poloha}
                    popisAdresy={`${v.ulice} ${v.cislo}`}
                    mistnost={
                      v.mistnost?.poloha ? { nazev: v.mistnost.nazev, poloha: v.mistnost.poloha } : undefined
                    }
                    texty={texty.mapa}
                  />
                  <p className="popisek-uredni mt-3">
                    <Link href={`/mestska-cast/${v.mestskaCast}`} className="odkaz-akcent" hrefLang="cs">
                      {dosad(texty.kdoKandiduje, { mc: v.nazevMC })}
                    </Link>
                    {' · '}
                    {dosad(texty.registrAdres, {
                      datum: new Date(v.stazeno).toLocaleDateString(locale),
                    })}
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
