'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { JAZYKY, POPIS_JAZYKA, ceskyProtejsek, cizojazycnyProtejsek, type Jazyk } from '@/lib/jazyky'

/**
 * Přepínač jazyků.
 *
 * Tohle je jediná cesta, jak se cizinec k přeložené části dostane — bez něj
 * by anglická a ukrajinská verze existovaly jen pro toho, kdo zná adresu.
 * Proto je v hlavičce každé stránky, ne v patičce.
 *
 * Názvy jazyků jsou zásadně v jazyce samotném („English", „Українська"),
 * nikdy přeložené do jazyka aktuální stránky: kdo neumí česky, nepozná
 * „anglicky", a kdo neumí anglicky, nepozná „Ukrainian". Vlajky se
 * nepoužívají — jazyk není stát a ukrajinština se v Praze mluví i lidmi,
 * kteří ukrajinské občanství nemají.
 *
 * `hrefLang` na odkazu říká prohlížeči i vyhledávači, v jakém jazyce je
 * cíl; `lang` na textu říká odečítači, jak ho má vyslovit.
 */
export function PrepinacJazyka({ aktualni }: { aktualni?: Jazyk }) {
  const cesta = usePathname()
  const zbytek = cesta.replace(/^\/(en|uk)(?=\/|$)/, '')
  // Z české stránky, která má doslovný protějšek, vede přepínač rovnou na
  // něj; odjinud na rozcestník jazyka.
  const protejsek = aktualni ? null : cizojazycnyProtejsek(cesta)

  const polozky: { klic: string; href: string; popisek: string; lang: string }[] = [
    {
      klic: 'cs',
      href: aktualni ? ceskyProtejsek(zbytek) : cesta,
      popisek: 'Čeština',
      lang: 'cs',
    },
    ...JAZYKY.map((j) => ({
      klic: j,
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
                <span className="odkaz-navigace" aria-current="true" lang={p.lang}>
                  {p.popisek}
                </span>
              ) : (
                <Link
                  href={p.href as Route}
                  hrefLang={p.lang}
                  lang={p.lang}
                  className="odkaz-navigace"
                >
                  {p.popisek}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
