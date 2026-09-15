import Link from 'next/link'
import { POPIS_NEPLATNE_KANDIDATURY, celeJmeno, type StranaNaKandidatce } from '@/lib/kandidatky'
import { PosuvnaTabulka } from '@/components/PosuvnaTabulka'

/**
 * Kandidátní listina jedné volební strany. Bydliště se zobrazuje jen v rozsahu,
 * v jakém ho zveřejňuje ČSÚ, tedy nejvýše obec nebo městská část.
 *
 * Kandidát s neplatnou kandidaturou zůstává na svém místě v pořadí, ale je
 * označený a pod tabulkou vysvětlený. Vypustit ho by rozházelo číslování,
 * ukázat ho bez označení by tvrdilo, že dál kandiduje.
 */
export function SeznamKandidatu({ strana }: { strana: StranaNaKandidatce }) {
  const neplatnych = strana.kandidati.filter((k) => k.neplatny).length

  return (
    <>
      <PosuvnaTabulka popisek={`Kandidátní listina — ${strana.nazev}`}>
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
            {/* Škrtnutá pozice zůstává v pořadí jako prázdný řádek — bez něj by číslování skákalo. */}
            {(strana.skrtnutePozice ?? []).map((poradi) => (
              <tr key={`skrtnuto-${poradi}`} className="border-b border-linka-silna align-top">
                <td className="py-2 pr-3 text-right font-mono">{poradi}</td>
                <td className="py-2 text-seda-uredni" colSpan={4}>
                  Pozice zůstala volná — kandidát byl při registraci škrtnut a registrační úřad ji neobsadil.
                </td>
              </tr>
            ))}
            {strana.kandidati.map((k) => (
              <tr key={k.id} className="border-b border-linka-silna align-top">
                <td className="py-2 pr-3 text-right font-mono">{k.poradi}</td>
                <td className="py-2 pr-3">
                  <Link href={`/kandidat/${k.slug}`} className="odkaz-akcent">
                    {celeJmeno(k)}
                  </Link>
                  {k.neplatny && (
                    <span className="popisek-uredni ml-2 whitespace-nowrap text-okr">
                      kandidatura neplatná
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right font-mono">{k.vek}</td>
                <td className="py-2 pr-3">{k.povolani || '—'}</td>
                <td className="py-2 font-mono text-drobne">
                  {k.politickaPrislusnost || 'neuvedeno'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PosuvnaTabulka>
      {neplatnych > 0 && (
        <p className="mt-2 max-w-prose text-sm text-seda-uredni">
          <span className="popisek-uredni text-okr">Kandidatura neplatná</span> —{' '}
          {POPIS_NEPLATNE_KANDIDATURY}
        </p>
      )}
    </>
  )
}
