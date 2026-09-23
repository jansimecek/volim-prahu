/**
 * Zóna placeného stání u volební místnosti.
 *
 * Tarif se vypisuje doslova ze zdroje (otevřená data hl. m. Prahy), protože
 * je to citace, ne náš výklad — z „Po-Pá 08:00-19:59" si čtenář sám přečte,
 * že v sobotu se neplatí. Že je někde volné místo, web netvrdí: o tom data
 * nic neříkají.
 */
import { dosad } from '@/lib/sablony'
import type { ZonaMistnosti } from '@/lib/parkovaniTypy'

/** Jen klíče, které tenhle výpis potřebuje — sdílí ho vyhledávač i widget „Moje volby". */
export type TextyParkovani = {
  parkovaniVZone: string
  parkovaniBlizko: string
  parkovaniTarif: string
  parkovaniBezZony: string
  jednotkaM: string
}

export function Parkovani({
  zona,
  okoliMetru,
  texty,
}: {
  zona: ZonaMistnosti | null
  okoliMetru: number
  texty: TextyParkovani
}) {
  if (zona === null) {
    return (
      <p className="mt-1 text-sm">
        {dosad(texty.parkovaniBezZony, { okoli: `${okoliMetru} ${texty.jednotkaM}` })}
      </p>
    )
  }
  return (
    <p className="mt-1 text-sm">
      {zona.metru === 0
        ? texty.parkovaniVZone
        : dosad(texty.parkovaniBlizko, { vzdalenost: `${zona.metru} ${texty.jednotkaM}` })}
      {zona.tarif.length > 0 && (
        <span className="block" lang="cs">
          {dosad(texty.parkovaniTarif, { tarif: zona.tarif.join(' · ') })}
        </span>
      )}
    </p>
  )
}
