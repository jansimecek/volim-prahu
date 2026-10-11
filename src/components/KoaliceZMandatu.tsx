'use client'

import { useId, useMemo, useState } from 'react'
import { minimalniKoalice, vetsina } from '@/lib/koalice'

export type SubjektKoalice = { slug: string; nazev: string; mandaty: number }
export type VylouceniKoalice = {
  kdo: string
  koho: string
  /** Kam vede odkaz na doložení. */
  href: string
  kdy: 'pred-volbami' | 'po-volbach'
}

function mandatu(n: number): string {
  if (n === 1) return '1 mandát'
  if (n >= 2 && n <= 4) return `${n} mandáty`
  return `${n} mandátů`
}

/**
 * Koalice z konečných mandátů.
 *
 * Stejné zásady jako předvolební kalkulačka: ukazuje aritmetiku, ne
 * pravděpodobnost. Sestavy se neřadí podle mandátů a u každé se vyznačí jen
 * doložená vyloučení — chybějící vyloučení neznamená, že se strany dohodnou.
 */
export function KoaliceZMandatu({
  subjekty,
  celkem,
  vylouceni,
}: {
  subjekty: readonly SubjektKoalice[]
  celkem: number
  vylouceni: readonly VylouceniKoalice[]
}) {
  const predpona = useId()
  const [vybrane, setVybrane] = useState<string[]>([])
  const cil = vetsina(celkem)
  const nazev = (slug: string) => subjekty.find((s) => s.slug === slug)?.nazev ?? slug

  const sestavy = useMemo(
    () =>
      minimalniKoalice(
        subjekty.map((s) => ({ id: s.slug, mandaty: s.mandaty })),
        celkem,
        vylouceni.map((v) => ({ kdo: v.kdo, koho: v.koho, deklarace: v.href })),
      ),
    [subjekty, celkem, vylouceni],
  )
  const samostatna = sestavy.find((k) => k.clenove.length === 1)

  const soucet = subjekty.filter((s) => vybrane.includes(s.slug)).reduce((n, s) => n + s.mandaty, 0)
  const konflikty = vylouceni.filter((v) => vybrane.includes(v.kdo) && vybrane.includes(v.koho))

  return (
    <div className="space-y-8">
      {samostatna ? (
        <p className="max-w-prose border-l-2 border-praha pl-5">
          <span className="popisek-uredni block">Většina jedné strany</span>
          {nazev(samostatna.clenove[0]!)} má sama {mandatu(samostatna.mandaty)} z {celkem}, tedy
          nadpoloviční většinu. Radu může sestavit bez koaličního partnera.
        </p>
      ) : (
        <div>
          <h3 className="text-xl">Nejmenší sestavy s většinou</h3>
          <p className="popisek-uredni mt-1">
            Většina je {cil} z {celkem} · po odebrání kteréhokoli člena by sestava většinu ztratila ·
            řazeno podle počtu členů, ne podle šance
          </p>
          <ul className="mt-4 grid gap-px border border-inkoust bg-linka-silna sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2">
            {sestavy.map((k) => (
              <li key={k.clenove.join('+')} className="bg-papir p-3">
                <p>{k.clenove.map(nazev).join(' + ')}</p>
                <p className="popisek-uredni mt-1">
                  {mandatu(k.mandaty)} · rezerva {k.mandaty - cil}
                </p>
                {k.vylouceni.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-sm text-praha">
                    {k.vylouceni.map((v) => {
                      const puvodni = vylouceni.find((x) => x.href === v.deklarace)
                      return (
                        <li key={`${v.kdo}>${v.koho}>${v.deklarace}`}>
                          <a href={v.deklarace} className="underline">
                            {nazev(v.kdo)} vylučuje {nazev(v.koho)}
                          </a>
                          {puvodni?.kdy === 'pred-volbami' && ' (před volbami)'}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="border border-inkoust p-4 sm:p-5">
        <legend className="px-2 font-display text-lg font-medium">Sestavte si koalici</legend>
        <ul className="grid gap-2 sm:grid-cols-2">
          {subjekty.map((s) => {
            const id = `${predpona}-${s.slug}`
            return (
              <li key={s.slug} className="flex items-baseline gap-2">
                <input
                  id={id}
                  type="checkbox"
                  className="size-4 accent-inkoust"
                  checked={vybrane.includes(s.slug)}
                  onChange={(e) =>
                    setVybrane((v) => (e.target.checked ? [...v, s.slug] : v.filter((x) => x !== s.slug)))
                  }
                />
                <label htmlFor={id}>
                  {s.nazev} <span className="font-mono text-sm">{s.mandaty}</span>
                </label>
              </li>
            )
          })}
        </ul>
        <p className="mt-4" aria-live="polite">
          {vybrane.length === 0 ? (
            <span className="text-seda-uredni">Zaškrtněte strany a uvidíte, jestli mají většinu.</span>
          ) : soucet >= cil ? (
            <span>
              <strong>{mandatu(soucet)}</strong> — většina, rezerva {soucet - cil}.
            </span>
          ) : (
            <span>
              <strong>{mandatu(soucet)}</strong> — k většině chybí {cil - soucet}.
            </span>
          )}
        </p>
        {konflikty.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-sm text-praha">
            {konflikty.map((v) => (
              <li key={`${v.kdo}>${v.koho}>${v.href}`}>
                <a href={v.href} className="underline">
                  {nazev(v.kdo)} vylučuje spolupráci s {nazev(v.koho)}
                </a>
                {v.kdy === 'pred-volbami' && ' (před volbami)'}
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </div>
  )
}
