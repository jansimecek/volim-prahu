import Link from 'next/link'
import { celeJmeno, type StranaNaKandidatce } from '@/lib/kandidatky'

/**
 * Kandidátní listina jedné volební strany. Bydliště se zobrazuje jen v rozsahu,
 * v jakém ho zveřejňuje ČSÚ, tedy nejvýše obec nebo městská část.
 */
export function SeznamKandidatu({ strana }: { strana: StranaNaKandidatce }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-inkoust">
            <th className="popisek-uredni py-2 pr-3 text-right">#</th>
            <th className="popisek-uredni py-2 pr-3">Jméno</th>
            <th className="popisek-uredni py-2 pr-3 text-right">Věk</th>
            <th className="popisek-uredni py-2 pr-3">Povolání</th>
            <th className="popisek-uredni py-2">Příslušnost</th>
          </tr>
        </thead>
        <tbody>
          {strana.kandidati.map((k) => (
            <tr key={k.id} className="border-b border-linka align-top">
              <td className="py-2 pr-3 text-right font-mono">{k.poradi}</td>
              <td className="py-2 pr-3">
                <Link href={`/kandidat/${k.slug}`} className="odkaz-akcent">
                  {celeJmeno(k)}
                </Link>
              </td>
              <td className="py-2 pr-3 text-right font-mono">{k.vek}</td>
              <td className="py-2 pr-3">{k.povolani || '—'}</td>
              <td className="py-2 font-mono text-drobne">
                {k.politickaPrislusnost || 'BEZPP'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
