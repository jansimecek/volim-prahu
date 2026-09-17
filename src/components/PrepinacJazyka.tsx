'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  JAZYKY,
  POPIS_JAZYKA,
  VLAJKA_CESKY,
  ceskyProtejsek,
  cizojazycnyProtejsek,
  odstranJazyk,
  type Jazyk,
} from '@/lib/jazyky'

/**
 * Přepínač jazyků.
 *
 * Tohle je jediná cesta, jak se cizinec k přeložené části dostane — bez něj
 * by anglická a ukrajinská verze existovaly jen pro toho, kdo zná adresu.
 * Proto je v hlavičce každé stránky, ne v patičce.
 *
 * Názvy jazyků jsou zásadně v jazyce samotném („English", „Українська"),
 * nikdy přeložené do jazyka aktuální stránky: kdo neumí česky, nepozná
 * „anglicky", a kdo neumí anglicky, nepozná „Ukrainian".
 *
 * Vlajka je u nich proto, že se hledá očima rychleji než slovo — a na
 * telefonu, kde je přepínač namačkaný do dvou řádků, to rozhoduje.
 * U angličtiny je vlajka EU, ne britská: angličtina tu nezastupuje stát,
 * ale roli dorozumívacího jazyka, a zároveň je to přesně ta skupina,
 * které volební právo v obci vzniká. Vlajka nikdy nestojí sama — název
 * jazyka je vedle ní a vlajka je pro odečítač skrytá, protože „vlajka:
 * Evropská unie" před slovem „English" je jen šum.
 *
 * Na Windows se vlajkové emoji vykreslují jako dvojice písmen („EU",
 * „SK"). Není to hezké, ale je to čitelné a název jazyka nese význam tak
 * jako tak.
 *
 * `hrefLang` na odkazu říká prohlížeči i vyhledávači, v jakém jazyce je
 * cíl; `lang` na textu říká odečítači, jak ho má vyslovit.
 */
export function PrepinacJazyka({ aktualni }: { aktualni?: Jazyk }) {
  const cesta = usePathname()
  const zbytek = odstranJazyk(cesta)
  // Z české stránky, která má doslovný protějšek, vede přepínač rovnou na
  // něj; odjinud na rozcestník jazyka.
  const protejsek = aktualni ? null : cizojazycnyProtejsek(cesta)

  const polozky: {
    klic: string
    href: string
    popisek: string
    lang: string
    vlajka: string
  }[] = [
    {
      klic: 'cs',
      href: aktualni ? ceskyProtejsek(zbytek) : cesta,
      popisek: 'Čeština',
      lang: 'cs',
      vlajka: VLAJKA_CESKY,
    },
    ...JAZYKY.map((j) => ({
      klic: j,
      vlajka: POPIS_JAZYKA[j].vlajka,
      href: aktualni ? `/${j}${zbytek}` : `/${j}${protejsek ? `/${protejsek}` : ''}`,
      popisek: POPIS_JAZYKA[j].vlastni,
      lang: POPIS_JAZYKA[j].htmlLang,
    })),
  ]

  return (
    <nav aria-label="Language / Мова / Jazyk">
      <ul className="flex flex-wrap items-baseline gap-x-4 gap-y-0">
        {polozky.map((p) => {
          const zde = p.klic === (aktualni ?? 'cs')
          return (
            <li key={p.klic}>
              {zde ? (
                <span className="odkaz-jazyk" aria-current="true">
                  <Vlajka znak={p.vlajka} />
                  <span lang={p.lang}>{p.popisek}</span>
                </span>
              ) : (
                <Link
                  href={p.href as Route}
                  hrefLang={p.lang}
                  className="odkaz-jazyk"
                >
                  <Vlajka znak={p.vlajka} />
                  <span lang={p.lang}>{p.popisek}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Vlajka je dekorace vedle názvu jazyka, ne informace sama o sobě —
 * `aria-hidden` ji drží mimo odečítač.
 */
function Vlajka({ znak }: { znak: string }) {
  return (
    <span aria-hidden="true" className="text-sm leading-none">
      {znak}
    </span>
  )
}
