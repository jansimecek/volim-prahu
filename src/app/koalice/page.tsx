import type { Metadata } from 'next'
import { koalice, strany } from '#content'
import { DeklaraceKoalic } from '@/components/DeklaraceKoalic'
import { KalkulackaMandatu } from '@/components/KalkulackaMandatu'
import { Obsah } from '@/components/Obsah'
import { MDXContent } from '@/components/mdx'
import { datumCesky } from '@/lib/cestina'
import { jeSkrtnutyKandidat, stranaPodleKodu } from '@/lib/kandidatky'
import { nadpisyStranky } from '@/lib/nadpisy'
import { MAGISTRAT, strankaPodleSlugu } from '@/lib/obsah'
import { procentaPodleSubjektu, puvodPruzkumu, zobrazitelnyPruzkumZaBehu } from '@/lib/pruzkumy'
import { serazene } from '@/lib/strany'

const stranka = strankaPodleSlugu('koalice')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

export default async function StrankaKoalic() {
  // Kalkulačku smí průzkum předvyplnit jen mimo moratorium. Rozhoduje se až při
  // vyřizování požadavku, stejně jako u výpisu kandidátek na /praha.
  const pruzkum = await zobrazitelnyPruzkumZaBehu('magistrat')

  const subjekty = serazene(strany.filter((s) => s.uroven === 'magistrat')).map((s) => ({
    slug: s.slug,
    zkratka: s.zkratka,
    // Počítají se jen kandidáti na hlasovacím lístku — škrtnutý kandidát mandát dostat nemůže.
    kandidatu:
      stranaPodleKodu('magistrat', s.kodStrany)?.kandidati.filter(
        (k) => !jeSkrtnutyKandidat(k.prijmeni, k.jmeno),
      ).length ?? 0,
  }))

  const vylouceni = koalice.deklarace.flatMap((d) =>
    d.vylucuje.map((koho) => ({ kdo: d.subjekt, koho, deklarace: d.id })),
  )

  return (
    <article className="space-y-10">
      <header className="max-w-prose">
        <p className="popisek-uredni">Po volbách</p>
        <h1 className="mt-2 text-4xl">{stranka.title}</h1>
      </header>

      <Obsah
        polozky={[
          ...nadpisyStranky(stranka.surovy),
          { id: 'deklarace', text: 'Kdo koho vyloučil' },
          { id: 'kalkulacka', text: 'Kalkulačka mandátů' },
        ]}
      />

      <div className="proza max-w-prose">
        <MDXContent code={stranka.content} />
      </div>

      <DeklaraceKoalic />

      <KalkulackaMandatu
        subjekty={subjekty}
        mandatu={MAGISTRAT.mandaty}
        vylouceni={vylouceni}
        pruzkum={
          pruzkum
            ? { popis: puvodPruzkumu(pruzkum), url: pruzkum.url, procenta: procentaPodleSubjektu(pruzkum) }
            : null
        }
      />

      <footer className="border-t border-linka pt-6">
        <p className="popisek-uredni">
          {koalice.deklarace.length} doložených vyjádření · ověřeno {datumCesky(koalice.overeno)} ·
          aktualizováno {datumCesky(stranka.aktualizovano)}
        </p>
      </footer>
    </article>
  )
}
