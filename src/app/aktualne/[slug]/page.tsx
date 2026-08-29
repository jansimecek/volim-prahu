import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Drobecky } from '@/components/Drobecky'
import { Aktualita } from '@/components/Aktualita'
import { kZobrazeni, publikovane, aktualitaPodleSlugu } from '@/lib/aktuality'

type Parametry = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return publikovane().map((z) => ({ slug: z.slug }))
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { slug } = await params
  const z = await aktualitaPodleSlugu(slug)
  if (!z) return {}
  return {
    title: z.nadpis,
    description: z.shrnuti,
    openGraph: { type: 'article', publishedTime: z.vydano },
  }
}

export default async function StrankaAktuality({ params }: Parametry) {
  const { slug } = await params
  const aktualita = await aktualitaPodleSlugu(slug)
  if (!aktualita) notFound()

  const vse = await kZobrazeni()
  const poradi = vse.findIndex((z) => z.slug === slug)
  const novejsi = poradi > 0 ? vse[poradi - 1] : null
  const starsi = poradi >= 0 && poradi < vse.length - 1 ? vse[poradi + 1] : null

  return (
    <div className="space-y-8">
      <Drobecky cesta={[{ popisek: 'Úvod', href: '/' }, { popisek: 'Aktuálně', href: '/aktualne' }, { popisek: aktualita.nadpis }]} />

      <Aktualita aktualita={aktualita} plne urovenNadpisu={1} />

      <nav
        aria-label="Sousední aktuality"
        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-sm"
      >
        {novejsi ? (
          <Link href={`/aktualne/${novejsi.slug}`} className="odkaz-akcent">
            ← {novejsi.nadpis}
          </Link>
        ) : (
          <span />
        )}
        {starsi && (
          <Link href={`/aktualne/${starsi.slug}`} className="odkaz-akcent text-right">
            {starsi.nadpis} →
          </Link>
        )}
      </nav>

      <p className="border-t border-linka pt-6 text-sm">
        <Link href="/aktualne" className="odkaz-akcent">
          Všechny aktuality
        </Link>
      </p>
    </div>
  )
}
