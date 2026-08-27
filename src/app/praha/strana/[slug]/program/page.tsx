import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { programy, strany } from '#content'
import { RazitkoHodnoceni } from '@/components/RazitkoHodnoceni'
import { stranaPodleKodu } from '@/lib/kandidatky'
import { MDXContent } from '@/components/mdx'
import type { HodnoceniSlibu } from '@/lib/typy'

type Parametry = { params: Promise<{ slug: string }> }

const magistratni = () => strany.filter((s) => s.uroven === 'magistrat')

export function generateStaticParams() {
  return programy
    .filter((p) => p.uroven === 'magistrat')
    .map((p) => ({ slug: p.subjekt }))
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { slug } = await params
  const strana = magistratni().find((s) => s.slug === slug)
  if (!strana) return {}
  const nazev = stranaPodleKodu('magistrat', strana.kodStrany)?.nazev ?? strana.zkratka
  return {
    title: `Program — ${nazev}`,
    description: `Sliby ${nazev} pro Prahu 2026 a hodnocení jejich proveditelnosti proti kompetenčnímu a rozpočtovému rámci.`,
  }
}

export default async function StrankaProgramu({ params }: Parametry) {
  const { slug } = await params
  const strana = magistratni().find((s) => s.slug === slug)
  const program = programy.find((p) => p.subjekt === slug && p.uroven === 'magistrat')
  if (!strana || !program) notFound()

  const hodnocene = program.body.filter((b) => b.hodnoceni)
  const nehodnocene = program.body.filter((b) => !b.hodnoceni)

  return (
    <div className="space-y-10">
      <header>
        <p className="popisek-uredni">
          <Link href={`/praha/strana/${strana.slug}`} className="no-underline">
            {strana.zkratka}
          </Link>
        </p>
        <h1 className="mt-2 text-4xl">Program a jeho proveditelnost</h1>
      </header>

      <div className="proza max-w-prose">
        <MDXContent code={program.content} />
      </div>

      {program.program_nedohledan && (
        <p className="max-w-prose border border-okr px-4 py-3 text-okr">
          {program.program_nedohledan}
        </p>
      )}

      <p className="max-w-prose border-l-2 border-praha pl-5 text-sm">
        <span className="popisek-uredni block">Co tahle stránka není</span>
        Není to hodnocení subjektu ani doporučení, koho volit. Posuzujeme jen
        proveditelnost jednotlivých slibů proti tomu, o čem daná úroveň samosprávy
        rozhoduje a kolik má peněz. O pravdivosti ani o tom, jestli jde o dobrý nápad,
        neříkáme nic.
      </p>

      {hodnocene.map((bod) => (
        <RazitkoHodnoceni
          key={bod.id}
          hodnoceni={bod.hodnoceni as HodnoceniSlibu}
          slib={bod.slib}
          citaceZdroje={bod.citace_zdroje}
        />
      ))}

      {nehodnocene.length > 0 && (
        <section className="max-w-prose border-t border-linka pt-6">
          <h2 className="text-2xl">Zatím nehodnocené sliby</h2>
          <p className="mt-2 text-sm text-seda-uredni">
            Tyhle body z programu máme zaznamenané, ale hodnocení proveditelnosti u nich
            zatím nezveřejňujeme. Raději žádné než nepodložené.
          </p>
          <ul className="mt-4 space-y-2">
            {nehodnocene.map((bod) => (
              <li key={bod.id} className="border-l-2 border-linka pl-4">
                {bod.slib}
              </li>
            ))}
          </ul>
        </section>
      )}

      {program.zdroj_programu && (
        <p className="popisek-uredni">
          Zdroj programu:{' '}
          <a href={program.zdroj_programu} className="underline" rel="noopener nofollow">
            {program.zdroj_programu}
          </a>
        </p>
      )}
    </div>
  )
}
