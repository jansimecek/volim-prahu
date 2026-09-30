import Link from 'next/link'
import { datumCesky } from '@/lib/cestina'
import { skalaOtazky, type SpornaOtazka } from '@/lib/temata'

/**
 * Jedna sporná otázka jako škála: možnosti vedle sebe od pólu k pólu,
 * v každé subjekty, které tam stojí, a pod tím ti, o kterých nic nevíme.
 *
 * Zařazení je naše, takže každý subjekt nese shrnutí a zdroj přímo na
 * škále, ne až po rozkliknutí — čtenář musí vidět, proč tam stojí, dřív,
 * než si z pozice něco vyvodí.
 */

export const POPIS_TYPU_ODPOVEDI: Record<'program' | 'vyrok' | 'hlasovani', string> = {
  program: 'z programu',
  vyrok: 'z výroku',
  hlasovani: 'z hlasování',
}

/** Kolik sloupců má mřížka na širokém displeji; Tailwind potřebuje celé třídy. */
const MRIZKA: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}

export function PoziceNaOse({ poradi, pocet }: { poradi: number; pocet: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: pocet }, (_, i) => (
        <span
          key={i}
          className={`inline-block size-2.5 rounded-full border border-inkoust ${
            i === poradi ? 'bg-inkoust' : 'bg-transparent opacity-40'
          }`}
        />
      ))}
    </span>
  )
}

export function SkalaOtazky({ otazka }: { otazka: SpornaOtazka }) {
  const { moznosti, nedolozeno } = skalaOtazky(otazka)

  return (
    <article id={`otazka-${otazka.id}`} className="razitko mt-5 scroll-mt-20">
      <div className="border-b border-inkoust px-4 py-3">
        <h4 className="font-display text-lg font-semibold">{otazka.otazka}</h4>
        <p className="mt-1 max-w-prose text-sm">{otazka.kontext}</p>
      </div>

      {/* Na telefonu se možnosti řadí pod sebe, pořadí os zůstává shora dolů. */}
      <ol className={`grid grid-cols-1 ${MRIZKA[moznosti.length] ?? ''}`}>
        {moznosti.map((m) => (
          <li key={m.id} className="razitko-bunka flex flex-col">
            <p className="flex items-center gap-2">
              <PoziceNaOse poradi={m.poradi} pocet={moznosti.length} />
              <span className="font-display font-semibold leading-tight">{m.popis}</span>
            </p>

            {m.odpovedi.length === 0 ? (
              <p className="mt-2 text-sm text-seda-uredni">Nikdo z doložených.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {m.odpovedi.map((o) => (
                  <li key={o.subjekt} className="text-sm leading-snug">
                    <Link
                      href={`/praha/strana/${o.subjekt}`}
                      className="font-display font-semibold no-underline"
                    >
                      {o.zkratka}
                    </Link>
                    <span className="popisek-uredni ml-2">{POPIS_TYPU_ODPOVEDI[o.typZdroje]}</span>
                    <span className="block">{o.shrnuti}</span>
                    {o.poznamka && (
                      <span className="mt-1 block border-l-2 border-praha pl-2 text-seda-uredni">
                        {o.poznamka}
                      </span>
                    )}
                    <a
                      href={o.zdroj.url}
                      className="popisek-uredni mt-1 inline-block underline"
                      rel="noopener nofollow"
                    >
                      {o.zdroj.text}, {datumCesky(o.zdroj.datum)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {nedolozeno.length > 0 && (
        <p className="border-t border-inkoust px-4 py-3 text-sm text-seda-uredni">
          <span className="popisek-uredni mr-2">Nedoloženo</span>
          {nedolozeno.map((n) => n.zkratka).join(', ')}. Postoj k této otázce jsme nenašli
          — neznamená to, že ho nemají.
        </p>
      )}
    </article>
  )
}
