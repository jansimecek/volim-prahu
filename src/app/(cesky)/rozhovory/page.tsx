import type { Metadata } from 'next'
import Link from 'next/link'
import { Rozhovory } from '@/components/Rozhovory'
import { sPoctem } from '@/lib/cestina'
import { pocetOsobSRozhovorem, vsechnyRozhovory } from '@/lib/rozhovory'

export const metadata: Metadata = {
  title: 'Rozhovory s kandidáty',
  description:
    'Rozhovory s lídry pražských kandidátek v médiích — kdo, kde, kdy a o čem mluvil. Odkazy a anotace, ne přepisy.',
}

export default function StrankaRozhovoru() {
  const rozhovory = vsechnyRozhovory()

  return (
    <div className="space-y-8">
      <header className="max-w-prose">
        <p className="popisek-uredni">Kde kandidáti mluví</p>
        <h1 className="mt-2 text-4xl">Rozhovory s kandidáty</h1>
        <p className="mt-4">
          Rozhovory s lídry pražských kandidátek, které vyšly v médiích. U každého uvádíme,
          kdo, kde a kdy mluvil, a čemu se rozhovor věnoval.
        </p>
        <p className="mt-3">
          <strong>Text rozhovoru tu nenajdete.</strong> Je to práce toho média a patří jemu —
          odkazujeme na něj, nenahrazujeme ho. Anotace je naše a je krátká schválně, aby
          z ní nevznikl opis.
        </p>
      </header>

      {rozhovory.length === 0 ? (
        <p className="max-w-prose border-l-2 border-praha pl-5">
          Zatím tu žádný rozhovor není. Přibudou, jakmile s lídry kandidátek nějaká média
          udělají rozhovor, který se týká pražské samosprávy.
        </p>
      ) : (
        <>
          <p className="popisek-uredni">
            {sPoctem(rozhovory.length, 'rozhovor', 'rozhovory', 'rozhovorů')} ·{' '}
            {sPoctem(pocetOsobSRozhovorem(), 'kandidát', 'kandidáti', 'kandidátů')}
          </p>

          {/* Čtenář musí vědět, že výpis není úplný — jinak si z absence
              vyvodí, že dotyčný nikde nemluvil. */}
          <p className="max-w-prose border-l-2 border-praha pl-5 text-sm">
            <span className="popisek-uredni block">Výpis není úplný</span>
            Sledujeme velká celostátní i pražská média, ale rozhovorů vychází víc, než
            stihneme podchytit. Když o nějakém víte,{' '}
            <Link href="/o-projektu" className="odkaz-akcent">
              napište nám
            </Link>
            . Že tu někdo chybí, neznamená, že nikde nemluvil.
          </p>

          <Rozhovory rozhovory={rozhovory} />
        </>
      )}
    </div>
  )
}
