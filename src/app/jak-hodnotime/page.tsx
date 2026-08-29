import type { Metadata } from 'next'
import { LegendaHodnoceni } from '@/components/LegendaHodnoceni'
import { RazitkoHodnoceni } from '@/components/RazitkoHodnoceni'
import { Obsah } from '@/components/Obsah'
import { MDXContent } from '@/components/mdx'
import { nadpisyStranky } from '@/lib/nadpisy'
import { datumCesky } from '@/lib/cestina'
import { strankaPodleSlugu } from '@/lib/obsah'
import type { HodnoceniSlibu } from '@/lib/typy'

/**
 * Ukázkové hodnocení pro metodiku. Vědomě není v `content/` a nepatří žádnému
 * skutečnému subjektu — jde o vysvětlení tvaru, ne o hodnocení něčího programu.
 */
const UKAZKA: HodnoceniSlibu = {
  kompetence: 'mimo-pravomoc',
  rozpocet: 'nejiste',
  cas: 'presahuje',
  historie: 'bez-historie',
  zaver: 'mimo-pravomoc',
  zduvodneni:
    'Prodloužení tramvajové trati je investicí hlavního města: o síti městské hromadné dopravy rozhoduje magistrát a Dopravní podnik hl. m. Prahy, nikoli zastupitelstvo městské části. Městská část se k záměru vyjadřuje, ale nemůže ho sama zadat, financovat ani zahájit.',
  zdroje: [
    'https://www.zakonyprolidi.cz/cs/2000-131',
    'https://sbirkapp.gov.cz',
  ],
}

const stranka = strankaPodleSlugu('jak-hodnotime')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

export default function StrankaMetodiky() {
  return (
    <article className="space-y-10">
      <header className="max-w-prose">
        <p className="popisek-uredni">Metodika</p>
        <h1 className="mt-2 text-4xl">{stranka.title}</h1>
      </header>

      {/* Obsah musí pokrýt i sekce, které nejsou v MDX — jinak by tvrdil,
          že stránka končí dřív, než končí. */}
      <Obsah
        polozky={[
          ...nadpisyStranky(stranka.surovy),
          { id: 'ukazka-hodnoceni', text: 'Jak hodnocení vypadá' },
          { id: 'prehled-stavu', text: 'Přehled stavů' },
        ]}
      />

      <div className="proza max-w-prose">
        <MDXContent code={stranka.content} />
      </div>

      <section id="ukazka-hodnoceni" className="scroll-mt-20">
        <h2 className="text-2xl">Jak hodnocení vypadá</h2>
        <p className="mt-2 max-w-prose text-sm text-seda-uredni">
          Následující blok je ukázka tvaru hodnocení. Nepatří žádnému skutečnému
          kandidujícímu subjektu a není to hodnocení ničího programu.
        </p>
        <RazitkoHodnoceni
          hodnoceni={UKAZKA}
          slib="Prodloužíme tramvajovou trať k sídlišti"
          citaceZdroje="https://volimprahu.cz/jak-hodnotime"
          urovenNadpisu={3}
        />
      </section>

      <section id="prehled-stavu" className="scroll-mt-20">
        <h2 className="text-2xl">Přehled stavů</h2>
        <p className="mt-2 max-w-prose text-sm text-seda-uredni">
          Značka nese stejnou informaci jako barva — plný kroužek znamená bez překážky,
          půlka částečně, prázdný kroužek překážku, pomlčka chybějící podklad.
        </p>
        <div className="mt-6">
          <LegendaHodnoceni />
        </div>
      </section>

      <p className="popisek-uredni">Aktualizováno {datumCesky(stranka.aktualizovano)}</p>
    </article>
  )
}
