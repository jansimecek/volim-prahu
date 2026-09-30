import Link from 'next/link'
import { datumCesky, sPoctem } from '@/lib/cestina'
import {
  POPIS_CAS,
  POPIS_KOMPETENCE,
  POPIS_ROZPOCET,
  TON_TRIDA,
  ZNACKA,
} from '@/lib/hodnoceni'
import type { PostojVOkruhu } from '@/lib/temata'

/**
 * Zapsané postoje subjektů k jednomu okruhu, vedle sebe.
 *
 * Klíčové je, že typ zdroje jde ven vždycky a je vidět dřív než samotný
 * postoj. Programový závazek, výrok v médiích a naše odvození vypadají po
 * zveřejnění stejně, ale čtenář z nich smí vyvozovat úplně jiné věci —
 * kdyby štítek chyběl, web by odvození vydával za slib strany.
 */

const POPIS_TYPU: Record<PostojVOkruhu['typZdroje'], { zkratka: string; popis: string }> = {
  program: {
    zkratka: 'z programu',
    popis: 'Psaný programový závazek, který subjekt sám zveřejnil.',
  },
  vyrok: {
    zkratka: 'z výroku',
    popis: 'Doložený veřejný výrok lídra nebo mluvčího, ne psaný program.',
  },
  hlasovani: {
    zkratka: 'z hlasování',
    popis: 'Jak subjekt skutečně hlasoval v zastupitelstvu — ne co slibuje.',
  },
  odvozeni: {
    zkratka: 'naše odvození',
    popis:
      'Není to postoj subjektu. Odvodili jsme ho z jiných zdrojů a subjekt ho takto nikde neuvedl.',
  },
}

/**
 * Tři osy proveditelnosti v jednom řádku. Bez historie a bez závěru, protože
 * ty u postojů nevyplňujeme — závěr patří jen plnému hodnocení slibu na
 * stránce programu. Tady jde o orientační upozornění, kdo o věci rozhoduje
 * a jestli se stihne, ne o verdikt.
 */
function Proveditelnost({ p }: { p: NonNullable<PostojVOkruhu['proveditelnost']> }) {
  const osy = [
    { osa: 'Kompetence', ...POPIS_KOMPETENCE[p.kompetence] },
    { osa: 'Rozpočet', ...POPIS_ROZPOCET[p.rozpocet] },
    { osa: 'Čas', ...POPIS_CAS[p.cas] },
  ]
  return (
    <div className="mt-3">
      <p className="popisek-uredni">Naše hodnocení proveditelnosti</p>
      <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
        {osy.map((o) => (
          <li key={o.osa} className={`razitko-hodnota ${TON_TRIDA[o.ton]}`} title={o.popis}>
            <span className="znacka" aria-hidden="true">
              {ZNACKA[o.ton]}
            </span>
            <span>
              <span className="text-seda-uredni">{o.osa}:</span> {o.zkratka}
            </span>
          </li>
        ))}
        {p.agenda && (
          <li className="razitko-hodnota">
            <Link href={`/kdo-o-cem-rozhoduje#${p.agenda}`} className="underline">
              kdo o tom rozhoduje
            </Link>
          </li>
        )}
      </ul>
    </div>
  )
}

type Props = {
  postoje: PostojVOkruhu[]
  chybi: { subjekt: string; zkratka: string }[]
}

export function PostojeOkruhu({ postoje, chybi }: Props) {
  if (postoje.length === 0) {
    return (
      <p className="mt-5 max-w-prose">
        K tomuhle okruhu zatím nemáme zapsaný postoj žádného subjektu.
      </p>
    )
  }

  return (
    <div className="mt-5">
      {/* Subjekt může mít k jednomu okruhu víc postojů, takže se počítají
          odlišné subjekty — jinak by čitatel přerostl jmenovatele. */}
      <p className="popisek-uredni">
        Zapsaný postoj má{' '}
        {sPoctem(new Set(postoje.map((p) => p.subjekt)).size, 'subjekt', 'subjekty', 'subjektů')} z{' '}
        {new Set(postoje.map((p) => p.subjekt)).size + chybi.length}
      </p>

      <div className="mt-3 border-t border-inkoust">
        {postoje.map((p, i) => {
          const typ = POPIS_TYPU[p.typZdroje]
          return (
            <article key={`${p.subjekt}-${i}`} className="border-b border-linka-silna py-5">
              <p className="font-display font-semibold">
                <Link href={`/praha/strana/${p.subjekt}`} className="no-underline">
                  {p.zkratkaStrany}
                </Link>
                <span
                  className={`popisek-uredni ml-3 ${
                    p.typZdroje === 'odvozeni' ? 'razitko-nezname px-2 py-0.5' : ''
                  }`}
                  title={typ.popis}
                >
                  {typ.zkratka}
                </span>
              </p>

              <p className="mt-2 max-w-prose font-cteci text-lg">{p.shrnuti}</p>
              <p className="mt-2 max-w-prose text-sm">{p.postoj}</p>

              {p.typZdroje === 'odvozeni' && (
                <p className="mt-2 max-w-prose border-l-2 border-okr pl-4 text-sm">
                  <span className="popisek-uredni block">Není to postoj subjektu</span>
                  {typ.popis}
                </p>
              )}

              {p.proveditelnost && <Proveditelnost p={p.proveditelnost} />}

              {p.poznamka && (
                <p className="mt-2 max-w-prose border-l-2 border-praha pl-4 text-sm">
                  {p.poznamka}
                </p>
              )}

              {p.zdroj && (
                <p className="popisek-uredni mt-3">
                  <a href={p.zdroj.url} className="underline" rel="noopener nofollow">
                    {p.zdroj.text}
                  </a>
                  , ověřeno {datumCesky(p.zdroj.datum)}
                </p>
              )}
            </article>
          )
        })}
      </div>

      {chybi.length > 0 && (
        <p className="mt-3 max-w-prose text-sm text-seda-uredni">
          Bez zapsaného postoje k tomuhle okruhu:{' '}
          {chybi.map((c) => c.zkratka).join(', ')}. Neznamená to, že postoj nemají —
          znamená to, že jsme ho zatím nedoložili.
        </p>
      )}
    </div>
  )
}
