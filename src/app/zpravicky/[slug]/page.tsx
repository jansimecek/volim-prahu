import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Drobecky } from '@/components/Drobecky'
import { Zpravicka } from '@/components/Zpravicka'
import { kZobrazeni, publikovane, zpravickaPodleSlugu } from '@/lib/zpravicky'

type Parametry = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return publikovane().map((z) => ({ slug: z.slug }))
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { slug } = await params
  const z = await zpravickaPodleSlugu(slug)
  if (!z) return {}
  return {
    title: z.nadpis,
    description: z.shrnuti,
    openGraph: { type: 'article', publishedTime: z.vydano },
  }
}

export default async function StrankaZpravicky({ params }: Parametry) {
  const { slug } = await params
  const zpravicka = await zpravickaPodleSlugu(slug)
  if (!zpravicka) notFound()

  const vse = await kZobrazeni()
  const poradi = vse.findIndex((z) => z.slug === slug)
  const novejsi = poradi > 0 ? vse[poradi - 1] : null
  const starsi = poradi >= 0 && poradi < vse.length - 1 ? vse[poradi + 1] : null

  return (
    <div className="space-y-8">
      <Drobecky cesta={[{ popisek: 'Úvod', href: '/' }, { popisek: 'Zprávičky', href: '/zpravicky' }, { popisek: zpravicka.nadpis }]} />

      <Zpravicka zpravicka={zpravicka} plne urovenNadpisu={1} />

      <nav
        aria-label="Sousední zprávičky"
        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-sm"
      >
        {novejsi ? (
          <Link href={`/zpravicky/${novejsi.slug}`} className="odkaz-akcent">
            ← {novejsi.nadpis}
          </Link>
        ) : (
          <span />
        )}
        {starsi && (
          <Link href={`/zpravicky/${starsi.slug}`} className="odkaz-akcent text-right">
            {starsi.nadpis} →
          </Link>
        )}
      </nav>

      <p className="border-t border-linka pt-6 text-sm">
        <Link href="/zpravicky" className="odkaz-akcent">
          Všechny zprávičky
        </Link>
      </p>
    </div>
  )
}
