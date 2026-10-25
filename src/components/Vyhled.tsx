import type { Route } from 'next'
import Link from 'next/link'
import { vysledekZastupitelstva } from '@/lib/konecneVysledky'
import { POPIS_DRUHU, type Termin } from '@/lib/vyhled'

const denMesic = new Intl.DateTimeFormat('cs-CZ', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Prague',
})

/** Poledne UTC, aby přechod na zimní čas neposunul den. */
const den = (iso: string) => denMesic.format(new Date(`${iso}T12:00:00Z`))

/** Kterého zastupitelstva se termín týká a kam z něj vede odkaz. */
export function mistoTerminu(t: Termin): { nazev: string; href?: Route } {
  if (t.zastupitelstvo === null) return { nazev: 'Všechna zastupitelstva' }
  if (t.zastupitelstvo === 'senat') return { nazev: 'Senát', href: '/senat' }
  const kotva = t.udalost ? `#udalost-${t.udalost}` : ''
  if (t.zastupitelstvo === 'magistrat') return { nazev: 'Magistrát', href: `/koalice${kotva || '#magistrat'}` as Route }
  const nazev = vysledekZastupitelstva(t.zastupitelstvo)?.nazev ?? t.zastupitelstvo
  return { nazev, href: `/mestska-cast/${t.zastupitelstvo}${kotva}` as Route }
}

/** Proč řízení u soudu posouvá zasedání; platí pro všechna stejně, vypisuje se jednou. */
const SOUD_LHUTY =
  'Soud rozhoduje do 20 dnů od podání (§ 90 odst. 3 s. ř. s.), ustavující zasedání pak musí být do 15 dnů od právní moci rozhodnutí o posledním návrhu.'

/** Po sobě jdoucí řízení u soudu se stejnou lhůtou se vypisují jako jedna položka. */
type Skupina = [Termin, ...Termin[]]

function seskup(terminy: Termin[]): Skupina[] {
  const skupiny: Skupina[] = []
  for (const t of terminy) {
    const posledni = skupiny.at(-1)
    if (posledni && t.druh === 'soud' && posledni[0].druh === 'soud' && posledni[0].platiDo === t.platiDo) {
      posledni.push(t)
    } else {
      skupiny.push([t])
    }
  }
  return skupiny
}

function Misto({ t }: { t: Termin }) {
  const misto = mistoTerminu(t)
  return misto.href ? (
    <Link href={misto.href} className="underline">
      {misto.nazev}
    </Link>
  ) : (
    <>{misto.nazev}</>
  )
}

function Zdroj({ t }: { t: Termin }) {
  return (
    <p className="popisek-uredni mt-1">
      Zdroj:{' '}
      <a href={t.zdroj.url} className="underline" rel="noopener nofollow">
        {t.zdroj.text}
      </a>
    </p>
  )
}

/**
 * Svislá osa nadcházejících termínů. Zákonná lhůta, svolané zasedání a řízení
 * u soudu mají plnou značku, ohlášený plán prázdnou: plán se může změnit,
 * lhůta ne.
 */
export function Vyhled({ terminy }: { terminy: Termin[] }) {
  return (
    <ol className="relative mt-4 border-l-2 border-inkoust">
      {seskup(terminy).map((skupina) => {
        const t = skupina[0]
        const plny = t.druh !== 'ohlaseno'
        return (
          <li key={t.id} className="relative pb-6 pl-6 last:pb-0 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-x-6 sm:pl-8">
            <span
              aria-hidden="true"
              className={`absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-inkoust ${
                plny ? 'bg-inkoust' : 'bg-papir'
              }`}
            />
            <p className="font-display font-semibold">{t.kdy ?? den(t.datum)}</p>
            {skupina.length > 1 ? (
              <div className="max-w-prose">
                <p className="popisek-uredni">{POPIS_DRUHU[t.druh]}</p>
                <p className="mt-1 font-display font-medium">Soud rozhodne o návrzích na neplatnost voleb</p>
                <ul className="mt-1 space-y-1">
                  {skupina.map((s) => (
                    <li key={s.id}>
                      <Misto t={s} />: {s.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-1">{SOUD_LHUTY}</p>
                <Zdroj t={t} />
              </div>
            ) : (
              <div className="max-w-prose">
                <p className="popisek-uredni">
                  <Misto t={t} /> · {POPIS_DRUHU[t.druh]}
                </p>
                <p className="mt-1 font-display font-medium">{t.nadpis}</p>
                <p className="mt-1">{t.text}</p>
                {t.druh === 'soud' && <p className="mt-1">{SOUD_LHUTY}</p>}
                {t.podminka && <p className="mt-1 text-sm italic">Platí, {t.podminka}.</p>}
                <Zdroj t={t} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
