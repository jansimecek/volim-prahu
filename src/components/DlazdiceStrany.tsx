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
 *
 * Údaje pod jménem lídra jsou běžná věta, ne verzálkový popisek: řádek
 * „65 KANDIDÁTŮ · PROGRAM NEDOHLEDÁN · PRŮZKUM 23,3 %“ v drobném mono písmu
 * se nedal přečíst jedním pohledem. Stav programu jde první, protože kvůli
 * němu výpis na tomhle webu existuje.
 */
export function DlazdiceStrany({
  strana,
  kompaktni = false,
}: {
  strana: UdajeDlazdice
  /**
   * Titulní strana vypisuje všech 24 kandidátek pod sebou a na telefonu by
   * s povoláním lídrů a počty kandidátů zabraly pět obrazovek. Obojí tam
   * proto chybí — stránka magistrátu to ukazuje dál.
   */
  kompaktni?: boolean
}) {
  const program = POPIS_PROGRAMU[strana.programStav]

  return (
    <li className="bg-papir">
      <Link
        href={`/praha/strana/${strana.slug}`}
        className={`group flex h-full flex-col no-underline hover:bg-papir-tmavsi ${kompaktni ? 'px-4 py-3' : 'p-4'}`}
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

        {!kompaktni && strana.povolani && (
          <span className="mt-1 block text-sm text-seda-uredni">
            {zkratNaSlova(strana.povolani, 70)}
          </span>
        )}

        <span className={`mt-auto block text-sm leading-snug text-seda-uredni ${kompaktni ? 'pt-2' : 'pt-3'}`}>
          <span className="text-inkoust">{program.charAt(0).toUpperCase() + program.slice(1)}</span>
          {strana.pocetHodnoceni > 0 &&
            ` · ${sPoctem(strana.pocetHodnoceni, 'hodnocený slib', 'hodnocené sliby', 'hodnocených slibů')}`}
          {!kompaktni && ` · ${sPoctem(strana.pocetKandidatu, 'kandidát', 'kandidáti', 'kandidátů')}`}
          {strana.procenta !== null && ` · průzkum ${formatProcent(strana.procenta)}`}
        </span>
      </Link>
    </li>
  )
}

/**
 * Zkrátí text na celá slova. Povolání z kandidátní listiny useknuté
 * uprostřed slova („sportov…“) vypadalo jako chyba v datech, ne jako zkratka.
 * Visící spojka nebo předložka („zastupitelka a…“) se odřízne taky.
 */
function zkratNaSlova(text: string, nejvic: number): string {
  if (text.length <= nejvic) return text
  const rez = text.slice(0, nejvic)
  const mezera = rez.lastIndexOf(' ')
  const cela = mezera > nejvic / 2 ? rez.slice(0, mezera) : rez
  return `${cela
    .replace(/\s+(?:a|i|v|ve|s|se|z|ze|k|ke|o|u|na|pro|do|od|po|za)$/iu, '')
    .replace(/[\s,;:–-]+$/, '')}…`
}
