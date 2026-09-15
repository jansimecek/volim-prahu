import Link from 'next/link'
import { MDXContent } from '@/components/mdx'
import { ObrazekAktuality } from '@/components/ObrazekAktuality'
import { OKRUHY } from '@/lib/temata'
import { casCesky, denCesky, hodinaCesky, type Aktualita as Data } from '@/lib/aktuality'

/**
 * Jedna aktualita.
 *
 * Ve výpisu se ukazuje shrnutí a odkaz na plné znění, na vlastní adrese
 * celý text. Nadpis je odkaz na permalink vždycky — aktualita, na kterou
 * se nedá odkázat, je k ničemu, až se na ni budete chtít po volbách
 * odvolat.
 *
 * Čas je v <time datetime>, ne v prostém spanu: čtečky, agregátory
 * a vyhledávače potřebují strojově čitelný okamžik, ne „11:19".
 */
export function Aktualita({
  aktualita,
  plne = false,
  urovenNadpisu = 3,
  jenCas = false,
  strucne = false,
}: {
  aktualita: Data
  plne?: boolean
  urovenNadpisu?: 1 | 2 | 3
  /**
   * V proudu nese datum nadpis skupiny, u položky by se opakovalo — ve
   * volební den by na jedné stránce stálo desetkrát pod sebou. Atribut
   * `datetime` zůstává vždy úplný, ten čtou stroje.
   */
  jenCas?: boolean
  /**
   * Stručný tvar pro titulní stranu: den bez hodiny a zdroje sbalené pod
   * zprávou. Ze stránky nezmizí — tvrzení o jmenovaných lidech bez zdroje
   * nevydáváme — ale tři plné názvy článků u každé zprávy zabíraly víc místa
   * než zpráva sama.
   */
  strucne?: boolean
}) {
  const Nadpis = urovenNadpisu === 1 ? 'h1' : urovenNadpisu === 2 ? 'h2' : 'h3'
  const okruh = OKRUHY.find((o) => o.id === aktualita.okruh)
  const pocetZdroju = aktualita.zdroje.length

  return (
    <article
      id={aktualita.slug}
      className={`border-b border-linka-silna scroll-mt-20 ${strucne ? 'py-5' : 'py-6'}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <time dateTime={aktualita.vydano} className="popisek-uredni">
          {jenCas
            ? hodinaCesky(aktualita.vydano)
            : strucne
              ? denCesky(aktualita.vydano)
              : casCesky(aktualita.vydano)}
        </time>
        {okruh && (
          <Link href={{ pathname: '/temata', hash: okruh.id }} className="popisek-uredni">
            {okruh.nazev}
          </Link>
        )}
        {aktualita.typ === 'provozni' && (
          <span className="popisek-uredni text-okr">Poznámka o webu</span>
        )}
        {aktualita.obsahujePruzkum && (
          <span className="popisek-uredni text-okr">Obsahuje průzkum</span>
        )}
        {aktualita.koncept && (
          <span className="popisek-uredni text-praha">Koncept — nepublikováno</span>
        )}
      </div>

      <Nadpis className={plne ? 'mt-2 text-3xl' : strucne ? 'mt-1.5 text-lg' : 'mt-2 text-xl'}>
        {plne ? (
          aktualita.nadpis
        ) : (
          <Link href={`/aktualne/${aktualita.slug}`} className="no-underline hover:underline">
            {aktualita.nadpis}
          </Link>
        )}
      </Nadpis>

      <p className={`max-w-prose ${strucne ? 'mt-1.5' : 'mt-2'}`}>{aktualita.shrnuti}</p>

      {aktualita.obrazek && <ObrazekAktuality obrazek={aktualita.obrazek} />}

      {plne && (
        <div className="proza max-w-prose">
          <MDXContent code={aktualita.content} />
        </div>
      )}

      {pocetZdroju > 0 && strucne && (
        <details className="mt-2 max-w-prose text-sm">
          <summary className="popisek-uredni cursor-pointer py-1">
            <span className="pl-1.5">{pocetZdroju === 1 ? 'Zdroj' : `Zdroje (${pocetZdroju})`}</span>
          </summary>
          <ul className="mt-1 space-y-1">
            {aktualita.zdroje.map((z) => (
              <li key={z.url}>
                <a href={z.url} className="odkaz-akcent inline-block py-1" rel="noopener">
                  {z.text}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {pocetZdroju > 0 && !strucne && (
        <div className="mt-4 max-w-prose">
          <p className="popisek-uredni">
            {pocetZdroju === 1 ? 'Zdroj' : 'Zdroje'}
          </p>
          <ul className="mt-1 space-y-1 text-sm">
            {aktualita.zdroje.map((z) => (
              <li key={z.url}>
                <a href={z.url} className="odkaz-akcent inline-block py-1" rel="noopener">
                  {z.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!plne && !strucne && (
        <p className="mt-3 text-sm">
          <Link href={`/aktualne/${aktualita.slug}`} className="odkaz-akcent">
            Celá aktualita
          </Link>
        </p>
      )}
    </article>
  )
}
