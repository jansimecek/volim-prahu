import Link from 'next/link'
import { MDXContent } from '@/components/mdx'
import { datumCesky } from '@/lib/cestina'
import type { RozhovorSOsobou } from '@/lib/rozhovory'

/**
 * Výpis rozhovorů. Používá ho samostatná rubrika i profil kandidáta.
 *
 * Vždycky jen odkaz, kdo s kým a kdy mluvil, a naše anotace. Text rozhovoru
 * je práce toho média a nepřebírá se — z webu se na něj odkazuje, nenahrazuje
 * se. Titulek uvádíme jako citaci zdroje, ne jako vlastní nadpis.
 */
export function Rozhovory({
  rozhovory,
  urovenNadpisu = 3,
  sJmenem = true,
}: {
  rozhovory: RozhovorSOsobou[]
  urovenNadpisu?: 2 | 3
  /** Na profilu kandidáta by se jméno opakovalo u každé položky. */
  sJmenem?: boolean
}) {
  const Nadpis = urovenNadpisu === 2 ? 'h2' : 'h3'
  if (rozhovory.length === 0) return null

  return (
    <div className="border-t border-inkoust">
      {rozhovory.map((r) => (
        <article key={r.slug} id={r.slug} className="scroll-mt-20 border-b border-linka-silna py-5">
          <p className="popisek-uredni">
            <time dateTime={r.datum}>{datumCesky(r.datum)}</time> · {r.medium}
            {r.zaPlacenouZdi && ' · za placenou zdí'}
          </p>

          <Nadpis className="mt-2 text-xl">
            <a href={r.odkaz} className="no-underline hover:underline" rel="noopener">
              {r.nadpis}
            </a>
          </Nadpis>

          {sJmenem && (
            <p className="mt-1 text-sm">
              <Link href={`/kandidat/${r.osoba}`} className="odkaz-akcent">
                {r.jmeno}
              </Link>
              {r.strana && <span className="text-seda-uredni"> · {r.strana}</span>}
            </p>
          )}

          <p className="mt-2 max-w-prose">{r.anotace}</p>

          <div className="proza max-w-prose">
            <MDXContent code={r.content} />
          </div>

          <p className="mt-3 text-sm">
            <a href={r.odkaz} className="odkaz-akcent inline-block py-1" rel="noopener">
              Číst rozhovor na webu {r.medium}
            </a>
          </p>
        </article>
      ))}
    </div>
  )
}
