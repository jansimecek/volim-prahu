import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProudAktualit } from '@/components/ProudAktualit'
import { NA_STRANU, publikovane, stranka } from '@/lib/aktuality'

type Parametry = { params: Promise<{ cislo: string }> }

export function generateStaticParams() {
  const celkem = Math.max(1, Math.ceil(publikovane().length / NA_STRANU))
  // Strana 1 má vlastní adresu /aktualne, tady začínáme od dvojky.
  return Array.from({ length: Math.max(0, celkem - 1) }, (_, i) => ({ cislo: String(i + 2) }))
}

export async function generateMetadata({ params }: Parametry): Promise<Metadata> {
  const { cislo } = await params
  if (!/^[2-9]\d*$/.test(cislo)) return {}
  return {
    title: `Aktuality, strana ${cislo}`,
    description: `Starší aktuality o průběhu pražských voleb 2026, strana ${cislo}.`,
  }
}

export default async function StarsiAktuality({ params }: Parametry) {
  const { cislo } = await params
  // Striktní zápis, ne Number(): ten přijme i „0x2", „2e0", „+2" a „2.0",
  // takže by tatáž strana žila na pěti adresách s různým titulkem.
  if (!/^[2-9]\d*$/.test(cislo)) notFound()
  const pozadovane = Number(cislo)

  const { aktuality, celkem, cislo: aktualni } = await stranka(pozadovane)
  if (aktualni !== pozadovane) notFound()

  return (
    <div className="space-y-8">
      <header className="max-w-prose">
        <p>
          <Link href="/aktualne" className="odkaz-navigace">
            Aktuálně
          </Link>
        </p>
        <h1 className="mt-2 text-4xl">Starší aktuality</h1>
        <p className="popisek-uredni mt-3">
          Strana {aktualni} z {celkem}
        </p>
      </header>

      <ProudAktualit aktuality={aktuality} />

      <nav
        aria-label="Stránkování aktualit"
        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-linka pt-6 text-sm"
      >
        <Link
          href={aktualni === 2 ? '/aktualne' : `/aktualne/strana/${aktualni - 1}`}
          className="odkaz-akcent"
        >
          ← Novější
        </Link>
        {aktualni < celkem && (
          <Link href={`/aktualne/strana/${aktualni + 1}`} className="odkaz-akcent">
            Starší →
          </Link>
        )}
      </nav>
    </div>
  )
}
