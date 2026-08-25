import type { Metadata } from 'next'
import Link from 'next/link'
import { programy, strany } from '#content'
import { MAGISTRAT, SADA_CISELNIKU, cislo } from '@/lib/obsah'

export const metadata: Metadata = {
  title: 'Magistrát',
  description:
    'Volby do Zastupitelstva hlavního města Prahy 2026: 65 mandátů, kandidující subjekty a hodnocení proveditelnosti jejich programů.',
}

export default function StrankaMagistratu() {
  const kandidujici = strany
    .filter((s) => s.uroven === 'magistrat')
    .sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs'))

  const pocetHodnoceni = (slug: string) =>
    programy.find((p) => p.subjekt === slug && p.uroven === 'magistrat')?.body.filter(
      (b) => b.hodnoceni,
    ).length ?? 0

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

      <dl className="grid grid-cols-2 gap-px border border-inkoust bg-linka sm:grid-cols-4">
        <Udaj popisek="Mandátů" hodnota={cislo(MAGISTRAT.mandaty)} />
        <Udaj popisek="Volebních okrsků" hodnota={cislo(MAGISTRAT.okrskyCelkem)} />
        <Udaj popisek="Obyvatel" hodnota={cislo(MAGISTRAT.pocetObyvatel)} />
        <Udaj popisek="Kód ČSÚ" hodnota={MAGISTRAT.kod} />
      </dl>

      <section>
        <h2 className="text-2xl">Kandidující subjekty</h2>

        {kandidujici.length === 0 ? (
          <p className="mt-3 max-w-prose">
            Kandidátní listiny pro rok 2026 zatím Český statistický úřad v otevřených datech
            nezveřejnil. Jakmile je vydá, objeví se tady seznam volebních stran, jejich
            programy a hodnocení proveditelnosti jednotlivých slibů.
          </p>
        ) : (
          <>
            <p className="mt-3 max-w-prose text-sm text-seda-uredni">
              Pořadí je abecední, ne podle preferencí. Čísla kandidátek doplníme, až je
              vylosuje registrační úřad.
            </p>
            <ul className="mt-5 grid gap-px border border-inkoust bg-linka sm:grid-cols-2">
              {kandidujici.map((strana) => (
                <li key={strana.slug} className="bg-papir">
                  <Link
                    href={`/praha/strana/${strana.slug}`}
                    className="block h-full p-4 no-underline hover:bg-papir-tmavsi"
                  >
                    <span className="block font-display text-lg font-semibold">
                      {strana.nazev}
                    </span>
                    {strana.lidr && (
                      <span className="mt-1 block text-sm">Lídr: {strana.lidr}</span>
                    )}
                    <span className="popisek-uredni mt-2 block">
                      {pocetHodnoceni(strana.slug) > 0
                        ? `${pocetHodnoceni(strana.slug)} hodnocených slibů`
                        : 'hodnocení zatím nezveřejněno'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-5 max-w-prose">
          <Link href="/jak-hodnotime" className="odkaz-akcent">
            Jak hodnocení vzniká
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
