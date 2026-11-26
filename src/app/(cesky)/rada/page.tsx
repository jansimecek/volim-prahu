import type { Metadata } from 'next'
import Link from 'next/link'
import { Obsah } from '@/components/Obsah'
import { StrukturovanaData } from '@/components/StrukturovanaData'
import { MDXContent } from '@/components/mdx'
import { datumCesky } from '@/lib/cestina'
import { celeJmeno } from '@/lib/kandidatky'
import { KONECNE_VYSLEDKY } from '@/lib/konecneVysledky'
import { nadpisyStranky } from '@/lib/nadpisy'
import { strankaPodleSlugu } from '@/lib/obsah'
import { kotvaRadniho, rada, radaMagistratu, zdrojRady } from '@/lib/rada'
import { nazevSubjektu, vyjednavaniZastupitelstva } from '@/lib/vyjednavani'
import { KOD_MAGISTRATU } from '@/lib/vysledky'
import { absolutni } from '@/lib/web'

const stranka = strankaPodleSlugu('rada')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

export default function StrankaRady() {
  const clenove = radaMagistratu()
  const v = vyjednavaniZastupitelstva('magistrat')
  const volba = v?.udalosti.find((u) => u.typ === 'volba')
  const magistrat = KONECNE_VYSLEDKY.zastupitelstva.find((z) => z.kod === KOD_MAGISTRATU)
  const nazev = (slug: string) => (magistrat ? nazevSubjektu(magistrat, slug) : slug)
  const zdrojVedeni = v?.zdroje.find((z) => z.id === clenove[0]?.zdroj)

  return (
    <article className="space-y-12">
      <StrukturovanaData
        data={{
          '@type': 'WebPage',
          name: stranka.title,
          description: stranka.popis,
          url: absolutni('/rada'),
          inLanguage: 'cs',
          dateModified: rada.overeno,
          about: {
            '@type': 'GovernmentOrganization',
            name: 'Rada hlavního města Prahy',
            member: clenove.map((c) => ({ '@type': 'Person', name: c.jmeno, jobTitle: c.funkce })),
          },
        }}
      />
      <header className="max-w-prose">
        <p className="popisek-uredni">Vedení města 2026–2030</p>
        <h1 className="mt-2 text-4xl">{stranka.title}</h1>
        <p className="mt-3">
          {volba ? `Zvolena ${datumCesky(volba.datum)}` : 'Zvolena v listopadu 2026'} · koalice STAN, SPOLU
          a Prahy sobě, 47 z 65 zastupitelů ·{' '}
          <Link href="/koalicni-smlouva" className="odkaz-akcent">
            Koaliční smlouva
          </Link>
        </p>
      </header>

      <Obsah
        polozky={[
          ...clenove.map((c) => ({ id: kotvaRadniho(c.jmeno), text: c.jmeno })),
          ...nadpisyStranky(stranka.surovy),
        ]}
      />

      <div className="grid gap-px border border-inkoust bg-linka-silna md:grid-cols-2">
        {clenove.map((c) => (
          <section key={c.jmeno} id={kotvaRadniho(c.jmeno)} className="scroll-mt-20 bg-papir p-4 md:odd:last:col-span-2">
            <p className="popisek-uredni">{c.funkce}</p>
            <h2 className="mt-1 font-display text-2xl font-medium">
              <Link href={`/kandidat/${c.kandidat}`} className="hover:underline">
                {c.kandidatura ? celeJmeno(c.kandidatura) : c.jmeno}
              </Link>
            </h2>
            <p className="mt-1 text-sm">
              {nazev(c.subjekt)}
              {c.kandidatura && (
                <span className="text-seda-uredni">
                  {' '}
                  · {c.kandidatura.vek} let · {c.kandidatura.politickaPrislusnost || 'bez politické příslušnosti'}
                </span>
              )}
            </p>

            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="popisek-uredni">Gesce</dt>
                <dd>{c.gesce.length > 0 ? c.gesce.join(', ') : '—'}</dd>
              </div>
              {c.kandidatura?.povolani && (
                <div>
                  <dt className="popisek-uredni">Povolání na kandidátce</dt>
                  <dd>{c.kandidatura.povolani}</dd>
                </div>
              )}
              {c.pusobeni.length > 0 && (
                <div>
                  <dt className="popisek-uredni">Dřív</dt>
                  <dd>
                    <ul className="space-y-1">
                      {c.pusobeni.map((p) => {
                        const z = zdrojRady(p.zdroj)
                        return (
                          <li key={p.text}>
                            {p.text}{' '}
                            {z && (
                              <a href={z.url} className="popisek-uredni underline" rel="noopener nofollow">
                                {z.medium}, {datumCesky(z.datum)}
                              </a>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </dd>
                </div>
              )}
              <div>
                <dt className="popisek-uredni">Koaliční smlouva</dt>
                <dd>
                  {c.oddily.length > 0 ? (
                    <>
                      {c.zavazku} závazků v oddílech{' '}
                      {c.oddily.map(({ oddil, kapitola }, i) => (
                        <span key={oddil.id}>
                          {i > 0 && ', '}
                          <Link href={`/koalicni-smlouva#oddil-${oddil.id}`} className="odkaz-akcent">
                            {oddil.nazev === kapitola.nazev || oddil.nazev === 'Priority' ? kapitola.nazev : oddil.nazev}
                          </Link>
                        </span>
                      ))}
                    </>
                  ) : (
                    'žádný oddíl smlouvy gesci jednoznačně neodpovídá'
                  )}
                </dd>
              </div>
              <div>
                <dt className="popisek-uredni">Rozbor práce v radě</dt>
                <dd>
                  {c.analyza ? (
                    <>
                      {c.analyza.shrnuti}{' '}
                      <span className="popisek-uredni">ověřeno {datumCesky(c.analyza.overeno)}</span>
                      <ul>
                        {c.analyza.zdroje.map((z) => (
                          <li key={z.url}>
                            <a href={z.url} className="odkaz-akcent inline-block py-1" rel="noopener">
                              {z.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    'zatím není'
                  )}
                </dd>
              </div>
            </dl>
          </section>
        ))}
      </div>

      <div className="proza max-w-prose">
        <MDXContent code={stranka.content} />
      </div>

      <footer className="border-t border-linka pt-6">
        <p className="popisek-uredni">
          Funkce a gesce:{' '}
          {zdrojVedeni ? (
            <a href={zdrojVedeni.url} className="odkaz-akcent" rel="noopener">
              {zdrojVedeni.medium}, {datumCesky(zdrojVedeni.datum)}
            </a>
          ) : (
            'vyjednávání na magistrátu'
          )}{' '}
          · věk a povolání: kandidátní listina, otevřená data ČSÚ · ověřeno {datumCesky(rada.overeno)}
        </p>
      </footer>
    </article>
  )
}
