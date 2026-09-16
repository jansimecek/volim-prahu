import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { programy, strany } from '#content'
import { PosuvnaTabulka } from '@/components/PosuvnaTabulka'
import { JAZYKY, jazykoveVarianty, jeJazyk } from '@/lib/jazyky'
import { celeJmeno, lidr, platniKandidati, stranaPodleKodu } from '@/lib/kandidatky'
import { serazene } from '@/lib/strany'
import { preklad } from '@/preklady'

export function generateStaticParams() {
  return JAZYKY.map((jazyk) => ({ jazyk }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jazyk: string }>
}): Promise<Metadata> {
  const { jazyk } = await params
  if (!jeJazyk(jazyk)) return {}
  const t = preklad(jazyk)
  return {
    title: t.whoIsRunning.h1,
    description: t.sdileni['who-is-running'].popis,
    alternates: { languages: jazykoveVarianty(`/${jazyk}/who-is-running`) },
  }
}

/**
 * Výpis kandidujících subjektů bez průzkumů.
 *
 * Nepoužívá se `vypisStran()` schválně: ta k položkám přidává procenta
 * z průzkumu, a tím i vyhodnocení moratoria za běhu. Cizojazyčná stránka
 * žádné procento neukazuje, takže si tím nemá cenu kazit statickou
 * generaci — a hlavně nemůže omylem zveřejnit průzkum v zakázané lhůtě.
 */
function kandidujici() {
  const polozky = serazene(strany.filter((s) => s.uroven === 'magistrat')).map((strana) => {
    const naListine = stranaPodleKodu('magistrat', strana.kodStrany)
    const jednicka = lidr(naListine)
    return {
      slug: strana.slug,
      nazev: strana.zkratka,
      lidr: jednicka ? celeJmeno(jednicka) : null,
      pocetKandidatu: platniKandidati(naListine).length,
      cislo: naListine?.vylosovano ? naListine.cislo : null,
      maProgram: programy.some((p) => p.uroven === 'magistrat' && p.subjekt === strana.slug),
    }
  })

  // Řadí se podle vylosovaného čísla, ne abecedy: čtenář, který česky
  // neumí, hledá stranu na papírovém lístku podle čísla ve sloupci.
  // Nevylosované jdou na konec, tam si abecední pořadí drží.
  return polozky.sort((a, b) => {
    if (a.cislo === null && b.cislo === null) return 0
    if (a.cislo === null) return 1
    if (b.cislo === null) return -1
    return a.cislo - b.cislo
  })
}

export default async function WhoIsRunning({ params }: { params: Promise<{ jazyk: string }> }) {
  const { jazyk } = await params
  if (!jeJazyk(jazyk)) notFound()
  const t = preklad(jazyk)
  const s = t.whoIsRunning
  const polozky = kandidujici()

  return (
    <div className="space-y-12">
      <section>
        <h1 className="max-w-3xl text-3xl sm:text-4xl">{s.h1}</h1>
        <p className="mt-5 max-w-prose text-lg">{s.perex}</p>
      </section>

      <section aria-labelledby="kandidatky">
        <h2 id="kandidatky" className="sr-only">
          {s.h1}
        </h2>
        <PosuvnaTabulka popisek={s.h1}>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th scope="col" className="popisek-uredni border-b border-inkoust py-2 pe-4">
                  {s.sloupce.cislo}
                </th>
                <th scope="col" className="popisek-uredni border-b border-inkoust py-2 pe-4">
                  {s.sloupce.strana}
                </th>
                <th scope="col" className="popisek-uredni border-b border-inkoust py-2 pe-4">
                  {s.sloupce.lidr}
                </th>
                <th scope="col" className="popisek-uredni border-b border-inkoust py-2 text-right">
                  {s.sloupce.kandidatu}
                </th>
              </tr>
            </thead>
            <tbody>
              {polozky.map((p) => (
                <tr key={p.slug} className="border-b border-linka">
                  <td className="py-3 pe-4 font-mono">{p.cislo ?? s.bezCisla}</td>
                  <th scope="row" className="py-3 pe-4 font-normal">
                    {/* Názvy stran a jména kandidátů se nepřekládají a jsou
                        česky — `lang` to říká odečítači, ať je nečte anglickou
                        nebo ukrajinskou výslovností. */}
                    <span lang="cs">{p.nazev}</span>
                    <span className="mt-1 block text-sm">
                      <Link href={`/praha/strana/${p.slug}`} className="odkaz-akcent" hrefLang="cs">
                        {s.profilOdkaz}
                      </Link>
                      {p.maProgram && (
                        <>
                          {' · '}
                          <Link
                            href={`/praha/strana/${p.slug}/program`}
                            className="odkaz-akcent"
                            hrefLang="cs"
                          >
                            {s.programOdkaz}
                          </Link>
                        </>
                      )}
                    </span>
                  </th>
                  <td className="py-3 pe-4" lang="cs">
                    {p.lidr ?? <span lang={t.htmlLang}>{s.bezLidra}</span>}
                  </td>
                  <td className="py-3 text-right font-mono">{p.pocetKandidatu || s.bezCisla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PosuvnaTabulka>
        <p className="popisek-uredni mt-4">{s.dataPoznamka}</p>
        <p className="mt-2 max-w-prose text-sm text-seda-uredni">{s.pruzkumyPoznamka}</p>
      </section>

      <section aria-labelledby="mc">
        <h2 id="mc" className="text-2xl">
          {s.mcNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.mcText}</p>
        <p className="mt-4">
          <Link href="/mestska-cast" className="odkaz-akcent text-lg" hrefLang="cs">
            {s.mcOdkaz}
          </Link>
        </p>
      </section>

      <section aria-labelledby="senat">
        <h2 id="senat" className="text-2xl">
          {s.senatNadpis}
        </h2>
        <p className="mt-3 max-w-prose">{s.senatText}</p>
        <p className="mt-4">
          <Link href="/senat" className="odkaz-akcent" hrefLang="cs">
            {s.senatOdkaz}
          </Link>
        </p>
      </section>
    </div>
  )
}
