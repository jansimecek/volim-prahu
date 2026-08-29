import type { Metadata } from 'next'
import Link from 'next/link'
import { DlazdiceStrany } from '@/components/DlazdiceStrany'
import { RazenySeznam } from '@/components/RazenySeznam'
import { sPoctem } from '@/lib/cestina'
import { MAGISTRAT, SADA_CISELNIKU, cislo } from '@/lib/obsah'
import { kandidatka } from '@/lib/kandidatky'
import { duvodBezPruzkumu, puvodPruzkumu, zdrojePoznamky } from '@/lib/pruzkumy'
import { vypisStran } from '@/lib/vypisStran'

export const metadata: Metadata = {
  title: 'Magistrát',
  description:
    'Volby do Zastupitelstva hlavního města Prahy 2026: 65 mandátů, kandidující subjekty a hodnocení proveditelnosti jejich programů.',
}

export default async function StrankaMagistratu() {
  const { polozky, pruzkum } = await vypisStran('magistrat')
  const listina = kandidatka('magistrat')
  const vylosovano = listina?.strany.some((s) => s.vylosovano) ?? false

  return (
    <div className="space-y-10">
      <header className="max-w-prose">
        <p className="popisek-uredni">Celoměstská úroveň</p>
        <h1 className="mt-2 text-4xl">Zastupitelstvo hlavního města Prahy</h1>
        <p className="mt-4">
          Magistrát rozhoduje o věcech, které městská část ovlivnit nemůže: územním plánu,
          metru a tramvajových tratích, obecně závazných vyhláškách, velkých investicích a
          městských podnicích. Zvolí se {MAGISTRAT.mandaty} zastupitelů.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-px border border-inkoust bg-linka-silna sm:grid-cols-4">
        <Udaj popisek="Mandátů" hodnota={cislo(MAGISTRAT.mandaty)} />
        <Udaj popisek="Volebních okrsků" hodnota={cislo(MAGISTRAT.okrskyCelkem)} />
        <Udaj popisek="Obyvatel" hodnota={cislo(MAGISTRAT.pocetObyvatel)} />
        <Udaj popisek="Kód ČSÚ" hodnota={MAGISTRAT.kod} />
      </dl>

      <section>
        <h2 className="text-2xl">Kandidující subjekty</h2>

        {polozky.length === 0 ? (
          <p className="mt-3 max-w-prose">
            Kandidátní listiny pro rok 2026 zatím Český statistický úřad v otevřených datech
            nezveřejnil. Jakmile je vydá, objeví se tady seznam volebních stran, jejich
            programy a hodnocení proveditelnosti jednotlivých slibů.
          </p>
        ) : (
          <>
            <p className="mt-3 max-w-prose">
              Registrační úřad zaregistroval{' '}
              <strong>
                {sPoctem(polozky.length, 'kandidátní listinu', 'kandidátní listiny', 'kandidátních listin')}
              </strong>{' '}
              s celkem{' '}
              {cislo(
                listina?.strany.reduce((n, s) => n + s.kandidati.length, 0) ?? 0,
              )}{' '}
              kandidáty. Výchozí pořadí je abecední, ne podle preferencí ani velikosti —
              {vylosovano
                ? ' vylosovaná čísla najdete u jednotlivých subjektů.'
                : ' čísla na hlasovacím lístku zatím vylosovaná nebyla a doplníme je, jakmile budou.'}
            </p>
            <p className="mt-2 max-w-prose text-sm text-seda-uredni">
              U každého subjektu uvádíme stav programu ke stejnému datu, ať je vidět,
              kde hodnocení chybí a proč. Jméno lídra publikujeme jen tam, kde ho doloží
              zdroj.
            </p>

            {/* Pojistka proti asymetrii podle metodiky — bez ní by hodnocení
                vypadalo jako pozornost věnovaná jen některým subjektům. */}
            <p className="mt-4 max-w-prose border-l-2 border-praha pl-5 text-sm">
              <span className="popisek-uredni block">Proč má hodnocení jen část stran</span>
              Hodnotíme sliby, které jsou dost konkrétní na ověření. K uvedenému datu
              zveřejnila takový materiál jen menšina kandidujících subjektů — u ostatních
              jsme program nedohledali, nebo obsahuje jen obecné priority bez čísel
              a termínů. Není to hodnocení subjektů, ale jejich programů. Jakmile další
              program vyjde, projde stejným rámcem.
            </p>
            <RazenySeznam
              polozky={polozky.map((strana) => ({
                slug: strana.slug,
                nazev: strana.zkratka,
                cislo: strana.cislo,
                procenta: strana.procenta,
                obsah: <DlazdiceStrany strana={strana} />,
              }))}
              tridaSeznamu="mt-5 grid gap-px border border-inkoust bg-linka-silna sm:grid-cols-2"
              popisSeznamu="Kandidující volební strany"
              jednotka={['volební strana', 'volební strany', 'volebních stran']}
              pruzkumPuvod={pruzkum ? puvodPruzkumu(pruzkum) : undefined}
              pruzkumOdkaz={pruzkum?.url}
              duvodBezPruzkumu={duvodBezPruzkumu('magistrat')}
            zdrojeDuvodu={zdrojePoznamky()}
            />
          </>
        )}

        <p className="mt-5 max-w-prose">
          <Link href="/jak-hodnotime" className="odkaz-akcent">
            Jak hodnotíme proveditelnost
          </Link>
        </p>
        <p className="popisek-uredni mt-6">
          Údaje o mandátech a okrscích jsou ze sady {SADA_CISELNIKU} · zdroj:{' '}
          <a href="https://volby.gov.cz/opendata/opendata.htm" className="underline">
            otevřená data ČSÚ
          </a>
        </p>
      </section>
    </div>
  )
}

function Udaj({ popisek, hodnota }: { popisek: string; hodnota: string }) {
  return (
    <div className="bg-papir p-3">
      <dt className="popisek-uredni">{popisek}</dt>
      <dd className="mt-1 font-mono text-lg">{hodnota}</dd>
    </div>
  )
}
