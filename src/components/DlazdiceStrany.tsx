import Link from 'next/link'
import { sPoctem } from '@/lib/cestina'
import { procenta as formatProcent } from '@/lib/pruzkumy'
import { POPIS_PROGRAMU } from '@/lib/strany'
import type { Strana } from '#content'

export type UdajeDlazdice = {
  slug: string
  zkratka: string
  lidr: string | null
  povolani: string | null
  pocetKandidatu: number
  programStav: Strana['programStav']
  pocetHodnoceni: number
  cislo: number | null
  procenta: number | null
}

/**
 * Dlaždice jedné volební strany ve výpisu.
 *
 * Sdílená titulní stranou i stránkou magistrátu — dřív to byly dvě skoro
 * stejné kopie, které se lišily v drobnostech, takže čtenář na dvou místech
 * viděl o téže straně jinou sadu údajů.
 *
 * Číslo z průzkumu se ukazuje vždycky, když nějaký zveřejnitelný průzkum
 * existuje — ne jen když se podle něj zrovna řadí. Skrývat údaj podle toho,
 * jak je seznam seřazený, by z něj dělalo odměnu za přepnutí přepínače.
 */
export function DlazdiceStrany({ strana }: { strana: UdajeDlazdice }) {
  return (
    <li className="bg-papir">
      <Link
        href={`/praha/strana/${strana.slug}`}
        className="group flex h-full flex-col p-4 no-underline hover:bg-papir-tmavsi"
      >
        <span className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-display text-lg font-semibold group-hover:underline">
            {strana.zkratka}
          </span>
          {strana.cislo !== null && (
            <span className="popisek-uredni">č. {strana.cislo} na lístku</span>
          )}
        </span>

        <span className="mt-1 block font-cteci">
          {strana.lidr ?? 'lídr neuveden'}
        </span>

        {strana.povolani && (
          <span className="mt-1 block text-sm text-seda-uredni">
            {strana.povolani.length > 70 ? `${strana.povolani.slice(0, 67)}…` : strana.povolani}
          </span>
        )}

        <span className="popisek-uredni mt-auto block pt-3">
          {sPoctem(strana.pocetKandidatu, 'kandidát', 'kandidáti', 'kandidátů')} ·{' '}
          {POPIS_PROGRAMU[strana.programStav]}
          {strana.pocetHodnoceni > 0 &&
            ` · ${sPoctem(strana.pocetHodnoceni, 'hodnocený slib', 'hodnocené sliby', 'hodnocených slibů')}`}
          {strana.procenta !== null && ` · průzkum ${formatProcent(strana.procenta)}`}
        </span>
      </Link>
    </li>
  )
}
