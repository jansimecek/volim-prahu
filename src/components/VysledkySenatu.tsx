import { PosuvnaTabulka } from '@/components/PosuvnaTabulka'
import { nazevStranySenat } from '@/lib/senatKandidati'
import { radkyKola, type Kolo } from '@/lib/senatVysledky'

const cislo = new Intl.NumberFormat('cs-CZ')
const procenta = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Výsledky jednoho kola senátních voleb v obvodu. Postupující jsou vyznačení. */
export function VysledkySenatu({ cisloObvodu, kolo }: { cisloObvodu: number; kolo: Kolo }) {
  const radky = radkyKola(cisloObvodu, kolo)
  return (
    <div>
      <p className="popisek-uredni">
        účast {procenta.format(kolo.ucastProcenta)} % · platných hlasů {cislo.format(kolo.platneHlasy)}
      </p>
      <PosuvnaTabulka popisek="Výsledky kandidátů" trida="mt-3">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-inkoust">
              <th className="popisek-uredni py-2 pr-3">Kandidát</th>
              <th className="popisek-uredni py-2 pr-3">Navrhla</th>
              <th className="popisek-uredni py-2 pr-3 text-right">Hlasů</th>
              <th className="popisek-uredni py-2 text-right">Podíl</th>
            </tr>
          </thead>
          <tbody>
            {radky.map((r) => (
              <tr key={r.cislo} className={`border-b border-linka-silna ${r.postupuje ? 'font-medium' : ''}`}>
                <td className="py-2 pr-3">
                  {r.celeJmeno}
                  {r.postupuje && <span className="popisek-uredni block text-praha">postupuje do 2. kola</span>}
                </td>
                <td className="py-2 pr-3">{nazevStranySenat(r.kandidat?.volebniStrana ?? r.navrhujici)}</td>
                <td className="py-2 pr-3 text-right font-mono">{cislo.format(r.hlasy)}</td>
                <td className="py-2 text-right font-mono whitespace-nowrap">{procenta.format(r.procenta)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PosuvnaTabulka>
    </div>
  )
}
