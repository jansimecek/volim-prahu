'use client'

import type MiniSearch from 'minisearch'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  POPIS_TYPU,
  TYPY,
  hledej,
  nactiIndex,
  normalizuj,
  type Dokument,
  type TypZaznamu,
} from '@/lib/hledaniIndex'

const PO_STRANCE = 30

/**
 * Kam se nejčastěji míří. Nabízí se, dokud čtenář nic nenapsal — na telefonu
 * je to často rychlejší než psát.
 */
const RYCHLE_ODKAZY: readonly { href: Route; popisek: string }[] = [
  { href: '/kde-volim', popisek: 'Kde a jak volím' },
  { href: '/praha', popisek: 'Magistrát' },
  { href: '/mestska-cast', popisek: 'Městské části' },
  { href: '/senat', popisek: 'Senát' },
  { href: '/temata', popisek: 'Témata' },
]

/**
 * Vyhledávání po celém webu.
 *
 * Stejná komponenta žije na stránce /hledani i v okně, které se otevírá
 * z hlavičky. Rozdíly jsou dva: na stránce se dotaz propisuje do adresy
 * (`?q=`), aby šel výsledek poslat dál a aby fungovalo tlačítko Zpět;
 * v okně se po výběru zavolá `poVyberu`, aby se okno zavřelo.
 *
 * Výsledky jsou obyčejné odkazy, ne `role="listbox"`: dají se otevřít do
 * nového panelu, podržet na telefonu a odečítač je ohlásí jako odkazy.
 * Šipkami se mezi nimi dá přecházet z pole i zpátky — to je jediné, co
 * by z listboxu chybělo.
 */
export function Hledani({
  vOkne = false,
  vychoziDotaz = '',
  poVyberu,
}: {
  /** Dotaz z adresy stránky (`?q=`). */
  vychoziDotaz?: string
  /** Varianta do okna z hlavičky: bez propisování do adresy, s rychlými odkazy. */
  vOkne?: boolean
  poVyberu?: () => void
}) {
  const router = useRouter()
  const id = useId()
  const [dotaz, setDotaz] = useState(vychoziDotaz)
  const [index, setIndex] = useState<MiniSearch<Dokument> | null>(null)
  const [chyba, setChyba] = useState(false)
  const [filtr, setFiltr] = useState<TypZaznamu | null>(null)
  const [pocet, setPocet] = useState(PO_STRANCE)
  const pole = useRef<HTMLInputElement>(null)
  const seznam = useRef<HTMLUListElement>(null)
  const nacita = !index && !chyba && dotaz.trim().length > 0

  function spustNacteni() {
    if (index) return
    setChyba(false)
    nactiIndex()
      .then(setIndex)
      .catch(() => setChyba(true))
  }

  // Odkaz „hledani?q=novák" má rovnou ukázat výsledky, takže se s dotazem
  // z adresy rejstřík stahuje hned, ne až po zaměření pole.
  useEffect(() => {
    if (!vychoziDotaz) return
    nactiIndex()
      .then(setIndex)
      .catch(() => setChyba(true))
  }, [vychoziDotaz])

  // Na stránce se dotaz propisuje do adresy, aby šel výsledek poslat dál.
  useEffect(() => {
    if (vOkne) return
    const adresa = new URL(window.location.href)
    const hledane = dotaz.trim()
    if (hledane) adresa.searchParams.set('q', hledane)
    else adresa.searchParams.delete('q')
    window.history.replaceState(window.history.state, '', adresa)
  }, [dotaz, vOkne])

  const vsechny = useMemo(() => (index ? hledej(index, dotaz) : []), [index, dotaz])

  const podleTypu = useMemo(() => {
    const pocty = new Map<TypZaznamu, number>()
    for (const v of vsechny) pocty.set(v.typ, (pocty.get(v.typ) ?? 0) + 1)
    return pocty
  }, [vsechny])

  // Filtr, který po změně dotazu nic nenajde, by tvrdil „nic", i když
  // ostatní typy výsledky mají. Takový filtr se ignoruje.
  const aktivniFiltr = filtr && podleTypu.has(filtr) ? filtr : null
  const vyfiltrovane = aktivniFiltr ? vsechny.filter((v) => v.typ === aktivniFiltr) : vsechny
  const zobrazene = vyfiltrovane.slice(0, pocet)
  const kratky = dotaz.trim().length < 2

  function zmenDotaz(novy: string) {
    setDotaz(novy)
    setPocet(PO_STRANCE)
    spustNacteni()
  }

  function odkazy(): HTMLAnchorElement[] {
    return Array.from(seznam.current?.querySelectorAll<HTMLAnchorElement>('a[data-vysledek]') ?? [])
  }

  function naKlavesuVPoli(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      odkazy()[0]?.focus()
    } else if (e.key === 'Enter') {
      const prvni = zobrazene[0]
      if (!prvni) return
      e.preventDefault()
      router.push(prvni.url as Route)
      poVyberu?.()
    }
  }

  function naKlavesuVSeznamu(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const vsechnyOdkazy = odkazy()
    const kde = vsechnyOdkazy.indexOf(document.activeElement as HTMLAnchorElement)
    if (kde === -1) return
    e.preventDefault()
    const dalsi = e.key === 'ArrowDown' ? kde + 1 : kde - 1
    if (dalsi < 0) pole.current?.focus()
    else vsechnyOdkazy[Math.min(dalsi, vsechnyOdkazy.length - 1)]?.focus()
  }

  const stav = chyba
    ? 'Rejstřík se nepodařilo načíst.'
    : nacita
      ? 'Načítám rejstřík…'
      : kratky
        ? 'Zadejte alespoň dva znaky. Na diakritice nezáleží.'
        : vsechny.length === 0
          ? 'Nic jsme nenašli. Zkuste jen příjmení nebo kratší tvar slova.'
          : `Nalezeno: ${vsechny.length}`

  return (
    <div>
      <label htmlFor={`${id}-pole`} className="popisek-uredni">
        Kandidát, strana, městská část nebo téma
      </label>
      <div className="relative mt-1 max-w-xl">
        <input
          ref={pole}
          id={`${id}-pole`}
          type="search"
          // Klávesnice na telefonu ukáže „Hledat" místo „Enter".
          enterKeyHint="search"
          value={dotaz}
          onChange={(e) => zmenDotaz(e.target.value)}
          onFocus={spustNacteni}
          onKeyDown={naKlavesuVPoli}
          placeholder="např. Novák, Piráti, Řeporyje, bydlení"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={vOkne}
          aria-describedby={`${id}-stav`}
          // 16 px a víc: menší písmo v poli iOS při zaměření přiblíží celou
          // stránku a čtenář ji pak musí ručně oddalovat.
          className="w-full border border-inkoust bg-papir py-2.5 ps-10 pe-3 font-mono text-base placeholder:text-seda-uredni"
        />
        <Lupa className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-seda-uredni" />
      </div>

      <p id={`${id}-stav`} aria-live="polite" className="popisek-uredni mt-3">
        {stav}
        {chyba && (
          <>
            {' '}
            <button type="button" onClick={spustNacteni} className="odkaz-akcent uppercase">
              Zkusit znovu
            </button>
          </>
        )}
      </p>

      {vOkne && kratky && (
        <nav aria-label="Rychlé odkazy" className="mt-4">
          <ul className="flex flex-wrap gap-2">
            {RYCHLE_ODKAZY.map((o) => (
              <li key={o.href}>
                <Link
                  href={o.href}
                  onClick={poVyberu}
                  className="inline-block border border-linka-silna px-3 py-2 text-sm no-underline hover:border-inkoust"
                >
                  {o.popisek}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {podleTypu.size > 1 && (
        <div
          role="group"
          aria-label="Zúžit výsledky"
          // Na telefonu se filtry posouvají do strany místo zalamování —
          // tři řádky tlačítek by odsunuly výsledky pod první obrazovku.
          className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <Filtr aktivni={aktivniFiltr === null} onClick={() => setFiltr(null)}>
            Vše <span className="text-seda-uredni">{vsechny.length}</span>
          </Filtr>
          {TYPY.filter((t) => podleTypu.has(t.typ)).map((t) => (
            <Filtr
              key={t.typ}
              aktivni={aktivniFiltr === t.typ}
              onClick={() => {
                setFiltr(t.typ)
                setPocet(PO_STRANCE)
              }}
            >
              {t.mnozne} <span className="text-seda-uredni">{podleTypu.get(t.typ)}</span>
            </Filtr>
          ))}
        </div>
      )}

      {zobrazene.length > 0 && (
        <ul
          ref={seznam}
          onKeyDown={naKlavesuVSeznamu}
          className="mt-4 divide-y divide-linka-silna border-t border-b border-linka-silna"
        >
          {zobrazene.map((v) => (
            <li key={v.id}>
              {/* URL pochází z generovaného indexu, typované routy ho staticky neznají. */}
              <Link
                href={v.url as Route}
                data-vysledek
                onClick={poVyberu}
                className="block px-1 py-3 no-underline hover:bg-papir-tmavsi focus-visible:bg-papir-tmavsi"
              >
                <span className="font-display font-medium">
                  <Zvyrazneni text={v.nazev} terminy={v.terms} />
                </span>{' '}
                {/* Mezery jsou kvůli odečítači: bez nich by název odkazu
                    splynul v „Praha 5městská část". */}
                <span className="popisek-uredni ms-1 whitespace-nowrap">{POPIS_TYPU[v.typ]}</span>{' '}
                {v.popis && (
                  <span className="mt-0.5 line-clamp-2 text-sm leading-snug">
                    <Zvyrazneni text={v.popis} terminy={v.terms} />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {vyfiltrovane.length > zobrazene.length && (
        <button
          type="button"
          onClick={() => setPocet((p) => p + PO_STRANCE)}
          className="mt-4 w-full border border-inkoust px-4 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-papir-tmavsi sm:w-auto"
        >
          Zobrazit dalších {Math.min(PO_STRANCE, vyfiltrovane.length - zobrazene.length)} z{' '}
          {vyfiltrovane.length - zobrazene.length}
        </button>
      )}
    </div>
  )
}

function Filtr({
  aktivni,
  onClick,
  children,
}: {
  aktivni: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={aktivni}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap border px-3 py-1.5 font-mono text-xs ${
        aktivni ? 'border-inkoust bg-inkoust text-papir [&_span]:text-papir' : 'border-linka-silna hover:border-inkoust'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Zvýrazní v textu začátky slov, která odpovídají hledaným výrazům.
 *
 * MiniSearch vrací výrazy normalizované (bez diakritiky, malými písmeny),
 * takže se porovnává normalizovaná kopie textu. Normalizuje se po znacích,
 * aby pozice v kopii seděly s pozicemi v originálu.
 */
function Zvyrazneni({ text, terminy }: { text: string; terminy: string[] }) {
  if (terminy.length === 0) return <>{text}</>
  const znaky = Array.from(text)
  const normalizovane = znaky.map((z) => (normalizuj(z) || z).slice(0, 1))
  const kopie = normalizovane.join('')
  const oznacene = new Array<boolean>(znaky.length).fill(false)

  for (const termin of terminy) {
    if (!termin) continue
    let od = 0
    for (;;) {
      const kde = kopie.indexOf(termin, od)
      if (kde === -1) break
      // Jen na začátku slova — „ova" nemá rozsvítit půlku příjmení.
      const predchozi = kde > 0 ? kopie[kde - 1]! : ' '
      if (!/[\p{L}\p{N}]/u.test(predchozi)) {
        for (let i = kde; i < kde + termin.length && i < znaky.length; i++) oznacene[i] = true
      }
      od = kde + 1
    }
  }

  const kusy: { text: string; zvyraznit: boolean }[] = []
  znaky.forEach((z, i) => {
    const posledni = kusy[kusy.length - 1]
    if (posledni && posledni.zvyraznit === oznacene[i]) posledni.text += z
    else kusy.push({ text: z, zvyraznit: oznacene[i]! })
  })

  return (
    <>
      {kusy.map((k, i) =>
        k.zvyraznit ? (
          <mark key={i} className="bg-transparent text-inherit underline decoration-praha decoration-2 underline-offset-2">
            {k.text}
          </mark>
        ) : (
          <span key={i}>{k.text}</span>
        ),
      )}
    </>
  )
}

export function Lupa({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M12.5 12.5 17 17" strokeLinecap="square" />
    </svg>
  )
}

