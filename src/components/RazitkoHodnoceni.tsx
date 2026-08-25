import Link from 'next/link'
import {
  POPIS_CAS,
  POPIS_HISTORIE,
  POPIS_KOMPETENCE,
  POPIS_ROZPOCET,
  POPIS_ZAVER,
  TON_TRIDA,
  type Ton,
} from '@/lib/hodnoceni'
import type { HodnoceniSlibu } from '@/lib/typy'

/**
 * Značka nese stejnou informaci jako barva — barva sama nesmí být jediným
 * nositelem významu (WCAG 1.4.1). Je to měrka naplnění, ne semafor.
 */
const ZNACKA: Record<Ton, string> = {
  prima: '●',
  stredni: '◐',
  prekazka: '○',
  nezname: '–',
}

function Bunka({ popisek, zkratka, popis, ton }: { popisek: string; zkratka: string; popis: string; ton: Ton }) {
  return (
    <div className="razitko-bunka">
      <div className="popisek-uredni">{popisek}</div>
      <div className={`razitko-hodnota ${TON_TRIDA[ton]}`}>
        <span className="znacka" aria-hidden="true">
          {ZNACKA[ton]}
        </span>
        <span>{zkratka}</span>
      </div>
      <p className="mt-1 text-drobne leading-snug text-seda-uredni">{popis}</p>
    </div>
  )
}

export function RazitkoHodnoceni({
  hodnoceni,
  slib,
  citaceZdroje,
}: {
  hodnoceni: HodnoceniSlibu
  slib: string
  citaceZdroje: string
}) {
  const zaver = POPIS_ZAVER[hodnoceni.zaver]
  const bunky = [
    { popisek: 'KOMPETENCE', ...POPIS_KOMPETENCE[hodnoceni.kompetence] },
    { popisek: 'ROZPOČET', ...POPIS_ROZPOCET[hodnoceni.rozpocet] },
    { popisek: 'ČAS', ...POPIS_CAS[hodnoceni.cas] },
    { popisek: 'HISTORIE', ...POPIS_HISTORIE[hodnoceni.historie] },
  ]

  return (
    <article className="razitko my-8">
      <div className="border-b border-inkoust px-4 py-3">
        <p className="font-display text-lg font-semibold">{slib}</p>
        <p className={`mt-2 razitko-hodnota ${TON_TRIDA[zaver.ton]}`}>
          <span className="znacka" aria-hidden="true">
            {ZNACKA[zaver.ton]}
          </span>
          <span>
            <strong className="font-medium">{zaver.nazev}</strong> — {zaver.popis}
          </span>
        </p>
      </div>

      {/* Čtyři buňky v pevné mřížce. Pořadí os je součástí identity, nemění se. */}
      <div className="grid grid-cols-2 md:grid-cols-4 [&>*:first-child]:border-l-0 md:[&>*]:border-t-0">
        {bunky.map((bunka) => (
          <Bunka key={bunka.popisek} {...bunka} />
        ))}
      </div>

      <details className="border-t border-inkoust">
        <summary className="cursor-pointer px-4 py-3 popisek-uredni hover:text-inkoust">
          <span className="pl-1.5">Zdůvodnění a zdroje</span>
        </summary>
        <div className="border-t border-linka px-4 py-4">
          <p className="max-w-prose">{hodnoceni.zduvodneni}</p>

          <h3 className="popisek-uredni mt-5">Zdroje</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm break-words">
            {hodnoceni.zdroje.map((zdroj) => (
              <li key={zdroj}>
                <a href={zdroj} className="odkaz-akcent" rel="noopener nofollow">
                  {zdroj}
                </a>
              </li>
            ))}
          </ul>

          <h3 className="popisek-uredni mt-5">Citovaný slib</h3>
          <p className="mt-1 text-sm break-words">
            <a href={citaceZdroje} className="odkaz-akcent" rel="noopener nofollow">
              {citaceZdroje}
            </a>
          </p>

          {hodnoceni.reakce_subjektu && (
            <div className="mt-5 border-l-2 border-praha pl-4">
              <h3 className="popisek-uredni">Reakce subjektu ({hodnoceni.reakce_subjektu.datum})</h3>
              <p className="mt-1 max-w-prose text-sm">{hodnoceni.reakce_subjektu.text}</p>
              {hodnoceni.reakce_subjektu.odkaz && (
                <p className="mt-1 text-sm">
                  <a href={hodnoceni.reakce_subjektu.odkaz} className="odkaz-akcent" rel="noopener nofollow">
                    Celé vyjádření
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Metodika i kompetenční opora musí být dosažitelné od každého hodnocení. */}
          <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <Link href="/jak-hodnotime" className="odkaz-akcent">
              Jak k tomuhle závěru docházíme
            </Link>
            <Link href="/kdo-o-cem-rozhoduje" className="odkaz-akcent">
              Kdo o čem v Praze rozhoduje
            </Link>
            <Link href="/rozpoctovy-ramec" className="odkaz-akcent">
              Kolik má Praha peněz
            </Link>
          </p>
        </div>
      </details>
    </article>
  )
}
