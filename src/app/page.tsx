import Link from 'next/link'
import { programy, strany } from '#content'
import { celeJmeno, kandidatka, lidr, stranaPodleKodu } from '@/lib/kandidatky'
import { sPoctem } from '@/lib/cestina'
import { MAGISTRAT, MESTSKE_CASTI, cislo } from '@/lib/obsah'
import { POPIS_PROGRAMU, serazene } from '@/lib/strany'

export default function Rozcestnik() {
  const listina = kandidatka('magistrat')
  const kandidujici = serazene(strany.filter((s) => s.uroven === 'magistrat'))
  const kandidatuCelkem = listina?.strany.reduce((n, s) => n + s.kandidati.length, 0) ?? 0
  const hodnoceno = programy.reduce(
    (n, p) => n + p.body.filter((b) => b.hodnoceni).length,
    0,
  )

  return (
    <div className="space-y-16">
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
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
          <Link href="/temata" className="odkaz-akcent">
            Srovnání zásadních témat
          </Link>
          <Link href="/jak-hodnotime" className="odkaz-akcent">
            Jak hodnotíme proveditelnost
          </Link>
        </p>
      </section>

      {/* Lídři patří na titulní stranu — je to první věc, kterou volič hledá. */}
      {kandidujici.length > 0 && (
        <section aria-labelledby="lidri">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="lidri" className="text-2xl">
              Kdo vede kandidátky na magistrát
            </h2>
            <p className="popisek-uredni">
              {sPoctem(kandidujici.length, 'volební strana', 'volební strany', 'volebních stran')} ·{' '}
              {sPoctem(kandidatuCelkem, 'kandidát', 'kandidáti', 'kandidátů')}
            </p>
          </div>
          <p className="mt-2 max-w-prose text-sm text-seda-uredni">
            Abecedně podle zkratky, ne podle preferencí. Čísla na hlasovacím lístku zatím
            vylosovaná nebyla. Jména jsou z otevřených dat ČSÚ.
          </p>

          <ul className="mt-5 grid gap-px border border-inkoust bg-linka sm:grid-cols-2 lg:grid-cols-3">
            {kandidujici.map((strana) => {
              const naListine = stranaPodleKodu('magistrat', strana.kodStrany)
              const jednicka = lidr(naListine)
              const pocetHodnoceni =
                programy
                  .find((p) => p.subjekt === strana.slug && p.uroven === 'magistrat')
                  ?.body.filter((b) => b.hodnoceni).length ?? 0

              return (
                <li key={strana.slug} className="bg-papir">
                  <Link
                    href={`/praha/strana/${strana.slug}`}
                    className="flex h-full flex-col p-4 no-underline hover:bg-papir-tmavsi"
                  >
                    <span className="font-display text-lg font-semibold">{strana.zkratka}</span>
                    <span className="mt-1 block font-cteci">
                      {jednicka ? celeJmeno(jednicka) : 'lídr neuveden'}
                    </span>
                    {jednicka?.povolani && (
                      <span className="mt-1 block text-sm text-seda-uredni">
                        {jednicka.povolani.length > 70
                          ? jednicka.povolani.slice(0, 67) + '…'
                          : jednicka.povolani}
                      </span>
                    )}
                    <span className="popisek-uredni mt-auto block pt-3">
                      {sPoctem(naListine?.kandidati.length ?? 0, 'kandidát', 'kandidáti', 'kandidátů')} ·{' '}
                      {POPIS_PROGRAMU[strana.programStav]}
                      {pocetHodnoceni > 0 && ` · ${pocetHodnoceni} hodnocení`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>

          <p className="mt-4 text-sm">
            <Link href="/praha" className="odkaz-akcent">
              Podrobnosti o magistrátu a kandidátkách
            </Link>
          </p>
        </section>
      )}

      <section aria-labelledby="kam-dal">
        <h2 id="kam-dal" className="text-2xl">
          Kam dál
        </h2>
        <ul className="mt-5 grid gap-px border border-inkoust bg-linka sm:grid-cols-2 lg:grid-cols-4">
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
            href="/kdo-o-cem-rozhoduje"
            popisek="Podklad"
            nadpis="Kdo o čem rozhoduje"
            popis="Sedmnáct agend a u každé odkaz na paragraf. Parkovací zóny nejsou na radnici, ale na magistrátu."
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
          Kandidátní listiny jsou naimportované z otevřených dat ČSÚ — {MAGISTRAT.mandaty}{' '}
          mandátů na magistrátu, kandidátky ve všech {cislo(MESTSKE_CASTI.length)} městských
          částech a tři senátní obvody.
        </p>
        <p className="mt-3">
          Hodnocení proveditelnosti zveřejňujeme u {hodnoceno} slibů. Většina subjektů
          zatím nezveřejnila dost konkrétní program — u každého je napsané, jak na tom je,
          aby nevznikl dojem, že hodnotíme jen některé.
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
  href: '/mestska-cast' | '/senat' | '/kdo-o-cem-rozhoduje' | '/kde-volim'
  popisek: string
  nadpis: string
  popis: string
}) {
  return (
    <li className="bg-papir">
      <Link href={href} className="block h-full p-5 no-underline hover:bg-papir-tmavsi">
        <span className="popisek-uredni">{popisek}</span>
        <span className="mt-2 block font-display text-xl font-semibold">{nadpis}</span>
        <span className="mt-2 block text-sm">{popis}</span>
      </Link>
    </li>
  )
}
