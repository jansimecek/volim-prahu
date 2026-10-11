import { datumCesky } from '@/lib/cestina'
import { nazevSubjektu, type Udalost, type Vyjednavani } from '@/lib/vyjednavani'
import type { ZastupitelstvoVysledek } from '@/lib/vysledky'

const POPIS_TYPU: Record<Udalost['typ'], string> = {
  vyjadreni: 'vyjádření',
  jednani: 'jednání',
  vylouceni: 'vyloučení spolupráce',
  memorandum: 'memorandum',
  'koalicni-smlouva': 'koaliční smlouva',
  rozpad: 'konec jednání nebo dohody',
  zasedani: 'zasedání zastupitelstva',
  volba: 'volba vedení',
}

/** Jak je událost doložená, jde ven vždycky a dřív než její obsah. */
const POPIS_DOKLADU: Record<Udalost['doklad'], string> = {
  dokument: 'zveřejněný dokument',
  usneseni: 'usnesení strany',
  citace: 'doslovná citace',
  parafraze: 'parafráze médií',
}

/**
 * Časová osa vyjednávání jednoho zastupitelstva, od nejnovějšího.
 * Zapisuje se jen doložené; co v ní chybí, jsme nedohledali — ne „nestalo se“.
 */
export function CasovaOsaVyjednavani({
  v,
  z,
}: {
  v: Vyjednavani
  z: ZastupitelstvoVysledek
}) {
  const zdrojPodleId = new Map(v.zdroje.map((x) => [x.id, x]))
  const nazev = (slug: string) => nazevSubjektu(z, slug)
  const udalosti = [...v.udalosti].sort((a, b) => b.datum.localeCompare(a.datum))

  return (
    <ol className="space-y-0">
      {udalosti.map((u) => (
        <li
          key={u.id}
          id={`udalost-${u.id}`}
          className="scroll-mt-20 border-b border-linka-silna py-4 last:border-b-0"
        >
          <p className="popisek-uredni">
            {[datumCesky(u.datum), POPIS_TYPU[u.typ], u.kdo, POPIS_DOKLADU[u.doklad]]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="mt-1 font-display font-medium">{u.subjekty.map(nazev).join(', ')}</p>

          {u.citace && (
            <blockquote className="mt-2 max-w-prose border-l-2 border-inkoust pl-4 font-cteci text-lg">
              {`„${u.citace.trim()}“`}
            </blockquote>
          )}

          <p className="mt-2 max-w-prose">{u.shrnuti}</p>

          {(u.sestava.length > 0 || u.vylucuje.length > 0) && (
            <dl className="mt-2 grid max-w-prose gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
              {u.sestava.length > 0 && (
                <>
                  <dt className="popisek-uredni">Sestava</dt>
                  <dd>{u.sestava.map(nazev).join(' + ')}</dd>
                </>
              )}
              {u.vylucuje.length > 0 && (
                <>
                  <dt className="popisek-uredni">Vylučuje</dt>
                  <dd>{u.vylucuje.map(nazev).join(', ')}</dd>
                </>
              )}
            </dl>
          )}

          <p className="popisek-uredni mt-3">
            {u.zdroje.map((id, i) => {
              const zdroj = zdrojPodleId.get(id)
              if (!zdroj) return null
              return (
                <span key={id}>
                  {i > 0 && ' · '}
                  <a href={zdroj.url} className="underline" rel="noopener nofollow">
                    {zdroj.medium}
                  </a>
                  , {datumCesky(zdroj.datum)}
                </span>
              )
            })}
          </p>
        </li>
      ))}
    </ol>
  )
}
