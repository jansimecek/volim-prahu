import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/mdx'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { OBVODY } from '@/lib/senat'
import { celeJmenoSenat, kandidatiObvodu, obhajuje, sadaSenat } from '@/lib/senatKandidati'

type Parametry = { params: Promise<{ obvod: string }> }

export function generateStaticParams() {
  return OBVODY.map((o) => ({ obvod: o.slug }))
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { obvod: slug } = await params
  const obvod = OBVODY.find((o) => o.slug === slug)
  if (!obvod) return {}
  return {
    title: `Senátní obvod č. ${obvod.cislo} — ${obvod.nazev}`,
    description: `Které městské části patří do senátního obvodu č. ${obvod.cislo} a kdo v něm dnes zastupuje Prahu v Senátu.`,
  }
}

export default async function StrankaObvodu({ params }: Parametry) {
  const { obvod: slug } = await params
  const obvod = OBVODY.find((o) => o.slug === slug)
  if (!obvod) notFound()

  const nazevMC = (s: string) => MESTSKE_CASTI.find((mc) => mc.slug === s)?.nazev ?? s
  const kandidati = kandidatiObvodu(obvod.cislo)
  const senatorObhajuje = obhajuje(obvod.cislo, obvod.senator)

  return (
    <div className="space-y-10">
      <header>
        <p className="popisek-uredni">
          <Link href="/senat" className="no-underline">
            Senátní volby v Praze
          </Link>
        </p>
        <h1 className="mt-2 text-4xl">
          Obvod č. {obvod.cislo} — {obvod.nazev}
        </h1>
      </header>

      <dl className="grid grid-cols-1 gap-px border border-inkoust bg-linka sm:grid-cols-3">
        <div className="bg-papir p-3">
          <dt className="popisek-uredni">Stávající senátor</dt>
          <dd className="mt-1 font-mono">
            <a href={obvod.senatorZdroj} className="odkaz-akcent inline-block py-1" rel="noopener">
              {obvod.senator}
            </a>
          </dd>
        </div>
        <div className="bg-papir p-3">
          <dt className="popisek-uredni">Kandidátů</dt>
          <dd className="mt-1 font-mono text-lg">
            {kandidati.length > 0 ? kandidati.length : '—'}
          </dd>
        </div>
        <div className="bg-papir p-3">
          <dt className="popisek-uredni">Volí se</dt>
          <dd className="mt-1 font-mono text-lg">9.–10. 10. 2026</dd>
        </div>
      </dl>

      <div className="proza max-w-prose">
        <MDXContent code={obvod.content} />
      </div>

      {senatorObhajuje !== null && (
        <p className="max-w-prose border-l-2 border-praha pl-5">
          <span className="popisek-uredni block">Obhajuje stávající senátor?</span>
          {senatorObhajuje
            ? `${obvod.senator} je na kandidátní listině a mandát obhajuje.`
            : `${obvod.senator} mezi zaregistrovanými kandidáty není, mandát tedy neobhajuje.`}{' '}
          Odvozeno z kandidátní listiny ČSÚ, ne z vyjádření dotčené osoby.
        </p>
      )}

      {kandidati.length > 0 && (
        <section>
          <h2 className="text-2xl">Kandidáti</h2>
          <p className="mt-1 max-w-prose text-sm text-seda-uredni">
            Pořadí je podle vylosovaných čísel na hlasovacím lístku. Zvolen je ten, kdo
            v prvním kole získá nadpoloviční většinu; jinak se koná druhé kolo mezi
            dvěma nejúspěšnějšími.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-inkoust">
                  <th className="popisek-uredni py-2 pr-3 text-right">#</th>
                  <th className="popisek-uredni py-2 pr-3">Jméno</th>
                  <th className="popisek-uredni py-2 pr-3 text-right">Věk</th>
                  <th className="popisek-uredni py-2 pr-3">Navrhla</th>
                  <th className="popisek-uredni py-2">Povolání</th>
                </tr>
              </thead>
              <tbody>
                {kandidati.map((k) => (
                  <tr key={k.cislo} className="border-b border-linka align-top">
                    <td className="py-2 pr-3 text-right font-mono">{k.cislo}</td>
                    <td className="py-2 pr-3">{celeJmenoSenat(k)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{k.vek}</td>
                    <td className="py-2 pr-3">{k.volebniStrana || '—'}</td>
                    <td className="py-2">{k.povolani || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="popisek-uredni mt-3">
            Zdroj: otevřená data ČSÚ, sada {sadaSenat()}
          </p>
        </section>
      )}

      <section>
        <h2 className="text-2xl">Které městské části sem patří</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {obvod.mestskeCasti.map((s) => (
            <li key={s}>
              <Link
                href={`/mestska-cast/${s}`}
                className="block border border-inkoust px-3 py-1 font-mono text-sm no-underline hover:bg-papir-tmavsi"
              >
                {nazevMC(s)}
              </Link>
            </li>
          ))}
        </ul>

        {obvod.mestskeCastiCastecne.length > 0 && (
          <div className="mt-6 max-w-prose border-l-2 border-okr pl-4">
            <h3 className="popisek-uredni">Jen částí území</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {obvod.mestskeCastiCastecne.map((c) => (
                <li key={c.slug}>
                  <Link href={`/mestska-cast/${c.slug}`} className="odkaz-akcent">
                    {nazevMC(c.slug)}
                  </Link>{' '}
                  — {c.popis}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <footer className="border-t border-linka pt-6">
        <h2 className="popisek-uredni">Zdroje</h2>
        <ul className="mt-2 text-sm">
          {obvod.zdroje.map((z) => (
            <li key={z.url}>
              <a href={z.url} className="odkaz-akcent inline-block py-1" rel="noopener">
                {z.text}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  )
}
