import Link from 'next/link'
import { MDXContent } from '@/components/mdx'
import { ObrazekZpravicky } from '@/components/ObrazekZpravicky'
import { OKRUHY } from '@/lib/temata'
import { casCesky, hodinaCesky, type Zpravicka as Data } from '@/lib/zpravicky'

/**
 * Jedna zprávička.
 *
 * Ve výpisu se ukazuje shrnutí a odkaz na plné znění, na vlastní adrese
 * celý text. Nadpis je odkaz na permalink vždycky — zprávička, na kterou
 * se nedá odkázat, je k ničemu, až se na ni budete chtít po volbách
 * odvolat.
 *
 * Čas je v <time datetime>, ne v prostém spanu: čtečky, agregátory
 * a vyhledávače potřebují strojově čitelný okamžik, ne „11:19".
 */
export function Zpravicka({
  zpravicka,
  plne = false,
  urovenNadpisu = 3,
  jenCas = false,
}: {
  zpravicka: Data
  plne?: boolean
  urovenNadpisu?: 1 | 2 | 3
  /**
   * V proudu nese datum nadpis skupiny, u položky by se opakovalo — ve
   * volební den by na jedné stránce stálo desetkrát pod sebou. Atribut
   * `datetime` zůstává vždy úplný, ten čtou stroje.
   */
  jenCas?: boolean
}) {
  const Nadpis = urovenNadpisu === 1 ? 'h1' : urovenNadpisu === 2 ? 'h2' : 'h3'
  const okruh = OKRUHY.find((o) => o.id === zpravicka.okruh)

  return (
    <article id={zpravicka.slug} className="border-b border-linka-silna py-6 scroll-mt-20">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <time dateTime={zpravicka.vydano} className="popisek-uredni">
          {jenCas ? hodinaCesky(zpravicka.vydano) : casCesky(zpravicka.vydano)}
        </time>
        {okruh && (
          <Link href={{ pathname: '/temata', hash: okruh.id }} className="popisek-uredni">
            {okruh.nazev}
          </Link>
        )}
        {zpravicka.typ === 'provozni' && (
          <span className="popisek-uredni text-okr">Poznámka o webu</span>
        )}
        {zpravicka.obsahujePruzkum && (
          <span className="popisek-uredni text-okr">Obsahuje průzkum</span>
        )}
        {zpravicka.koncept && (
          <span className="popisek-uredni text-praha">Koncept — nepublikováno</span>
        )}
      </div>

      <Nadpis className={plne ? 'mt-2 text-3xl' : 'mt-2 text-xl'}>
        {plne ? (
          zpravicka.nadpis
        ) : (
          <Link href={`/zpravicky/${zpravicka.slug}`} className="no-underline hover:underline">
            {zpravicka.nadpis}
          </Link>
        )}
      </Nadpis>

      <p className="mt-2 max-w-prose">{zpravicka.shrnuti}</p>

      {zpravicka.obrazek && <ObrazekZpravicky obrazek={zpravicka.obrazek} />}

      {plne && (
        <div className="proza max-w-prose">
          <MDXContent code={zpravicka.content} />
        </div>
      )}

      {zpravicka.zdroje.length > 0 && (
        <div className="mt-4 max-w-prose">
          <p className="popisek-uredni">
            {zpravicka.zdroje.length === 1 ? 'Zdroj' : 'Zdroje'}
          </p>
          <ul className="mt-1 space-y-1 text-sm">
            {zpravicka.zdroje.map((z) => (
              <li key={z.url}>
                <a href={z.url} className="odkaz-akcent inline-block py-1" rel="noopener">
                  {z.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!plne && (
        <p className="mt-3 text-sm">
          <Link href={`/zpravicky/${zpravicka.slug}`} className="odkaz-akcent">
            Celá zprávička
          </Link>
        </p>
      )}
    </article>
  )
}
