import Link from 'next/link'
import { StariSnapshotu } from '@/components/StariSnapshotu'
import { celkovyPostup, formatujCasCSU, KOD_MAGISTRATU, type Snapshot } from '@/lib/vysledky'

const cas = new Intl.DateTimeFormat('cs-CZ', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Prague',
})
const cislo = new Intl.NumberFormat('cs-CZ')
/** ČSÚ posílá procenta s desetinnou tečkou; česky se píše čárka. */
const procenta = new Intl.NumberFormat('cs-CZ', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const procentaKratce = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 })

/** Neplatný čas nesmí shodit celou routu — v Server Componentě by to byla 500. */
function bezpecnyCas(hodnota: string | undefined): string {
  if (!hodnota) return '—'
  const datum = new Date(hodnota)
  return Number.isFinite(datum.getTime()) ? cas.format(datum) : '—'
}

export function VysledkyPrehled({ snapshot }: { snapshot: Snapshot }) {
  const postup = celkovyPostup(snapshot)
  const magistrat = snapshot.zastupitelstva.find((z) => z.kod === KOD_MAGISTRATU)
  const casti = snapshot.zastupitelstva
    .filter((z) => z.kod !== KOD_MAGISTRATU)
    .sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs'))

  return (
    <div className="space-y-10">
      {/* Stáří dat je první věc na stránce. Neoznačená stará data jsou horší než žádná. */}
      <section className="max-w-prose border-l-2 border-linka pl-5">
        <p className="popisek-uredni">Stav dat</p>
        <p className="mt-1">
          Naposledy staženo{' '}
          <time dateTime={snapshot.stazeno}>{bezpecnyCas(snapshot.stazeno)}</time>. Zdroj
          vygeneroval data {formatujCasCSU(snapshot.generovano)}.
          <StariSnapshotu stazeno={snapshot.stazeno} />
        </p>
        <p className="popisek-uredni mt-3">
          Sečteno {cislo.format(postup.zpracovano)} z {cislo.format(postup.celkem)} okrsků ·{' '}
          {procentaKratce.format(postup.procenta)} %
        </p>
      </section>

      {magistrat && (
        <section>
          <h2 className="text-2xl">Zastupitelstvo hlavního města Prahy</h2>
          <p className="popisek-uredni mt-1">
            {magistrat.spocteno ? 'sečteno' : 'průběžný stav'} · účast{' '}
            {procenta.format(magistrat.ucastProcenta)} % ·{' '}
            {cislo.format(magistrat.mandatuCelkem)} mandátů
          </p>
          <div className="mt-5 overflow-x-auto">
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
                {magistrat.strany.map((s) => (
                  <tr key={s.kod + s.cislo} className="border-b border-linka">
                    <td className="py-2 pr-3">{s.nazev}</td>
                    <td className="py-2 pr-3 text-right font-mono">{cislo.format(s.hlasy)}</td>
                    <td className="py-2 pr-3 text-right font-mono whitespace-nowrap">
                      {procenta.format(s.procenta)} %
                    </td>
                    <td className="py-2 text-right font-mono">
                      {s.mandaty > 0 ? s.mandaty : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="popisek-uredni mt-3">
            Platných hlasů celkem {cislo.format(magistrat.platneHlasy)}. V komunálních
            volbách má volič tolik hlasů, kolik se volí zastupitelů — není to počet voličů.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-2xl">Městské části</h2>
        <ul className="mt-5 grid gap-px border border-inkoust bg-linka sm:grid-cols-2 lg:grid-cols-3">
          {casti.map((z) => {
            // Dokud není sečteno nic, nemá „vedoucí strana“ smysl — první
            // v pořadí by byla jen ta s nejnižším číslem na lístku.
            const vitez = z.okrskyZpracovano > 0 && z.strany[0]?.hlasy ? z.strany[0] : undefined
            return (
              <li key={z.kod} className="bg-papir p-3">
                <Link href={`/mestska-cast/${z.slug}`} className="no-underline">
                  <span className="font-display font-medium">{z.nazev}</span>
                </Link>
                <span className="popisek-uredni mt-1 block">
                  {z.spocteno
                    ? 'sečteno'
                    : `${z.okrskyZpracovano}/${z.okrskyCelkem} okrsků`}{' '}
                  · účast {z.ucastProcenta} %
                </span>
                {vitez && (
                  <span className="mt-1 block text-sm">
                    {vitez.nazev} — {procenta.format(vitez.procenta)} % ({vitez.mandaty}{' '}
                    {vitez.mandaty === 1 ? 'mandát' : 'mandátů'})
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <p className="popisek-uredni">
        Zdroj:{' '}
        <a href="https://volby.gov.cz/opendata/opendata.htm" className="underline">
          otevřená data ČSÚ
        </a>
        , sada {snapshot.sada}. Údaje nijak neupravujeme. Závazné jsou výsledky
        vyhlášené Státní volební komisí.
      </p>
    </div>
  )
}
