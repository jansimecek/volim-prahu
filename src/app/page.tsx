import Link from 'next/link'
import { kandidatka } from '@/lib/kandidatky'
import { MAGISTRAT, MESTSKE_CASTI, cislo } from '@/lib/obsah'

export default function Rozcestnik() {
  const magistratniListina = kandidatka('magistrat')

  return (
    <div className="space-y-14">
      <section>
        <p className="popisek-uredni">Komunální a senátní volby · 9.–10. října 2026</p>
        <h1 className="mt-3 max-w-3xl text-4xl md:text-5xl">
          Co vaši kandidáti slibují — a co z toho jejich úroveň samosprávy vůbec může splnit
        </h1>
        <p className="mt-5 max-w-prose text-lg">
          Praha má dvě úrovně samosprávy a hranice mezi nimi není intuitivní. Slib, který
          zvládne magistrát, je pro městskou část často mimo pravomoc. Tenhle web u každého
          slibu ukazuje, kdo o věci skutečně rozhoduje, jestli na ni jsou peníze a jestli se
          stihne za čtyři roky.
        </p>
        <p className="mt-4">
          <Link href="/jak-hodnotime" className="odkaz-akcent">
            Jak hodnotíme proveditelnost
          </Link>
        </p>
      </section>

      <section aria-labelledby="kam-dal">
        <h2 id="kam-dal" className="sr-only">
          Kam dál
        </h2>
        <ul className="grid gap-px border border-inkoust bg-linka sm:grid-cols-2 lg:grid-cols-4">
          <Rozcestka
            href="/praha"
            popisek="Celá Praha"
            nadpis="Magistrát"
            popis={`${MAGISTRAT.mandaty} zastupitelů hlavního města. Doprava, územní plán, velké investice, městské byty.`}
          />
          <Rozcestka
            href="/mestska-cast"
            popisek="Moje čtvrť"
            nadpis="Městské části"
            popis={`${MESTSKE_CASTI.length} samostatných zastupitelstev. Školky, veřejná zeleň, místní zakázky, svěřené byty.`}
          />
          <Rozcestka
            href="/senat"
            popisek="Souběžně"
            nadpis="Senát"
            popis="Volí se jen ve třech z deseti pražských obvodů. Většina Pražanů senátní lístek nedostane."
          />
          <Rozcestka
            href="/kde-volim"
            popisek="Praktické"
            nadpis="Kde volím"
            popis="Kdy jsou otevřené volební místnosti a proč u komunálních voleb neexistuje voličský průkaz."
          />
        </ul>
      </section>

      <section className="max-w-prose">
        <h2 className="text-2xl">V jakém je to teď stavu</h2>
        <p className="mt-3">
          Kandidátní listiny už Český statistický úřad zveřejnil. Na magistrát kandiduje{' '}
          {magistratniListina?.strany.length ?? 0} volebních stran a napříč Prahou najdete
          kandidátky pro všech {cislo(MESTSKE_CASTI.length)} městských částí.
        </p>
        <p className="mt-3">
          Čísla na hlasovacím lístku zatím vylosovaná nebyla — jakmile budou, doplníme je.
          Hodnocení proveditelnosti zveřejňujeme u těch subjektů, které zveřejnily dost
          konkrétní program.
        </p>
      </section>
    </div>
  )
}

function Rozcestka({
  href,
  popisek,
  nadpis,
  popis,
}: {
  href: '/praha' | '/mestska-cast' | '/senat' | '/kde-volim'
  popisek: string
  nadpis: string
  popis: string
}) {
  return (
    <li className="bg-papir">
      <Link href={href} className="block h-full p-5 no-underline hover:bg-papir-tmavsi">
        <span className="popisek-uredni">{popisek}</span>
        <span className="mt-2 block font-display text-2xl font-semibold">{nadpis}</span>
        <span className="mt-2 block text-sm">{popis}</span>
      </Link>
    </li>
  )
}
