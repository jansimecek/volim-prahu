'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { bezDiakritiky } from '@/lib/slug'
import type { Zastupitelstvo } from '@/lib/typy'

const normalizuj = (text: string) => bezDiakritiky(text).toLowerCase()

export function SeznamMestskychCasti({ casti }: { casti: Zastupitelstvo[] }) {
  const [dotaz, setDotaz] = useState('')

  const nalezene = useMemo(() => {
    const hledane = normalizuj(dotaz.trim())
    if (!hledane) return casti
    return casti.filter((mc) => normalizuj(mc.nazev).includes(hledane))
  }, [casti, dotaz])

  return (
    <div>
      <div className="max-w-md">
        <label htmlFor="hledani-mc" className="popisek-uredni">
          Najít městskou část
        </label>
        <input
          id="hledani-mc"
          type="search"
          value={dotaz}
          onChange={(e) => setDotaz(e.target.value)}
          placeholder="například Praha 7 nebo Kunratice"
          autoComplete="off"
          className="mt-1 w-full border border-inkoust bg-papir px-3 py-2 font-mono text-sm placeholder:text-seda-uredni"
        />
      </div>

      <p aria-live="polite" className="popisek-uredni mt-3">
        {nalezene.length === casti.length
          ? `${casti.length} městských částí`
          : `Nalezeno: ${nalezene.length}`}
      </p>

      {nalezene.length === 0 ? (
        <p className="mt-6">Nic takového v Praze není. Zkuste jiný název.</p>
      ) : (
        <ul className="mt-4 grid gap-px border border-inkoust bg-linka sm:grid-cols-2 lg:grid-cols-3">
          {nalezene.map((mc) => (
            <li key={mc.slug} className="bg-papir">
              <Link
                href={`/mestska-cast/${mc.slug}`}
                className="flex h-full items-baseline justify-between gap-3 p-3 no-underline hover:bg-papir-tmavsi"
              >
                <span className="font-display font-medium">{mc.nazev}</span>
                <span className="popisek-uredni whitespace-nowrap">{mc.mandaty} mandátů</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
