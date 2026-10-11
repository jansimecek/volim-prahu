import Link from 'next/link'
import { PosuvnaTabulka } from '@/components/PosuvnaTabulka'
import { celeJmeno } from '@/lib/kandidatky'
import { kandidatZvoleneho, slugStrany, stranySMandaty } from '@/lib/konecneVysledky'
import { vetsina } from '@/lib/koalice'
import type { ZastupitelstvoVysledek } from '@/lib/vysledky'

const cislo = new Intl.NumberFormat('cs-CZ')
/** ČSÚ posílá procenta s desetinnou tečkou; česky se píše čárka. */
const procenta = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function mandatu(n: number): string {
  if (n === 1) return '1 mandát'
  if (n >= 2 && n <= 4) return `${n} mandáty`
  return `${n} mandátů`
}

/**
 * Konečný výsledek jednoho zastupitelstva: rozdělení mandátů, tabulka stran
 * a zvolení zastupitelé. Stejná komponenta slouží magistrátu i městským částem.
 */
export function VysledekZastupitelstva({
  z,
  odkazyStran = false,
  nadpisovaUroven = 'h2',
}: {
  z: ZastupitelstvoVysledek
  /** Na magistrátu má každá strana vlastní stránku. */
  odkazyStran?: boolean
  nadpisovaUroven?: 'h2' | 'h3'
}) {
  const sMandaty = stranySMandaty(z)
  const H = nadpisovaUroven
  const H2 = nadpisovaUroven === 'h2' ? 'h3' : 'h4'

  return (
    <div className="space-y-6">
      <p className="popisek-uredni">
        sečteno · účast {procenta.format(z.ucastProcenta)} % · {mandatu(z.mandatuCelkem)} · většina{' '}
        {vetsina(z.mandatuCelkem)}
      </p>

      {/* Rozložení mandátů jako pruh: šířka odpovídá podílu křesel. */}
      <div>
        <div
          className="flex h-8 w-full overflow-hidden border border-inkoust"
          role="img"
          aria-label={sMandaty.map((s) => `${s.nazev} ${mandatu(s.mandaty)}`).join(', ')}
        >
          {sMandaty.map((s, i) => (
            <div
              key={s.cislo}
              className={`flex items-center justify-center overflow-hidden border-r border-papir font-mono text-xs last:border-r-0 ${
                i % 2 === 0 ? 'bg-inkoust text-papir' : 'bg-papir-tmavsi text-inkoust'
              }`}
              style={{ width: `${(s.mandaty / z.mandatuCelkem) * 100}%` }}
              title={`${s.nazev}: ${mandatu(s.mandaty)}`}
            >
              {s.mandaty}
            </div>
          ))}
        </div>
        <div className="relative mt-1 h-4" aria-hidden="true">
          <span
            className="popisek-uredni absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${(vetsina(z.mandatuCelkem) / z.mandatuCelkem) * 100}%` }}
          >
            ▲ většina
          </span>
        </div>
        <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-hidden="true">
          {sMandaty.map((s) => (
            <li key={s.cislo}>
              {s.nazev} <span className="font-mono">{s.mandaty}</span>
            </li>
          ))}
        </ol>
      </div>

      <PosuvnaTabulka popisek={`Výsledky volebních stran — ${z.nazev}`}>
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-inkoust">
              <th className="popisek-uredni py-2 pr-3">Volební strana</th>
              <th className="popisek-uredni py-2 pr-3 text-right">Hlasů</th>
              <th className="popisek-uredni py-2 pr-3 text-right">Podíl</th>
              <th className="popisek-uredni py-2 text-right">Mandátů</th>
            </tr>
          </thead>
          <tbody>
            {[...z.strany]
              .sort((a, b) => b.mandaty - a.mandaty || b.hlasy - a.hlasy)
              .map((s) => {
                const slug = odkazyStran ? slugStrany(z, s) : undefined
                return (
                  <tr key={s.cislo} className="border-b border-linka-silna">
                    <td className="py-2 pr-3">
                      {slug ? (
                        <Link href={`/praha/strana/${slug}`} className="odkaz-akcent">
                          {s.nazev}
                        </Link>
                      ) : (
                        s.nazev
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono">{cislo.format(s.hlasy)}</td>
                    <td className="py-2 pr-3 text-right font-mono whitespace-nowrap">
                      {procenta.format(s.procenta)} %
                    </td>
                    <td className="py-2 text-right font-mono">{s.mandaty > 0 ? s.mandaty : '—'}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </PosuvnaTabulka>

      <div>
        <H className={H === 'h2' ? 'text-2xl' : 'text-xl'}>Zvolení zastupitelé</H>
        <p className="popisek-uredni mt-1">
          V pořadí, v jakém mandát získali. Přednostní hlasy mohou kandidáta posunout výš, než
          stál na listině.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {sMandaty.map((s) => (
            <section key={s.cislo}>
              <H2 className="font-display font-medium">
                {s.nazev} <span className="popisek-uredni">· {mandatu(s.mandaty)}</span>
              </H2>
              <ol className="mt-2 space-y-1 text-sm">
                {(s.zvoleni ?? []).map((zv) => {
                  const k = kandidatZvoleneho(z, s, zv)
                  return (
                    <li key={zv.poradi} className="flex gap-2">
                      <span className="font-mono text-seda-uredni">{zv.poradiZvoleni}.</span>
                      <span>
                        {k ? (
                          <Link href={`/kandidat/${k.slug}`} className="odkaz-akcent">
                            {celeJmeno(k)}
                          </Link>
                        ) : (
                          zv.jmeno
                        )}
                        {zv.poradi !== zv.poradiZvoleni && (
                          <span className="popisek-uredni"> · z {zv.poradi}. místa</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
