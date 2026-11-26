import type { Metadata } from 'next'
import Link from 'next/link'
import { Obsah } from '@/components/Obsah'
import { StrukturovanaData } from '@/components/StrukturovanaData'
import { ZavazekSmlouvy } from '@/components/ZavazekSmlouvy'
import { MDXContent } from '@/components/mdx'
import { datumCesky } from '@/lib/cestina'
import { KONECNE_VYSLEDKY } from '@/lib/konecneVysledky'
import { nadpisyStranky } from '@/lib/nadpisy'
import { strankaPodleSlugu } from '@/lib/obsah'
import { kotvaRadniho } from '@/lib/rada'
import { mereniSmlouvy, smlouva } from '@/lib/smlouva'
import { nazevSubjektu } from '@/lib/vyjednavani'
import { KOD_MAGISTRATU } from '@/lib/vysledky'
import { absolutni } from '@/lib/web'

const stranka = strankaPodleSlugu('koalicni-smlouva')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

export default function StrankaKoalicniSmlouvy() {
  const { dokument, kapitoly } = smlouva
  const mereni = mereniSmlouvy()
  const magistrat = KONECNE_VYSLEDKY.zastupitelstva.find((z) => z.kod === KOD_MAGISTRATU)
  const nazev = (slug: string) => (magistrat ? nazevSubjektu(magistrat, slug) : slug)
  const podil = (n: number) => `${Math.round((n / mereni.jedinecnych) * 100)} %`

  return (
    <article className="space-y-12">
      <StrukturovanaData
        data={{
          '@type': 'WebPage',
          name: stranka.title,
          description: stranka.popis,
          url: absolutni('/koalicni-smlouva'),
          inLanguage: 'cs',
          dateModified: smlouva.overeno,
          mainEntity: {
            '@type': 'Dataset',
            name: 'Závazky koaliční smlouvy hl. m. Prahy 2026–2030',
            description: 'Doslovné znění programových priorit koaliční smlouvy STAN, SPOLU a Prahy sobě, po oddílech a radních.',
            isBasedOn: dokument.zverejneno.url,
            distribution: [
              { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: absolutni('/data/koalicni-smlouva.json') },
            ],
          },
        }}
      />
      <header className="max-w-prose">
        <p className="popisek-uredni">Vedení města 2026–2030</p>
        <h1 className="mt-2 text-4xl">{stranka.title}</h1>
        <p className="mt-3">
          {dokument.strany.map(nazev).join(', ')} · podepsáno {datumCesky(dokument.podepsano)} ·{' '}
          <Link href="/rada" className="odkaz-akcent">
            Kdo za co odpovídá v radě
          </Link>
        </p>
      </header>

      <Obsah
        polozky={[
          { id: 'prehled', text: 'Přehled' },
          ...nadpisyStranky(stranka.surovy),
          ...kapitoly.map((k) => ({ id: k.id, text: k.nazev.split(',')[0]! })),
        ]}
      />

      <section id="prehled" className="scroll-mt-20 space-y-6">
        <h2 className="sr-only">Přehled</h2>
        <dl className="grid gap-px border border-inkoust bg-linka-silna sm:grid-cols-3">
          <Udaj popisek="Zveřejněno">
            <a href={dokument.zverejneno.url} className="odkaz-akcent" rel="noopener">
              Programové priority ze smlouvy
            </a>
            <span className="popisek-uredni block">
              {dokument.zverejneno.stran} stran · {datumCesky(dokument.zverejneno.vydano)}
            </span>
          </Udaj>
          <Udaj popisek="Celé znění smlouvy">
            {dokument.plneZneniZverejneno ? 'zveřejněné' : 'nezveřejněné'}
            <span className="popisek-uredni block">práva a povinnosti stran, výbory, firmy</span>
          </Udaj>
          <Udaj popisek="Programové prohlášení">
            {dokument.programoveProhlaseni ? (
              <a href={dokument.programoveProhlaseni.zdroj.url} className="odkaz-akcent" rel="noopener">
                slíbené do 100 dnů
              </a>
            ) : (
              '—'
            )}
            <span className="popisek-uredni block">od volby rady 19. 11. 2026</span>
          </Udaj>
        </dl>

        <dl className="grid grid-cols-2 gap-px border border-inkoust bg-linka-silna sm:grid-cols-3 lg:grid-cols-6">
          <Cislo popisek="Závazků" hodnota={mereni.celkem} doplnek={`${mereni.jedinecnych} bez opakování`} />
          <Cislo popisek="S číslem" hodnota={mereni.sCislem} doplnek={podil(mereni.sCislem)} />
          <Cislo popisek="S termínem" hodnota={mereni.sLetopoctem} doplnek={podil(mereni.sLetopoctem)} />
          <Cislo popisek="Prověřovacích" hodnota={mereni.proverovacich} doplnek={podil(mereni.proverovacich)} />
          <Cislo popisek="Podmíněných" hodnota={mereni.podminenych} doplnek={podil(mereni.podminenych)} />
          <Cislo popisek="S rozborem" hodnota={mereni.analyzovanych} doplnek={`z ${mereni.celkem}`} />
        </dl>
        <p className="max-w-prose text-sm text-seda-uredni">
          Počty jsou strojové a podíly se počítají z {mereni.jedinecnych} závazků bez opakování; jak
          vznikly, je popsané níže. Ověřeno {datumCesky(smlouva.overeno)}.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-inkoust">
                <th className="popisek-uredni py-2 pr-3">Kapitola</th>
                <th className="popisek-uredni py-2 pr-3">Odpovídá v radě</th>
                <th className="popisek-uredni py-2 text-right">Závazků</th>
              </tr>
            </thead>
            <tbody>
              {kapitoly.map((k) => {
                const radni = [...new Set(k.oddily.flatMap((o) => o.radni))]
                return (
                  <tr key={k.id} className="border-b border-linka-silna align-top">
                    <td className="py-2 pr-3">
                      <a href={`#${k.id}`} className="odkaz-akcent">
                        {k.nazev}
                      </a>
                    </td>
                    <td className="py-2 pr-3">{radni.length > 0 ? radni.join(', ') : '—'}</td>
                    <td className="py-2 text-right font-mono">
                      {k.oddily.reduce((n, o) => n + o.zavazky.length, 0)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="proza max-w-prose">
        <MDXContent code={stranka.content} />
      </div>

      {kapitoly.map((k) => (
        <section key={k.id} id={k.id} className="scroll-mt-20">
          <h2 className="text-3xl">{k.nazev}</h2>
          {k.oddily.map((o) => (
            <div key={o.id} id={`oddil-${o.id}`} className="mt-8 scroll-mt-20">
              {/* Kapitola bez oddílů má v dokumentu jediný oddíl stejného jména — druhý nadpis by jen opakoval první. */}
              {o.nazev !== k.nazev && <h3 className="text-xl">{o.nazev}</h3>}
              <p className="popisek-uredni mt-1">
                {o.zavazky.length} {o.zavazky.length === 1 ? 'závazek' : o.zavazky.length < 5 ? 'závazky' : 'závazků'} ·{' '}
                {o.radni.length > 0 ? (
                  <>
                    odpovídá{' '}
                    {o.radni.map((r, i) => (
                      <span key={r}>
                        {i > 0 && ', '}
                        <Link href={`/rada#${kotvaRadniho(r)}`} className="odkaz-akcent">
                          {r}
                        </Link>
                      </span>
                    ))}
                  </>
                ) : (
                  'gesce v radě není jednoznačná'
                )}
              </p>
              <ol className="mt-3 border-t border-linka-silna">
                {o.zavazky.map((z) => (
                  <ZavazekSmlouvy key={z.id} zavazek={z} nazevSubjektu={nazev} />
                ))}
              </ol>
            </div>
          ))}
        </section>
      ))}

      <footer className="border-t border-linka pt-6">
        <p className="popisek-uredni">
          Zdroj znění:{' '}
          <a href={dokument.zverejneno.url} className="odkaz-akcent" rel="noopener">
            {dokument.zverejneno.nazev}
          </a>{' '}
          · podpis:{' '}
          <a href={dokument.zdrojPodpisu.url} className="odkaz-akcent" rel="noopener">
            {dokument.zdrojPodpisu.text}
          </a>{' '}
          · aktualizováno {datumCesky(stranka.aktualizovano)}
        </p>
      </footer>
    </article>
  )
}

function Udaj({ popisek, children }: { popisek: string; children: React.ReactNode }) {
  return (
    <div className="bg-papir p-3">
      <dt className="popisek-uredni">{popisek}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

function Cislo({ popisek, hodnota, doplnek }: { popisek: string; hodnota: number; doplnek: string }) {
  return (
    <div className="bg-papir p-3">
      <dt className="popisek-uredni">{popisek}</dt>
      <dd className="mt-1 font-mono text-lg">
        {hodnota} <span className="text-sm text-seda-uredni">{doplnek}</span>
      </dd>
    </div>
  )
}
