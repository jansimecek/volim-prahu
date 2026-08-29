import Link from 'next/link'
import type { Route } from 'next'

/**
 * `href` je obyčejný řetězec, ne `Route`. Typované cesty Nextu neumějí projít
 * přes pole hodnot sestavené v běhu (`/mestska-cast/${slug}`), a drobečky
 * jsou právě takový případ. Adresy skládají stránky ze svých vlastních
 * parametrů, takže se kontrolují tam, ne tady.
 */
export type Drobek = { popisek: string; href?: string }

/**
 * Drobečková navigace pro hluboké stránky.
 *
 * Většina čtenářů přijde z vyhledávače rovnou na profil kandidáta nebo
 * na program jedné strany. Bez cesty zpět je taková stránka slepá ulička:
 * čtenář neví, že existuje úroveň nad ní, ani jak se na ni dostat.
 *
 * Poslední drobek je aktuální stránka a nemá odkaz — odkaz sám na sebe
 * je pro odečítač obrazovky šum.
 */
export function Drobecky({ cesta }: { cesta: Drobek[] }) {
  if (cesta.length === 0) return null

  return (
    <nav aria-label="Drobečková navigace" className="drobecky">
      <ol className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {cesta.map((drobek, i) => {
          const posledni = i === cesta.length - 1
          return (
            <li key={`${drobek.popisek}-${i}`} className="flex items-baseline gap-2">
              {i > 0 && (
                <span aria-hidden="true" className="text-seda-uredni">
                  /
                </span>
              )}
              {drobek.href && !posledni ? (
                <Link href={drobek.href as Route} className="inline-block py-1">
                  {drobek.popisek}
                </Link>
              ) : (
                <span aria-current={posledni ? 'page' : undefined} className="py-1">
                  {drobek.popisek}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
