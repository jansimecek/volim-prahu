import type { Route } from 'next'
import { PopiskyMapy } from '@/components/PopiskyMapy'
import { vetsina } from '@/lib/koalice'
import { KONECNE_VYSLEDKY, slugStrany, stranySMandaty } from '@/lib/konecneVysledky'
import { mapaPrahy } from '@/lib/mapaPrahy'
import {
  dohodnutaSestava,
  nazevSubjektu,
  POPIS_STAVU,
  stavVyjednavani,
  vyjednavaniZastupitelstva,
  type Stav,
} from '@/lib/vyjednavani'

/**
 * Mapa 57 městských částí: barva říká, kam došlo vyjednávání (jeden odstín,
 * od jednání po zvolené vedení — pořadová škála ověřená proti papíru webu),
 * šrafování, že vítěz voleb v dohodnuté sestavě není, a silný obrys, že jedna
 * strana má většinu sama. Výsledky a sestavu ukáže popisek; tabulkou k mapě
 * je seznam částí pod ní a stránka každé části.
 */

const BARVA: Record<Stav, string> = {
  'bez-zprav': '#d9dad5',
  jednani: '#6da7ec',
  dohoda: '#3987e5',
  memorandum: '#256abf',
  'koalicni-smlouva': '#184f95',
  'zvoleno-vedeni': '#0d366b',
}

/** Na tmavých stupních se popisek i šrafa kreslí papírem, na světlých inkoustem. */
const TMAVA: ReadonlySet<Stav> = new Set(['memorandum', 'koalicni-smlouva', 'zvoleno-vedeni'])

const PORADI: Stav[] = ['bez-zprav', 'jednani', 'dohoda', 'memorandum', 'koalicni-smlouva', 'zvoleno-vedeni']

type Cast = {
  slug: string
  nazev: string
  stav: Stav
  vitezMimo: boolean
  samaVetsina: boolean
  radky: string[]
}

function udajeCasti(slug: string): Cast | undefined {
  const z = KONECNE_VYSLEDKY.zastupitelstva.find((x) => x.slug === slug)
  if (!z) return undefined
  const v = vyjednavaniZastupitelstva(slug)
  const stav = stavVyjednavani(v)
  const strany = stranySMandaty(z)
  const prvni = strany[0]
  const sestava = dohodnutaSestava(v)
  const slugViteze = prvni && slugStrany(z, prvni)
  const samaVetsina = !!prvni && prvni.mandaty >= vetsina(z.mandatuCelkem)
  const radky = [
    prvni ? `Vítěz: ${prvni.nazev}, ${prvni.mandaty} z ${z.mandatuCelkem}${samaVetsina ? ' (sám má většinu)' : ''}` : '',
    POPIS_STAVU[stav],
    sestava ? `Sestava: ${sestava.map((s) => nazevSubjektu(z, s)).join(' + ')}` : '',
  ].filter(Boolean)
  return {
    slug,
    nazev: z.nazev,
    stav,
    vitezMimo: !!sestava && !!slugViteze && !sestava.includes(slugViteze),
    samaVetsina,
    radky,
  }
}

export function MapaMestskychCasti() {
  const mapa = mapaPrahy()
  const casti = mapa.casti.flatMap((o) => {
    const u = udajeCasti(o.slug)
    return u ? [{ ...o, ...u }] : []
  })
  const pocty = Object.fromEntries(PORADI.map((s) => [s, casti.filter((c) => c.stav === s).length])) as Record<Stav, number>
  const pocetMimo = casti.filter((c) => c.vitezMimo).length
  const pocetVetsina = casti.filter((c) => c.samaVetsina).length

  return (
    <figure className="mt-5" id="mapa-casti">
      <div className="relative border border-inkoust bg-papir">
        <svg
          viewBox={`0 0 ${mapa.sirka} ${mapa.vyska}`}
          className="block h-auto w-full"
          role="group"
          aria-label="Mapa městských částí Prahy podle stavu vyjednávání; každá část je odkaz na její stránku"
        >
          <defs>
            <pattern id="mimo-svetla" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="9" stroke="var(--color-inkoust)" strokeWidth="2.5" />
            </pattern>
            <pattern id="mimo-tmava" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="9" stroke="var(--color-papir)" strokeWidth="2.5" />
            </pattern>
          </defs>
          {casti.map((c) => (
            <a
              key={c.slug}
              href={`/mestska-cast/${c.slug}#vyjednavani` as Route}
              aria-label={`${c.nazev}: ${c.radky.join('; ')}`}
              data-mc={c.slug}
              data-nazev={c.nazev}
              data-radky={c.radky.join('\n')}
              className="mapa-cast"
            >
              <path d={c.d} fill={BARVA[c.stav]} fillRule="evenodd" />
              {c.vitezMimo && (
                <path
                  d={c.d}
                  fill={`url(#${TMAVA.has(c.stav) ? 'mimo-tmava' : 'mimo-svetla'})`}
                  fillRule="evenodd"
                  pointerEvents="none"
                />
              )}
            </a>
          ))}
          {/* Hranice částí: dvoupixelová mezera barvou papíru, nad ní obrysy samostatných většin. */}
          {casti.map((c) => (
            <path
              key={`hranice-${c.slug}`}
              d={c.d}
              fill="none"
              stroke="var(--color-papir)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          ))}
          {casti
            .filter((c) => c.samaVetsina)
            .map((c) => (
              <path
                key={`vetsina-${c.slug}`}
                d={c.d}
                fill="none"
                stroke="var(--color-inkoust)"
                strokeWidth="1.75"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            ))}
          {casti
            .filter((c) => /^praha-\d+$/.test(c.slug))
            .map((c) => (
              <text
                key={`popisek-${c.slug}`}
                x={c.popisek[0]}
                y={c.popisek[1]}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="22"
                fontWeight="600"
                fill={TMAVA.has(c.stav) ? 'var(--color-papir)' : 'var(--color-inkoust)'}
                stroke={BARVA[c.stav]}
                strokeWidth="6"
                strokeLinejoin="round"
                paintOrder="stroke"
                pointerEvents="none"
                aria-hidden="true"
              >
                {c.slug.replace('praha-', '')}
              </text>
            ))}
        </svg>
        <PopiskyMapy />
      </div>
      <figcaption className="mt-3">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {PORADI.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block size-4 border border-linka-silna"
                style={{ background: BARVA[s] }}
              />
              {POPIS_STAVU[s]} <span className="font-mono">{pocty[s]}</span>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <svg aria-hidden="true" width="16" height="16" className="border border-linka-silna">
              <rect width="16" height="16" fill={BARVA.jednani} />
              <rect width="16" height="16" fill="url(#mimo-svetla)" />
            </svg>
            Vítěz voleb mimo dohodnutou sestavu <span className="font-mono">{pocetMimo}</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block size-4 border-2 border-inkoust bg-papir" />
            Jedna strana má většinu sama <span className="font-mono">{pocetVetsina}</span>
          </li>
        </ul>
        <p className="popisek-uredni mt-2">
          Hranice: RÚIAN, složené z volebních okrsků · výsledky: ČSÚ · stav: doložené události na tomto webu.
          Najetím zobrazíte výsledek a sestavu, kliknutím stránku části.
        </p>
      </figcaption>
    </figure>
  )
}
