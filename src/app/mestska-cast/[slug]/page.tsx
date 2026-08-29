import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Drobecky } from '@/components/Drobecky'
import { MDXContent } from '@/components/mdx'
import { RazenySeznam } from '@/components/RazenySeznam'
import { sPoctem } from '@/lib/cestina'
import { MESTSKE_CASTI, SADA_CISELNIKU, cislo, mestskaCastPodleSlugu } from '@/lib/obsah'
import { SeznamKandidatu } from '@/components/SeznamKandidatu'
import { celeJmeno, kandidatka, lidr } from '@/lib/kandidatky'
import { stavMestskeCasti } from '@/lib/desky'
import { senatniStavMestskeCasti } from '@/lib/senat'

type Parametry = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return MESTSKE_CASTI.map((mc) => ({ slug: mc.slug }))
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { slug } = await params
  const mc = mestskaCastPodleSlugu(slug)
  if (!mc) return {}
  return {
    title: mc.nazev,
    description: `Volby do zastupitelstva ${mc.nazev} 2026: ${mc.mandaty} mandátů, kandidující subjekty a místní témata.`,
  }
}

export default async function StrankaMestskeCasti({ params }: Parametry) {
  const { slug } = await params
  const mc = mestskaCastPodleSlugu(slug)
  const zastupitelstvo = MESTSKE_CASTI.find((z) => z.slug === slug)
  if (!mc || !zastupitelstvo) notFound()

  const senat = senatniStavMestskeCasti(slug)
  const deska = stavMestskeCasti(slug)
  const listina = kandidatka(slug)
  const kandidatuCelkem = listina?.strany.reduce((n, s) => n + s.kandidati.length, 0) ?? 0

  return (
    <div className="space-y-10">
      <header>
        <Drobecky
          cesta={[
            { popisek: 'Úvod', href: '/' },
            { popisek: 'Městské části', href: '/mestska-cast' },
            { popisek: mc.nazev },
          ]}
        />
        <h1 className="mt-3 text-4xl">{mc.nazev}</h1>
      </header>

      {/* Údaje z číselníku ČSÚ — needitovatelné ručně, proto vizuálně odděleno od textu. */}
      <dl className="grid grid-cols-2 gap-px border border-inkoust bg-linka-silna sm:grid-cols-4">
        <Udaj popisek="Mandátů" hodnota={cislo(mc.mandaty)} />
        <Udaj popisek="Volebních okrsků" hodnota={cislo(mc.okrsky)} />
        <Udaj popisek="Obyvatel" hodnota={cislo(zastupitelstvo.pocetObyvatel)} />
        <Udaj popisek="Kód ČSÚ" hodnota={mc.kodZastupitelstva} />
      </dl>

      {/* Jestli tady člověk dostane i senátní lístek, se jinde zjišťuje těžko. */}
      <section className="max-w-prose border-l-2 border-praha pl-5">
        <h2 className="text-2xl">Senátní volby 2026</h2>
        {senat.stav === 'voli' && (
          <p className="mt-2">
            Kromě zastupitelstev tady volíte i senátora — spadáte do{' '}
            <Link href={`/senat/${senat.obvod.slug}`} className="odkaz-akcent">
              obvodu č. {senat.obvod.cislo} ({senat.obvod.nazev})
            </Link>
            .
          </p>
        )}
        {senat.stav === 'castecne' && (
          <p className="mt-1">
            Tahle městská část je rozdělená mezi dva senátní obvody. Do{' '}
            <Link href={`/senat/${senat.obvod.slug}`} className="odkaz-akcent">
              obvodu č. {senat.obvod.cislo} ({senat.obvod.nazev})
            </Link>
            , kde se letos volí, patří {senat.popis}. Ve zbytku území se senátor letos
            nevolí — rozhoduje adresa, ne příslušnost k městské části.
          </p>
        )}
        {senat.stav === 'nevoli' && (
          <p className="mt-1">
            Senátora tady letos nevolíte. Senát se obměňuje po třetinách a{' '}
            <Link href="/senat" className="odkaz-akcent">
              obvod, do kterého tahle část patří
            </Link>
            , přijde na řadu až v dalších letech. Ve volební místnosti dostanete jen
            lístky pro zastupitelstvo města a městské části.
          </p>
        )}
      </section>

      {/* Kde přesně se v téhle části volí — závazné je oznámení na úřední desce. */}
      {deska && (
        <section className="max-w-prose border-l-2 border-praha pl-5">
          <h2 className="text-2xl">Kde se tady volí</h2>
          {deska.oznameni ? (
            <p className="mt-1">
              Oznámení o době a místě konání voleb je vyvěšené:{' '}
              <a href={deska.oznameni.url} className="odkaz-akcent" rel="noopener">
                {deska.oznameni.nazev}
              </a>
              {deska.oznameni.vyveseno && ` (vyvěšeno ${deska.oznameni.vyveseno})`}. Najdete
              v něm adresu vaší volební místnosti.
            </p>
          ) : (
            <p className="mt-1">
              Oznámení o době a místě konání voleb tahle část zatím nevyvěsila. Vyvěsit ho
              musí nejpozději 24. září 2026.{' '}
              {deska.urlDesky ? (
                <>
                  Sledovat můžete{' '}
                  <a href={deska.urlDesky} className="odkaz-akcent" rel="noopener">
                    její úřední desku
                  </a>
                  .
                </>
              ) : (
                'Adresu její úřední desky zatím nemáme.'
              )}
            </p>
          )}
          <p className="mt-2 text-sm">
            <Link href="/kde-volim" className="odkaz-akcent">
              Přehled za všech 57 městských částí
            </Link>
          </p>
        </section>
      )}

      <div className="proza max-w-prose">
        <MDXContent code={mc.content} />
      </div>

      {mc.temata.length > 0 && (
        <section>
          <h2 className="text-2xl">Místní témata</h2>
          <ul className="mt-4 space-y-4">
            {mc.temata.map((tema) => (
              <li key={tema.nadpis} className="max-w-prose border-l-2 border-linka-silna pl-4">
                <h3 className="font-display font-semibold">{tema.nadpis}</h3>
                <p className="mt-1">{tema.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t border-linka pt-6">
        <h2 className="text-2xl">Kandidující subjekty</h2>
        {!listina || listina.strany.length === 0 ? (
          <p className="mt-3 max-w-prose">
            Pro tuhle městskou část nemáme kandidátní listiny k dispozici.
          </p>
        ) : (
          <>
            <p className="mt-3 max-w-prose">
              O {cislo(mc.mandaty)} mandátů se uchází {listina.strany.length}{' '}
              {listina.strany.length === 1 ? 'volební strana' : 'volebních stran'} s celkem{' '}
              {cislo(kandidatuCelkem)} kandidáty.{' '}
              {listina.strany.some((s) => s.vylosovano)
                ? 'Výchozí pořadí je abecední podle názvu; přepnout jde na pořadí podle vylosovaných čísel.'
                : 'Pořadí je abecední podle názvu, ne podle preferencí — čísla na hlasovacím lístku tady zatím vylosovaná nebyla.'}
            </p>

            {/* Fakt, který volič jinde nedostane a který mění smysl jeho hlasu. */}
            {listina.strany.length === 1 && (
              <p className="mt-4 max-w-prose border-l-2 border-praha pl-5">
                <span className="popisek-uredni block">Jediná volební strana</span>
                V téhle městské části podala kandidátní listinu jen jedna volební strana.
                Na {cislo(mc.mandaty)} mandátů má {cislo(kandidatuCelkem)}{' '}
                {kandidatuCelkem === mc.mandaty
                  ? 'kandidátů, tedy přesně tolik, kolik je míst v zastupitelstvu.'
                  : 'kandidátů.'}{' '}
                Vybírat mezi stranami tu tedy nelze; hlas rozhoduje o pořadí kandidátů
                uvnitř jediné listiny a o tom, jestli volby vůbec budou platné.
              </p>
            )}

            <RazenySeznam
              polozky={listina.strany.map((strana) => {
                const jednicka = lidr(strana)
                return {
                  slug: strana.slug,
                  nazev: strana.nazev,
                  cislo: strana.vylosovano ? strana.cislo : null,
                  // Průzkumy preferencí se v městských částech nedělají.
                  procenta: null,
                  obsah: (
                    <li>
                      <article>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-inkoust pb-2">
                          <h3 className="font-display text-lg font-semibold">{strana.nazev}</h3>
                          <p className="popisek-uredni">
                            {strana.vylosovano && strana.cislo !== null
                              ? `č. ${strana.cislo} na lístku`
                              : 'číslo zatím nevylosováno'}{' '}
                            ·{' '}
                            {sPoctem(
                              strana.kandidati.length,
                              'kandidát',
                              'kandidáti',
                              'kandidátů',
                            )}
                          </p>
                        </div>
                        {jednicka && (
                          <p className="mt-2 text-sm">
                            Lídr: {celeJmeno(jednicka)}
                            {jednicka.povolani ? `, ${jednicka.povolani}` : ''}
                          </p>
                        )}
                        <details className="mt-3">
                          <summary className="cursor-pointer popisek-uredni">
                            <span className="pl-1.5">Zobrazit celou kandidátku</span>
                          </summary>
                          <div className="mt-3">
                            <SeznamKandidatu strana={strana} />
                          </div>
                        </details>
                      </article>
                    </li>
                  ),
                }
              })}
              tridaSeznamu="mt-6 space-y-10"
              popisSeznamu="Kandidující volební strany"
              jednotka={['volební strana', 'volební strany', 'volebních stran']}
            />
          </>
        )}

        <p className="popisek-uredni mt-8">
          Údaje o mandátech a okrscích jsou ze sady {SADA_CISELNIKU}, kandidátky ze sady{' '}
          {listina?.sada ?? '—'} · zdroj:{' '}
          <a href="https://volby.gov.cz/opendata/opendata.htm" className="underline">
            otevřená data ČSÚ
          </a>
        </p>
      </section>

      {!mc.publikovano && (
        <p className="border border-okr px-4 py-3 text-sm text-okr">
          Textová část téhle stránky je zatím rozpracovaná. Údaje z číselníku ČSÚ výše
          jsou platné.
        </p>
      )}
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
