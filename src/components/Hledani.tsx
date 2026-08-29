'use client'

import MiniSearch from 'minisearch'
import type { Route } from 'next'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { bezDiakritiky } from '@/lib/slug'

type Zaznam = [nazev: string, popis: string, url: string, typ: 'k' | 's' | 'm' | 'p' | 'z']
type Dokument = { id: number; nazev: string; popis: string; url: string; typ: Zaznam[3] }

const POPIS_TYPU: Record<Zaznam[3], string> = {
  k: 'kandidát',
  s: 'volební strana',
  m: 'městská část',
  p: 'stránka',
  z: 'zprávička',
}

/** Index se hledá bez ohledu na diakritiku — „novak" musí najít Nováka. */
const normalizuj = (term: string) => bezDiakritiky(term).toLowerCase()

export function Hledani() {
  const [dotaz, setDotaz] = useState('')
  const [index, setIndex] = useState<MiniSearch<Dokument> | null>(null)
  const [nacita, setNacita] = useState(false)
  const [chyba, setChyba] = useState(false)
  const nacteniSpusteno = useRef(false)

  async function nactiIndex() {
    if (nacteniSpusteno.current) return
    nacteniSpusteno.current = true
    setNacita(true)
    try {
      const odpoved = await fetch('/hledani.json')
      const data = (await odpoved.json()) as Zaznam[]
      const dokumenty: Dokument[] = data.map(([nazev, popis, url, typ], i) => ({
        id: i,
        nazev,
        popis,
        url,
        typ,
      }))
      const ms = new MiniSearch<Dokument>({
        fields: ['nazev', 'popis'],
        storeFields: ['nazev', 'popis', 'url', 'typ'],
        processTerm: (term) => normalizuj(term),
        searchOptions: { prefix: true, fuzzy: 0.15, boost: { nazev: 3 } },
      })
      ms.addAll(dokumenty)
      setIndex(ms)
    } catch {
      setChyba(true)
    } finally {
      setNacita(false)
    }
  }

  const vysledky = useMemo(() => {
    const hledane = dotaz.trim()
    if (!index || hledane.length < 2) return []
    return index
      .search(hledane, { prefix: true, fuzzy: 0.15 })
      .slice(0, 40) as unknown as (Dokument & { score: number })[]
  }, [index, dotaz])

  return (
    <div>
      <label htmlFor="hledani" className="popisek-uredni">
        Jméno kandidáta, volební strana nebo městská část
      </label>
      <input
        id="hledani"
        type="search"
        value={dotaz}
        onChange={(e) => {
          setDotaz(e.target.value)
          void nactiIndex()
        }}
        onFocus={() => void nactiIndex()}
        placeholder="například Novák, Piráti nebo Řeporyje"
        autoComplete="off"
        className="mt-1 w-full max-w-xl border border-inkoust bg-papir px-3 py-2 font-mono text-sm placeholder:text-seda-uredni"
      />

      <p aria-live="polite" className="popisek-uredni mt-3">
        {chyba
          ? 'Index se nepodařilo načíst. Zkuste stránku obnovit.'
          : nacita
            ? 'Načítám rejstřík…'
            : dotaz.trim().length < 2
              ? 'Zadejte alespoň dva znaky. Na diakritice nezáleží.'
              : `Nalezeno: ${vysledky.length}${vysledky.length === 40 ? ' (zobrazeno prvních 40)' : ''}`}
      </p>

      {vysledky.length > 0 && (
        <ul className="mt-4 divide-y divide-linka-silna border-t border-b border-linka-silna">
          {vysledky.map((v) => (
            <li key={v.id} className="py-3">
              {/* URL pochází z generovaného indexu, typované routy ho staticky neznají. */}
              <Link href={v.url as Route} className="block no-underline hover:bg-papir-tmavsi">
                <span className="font-display font-medium">{v.nazev}</span>
                <span className="popisek-uredni ml-2">{POPIS_TYPU[v.typ]}</span>
                {v.popis && <span className="mt-0.5 block text-sm">{v.popis}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
