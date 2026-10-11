import type { Metadata } from 'next'
import Link from 'next/link'
import { VysledekZastupitelstva } from '@/components/VysledekZastupitelstva'
import { KONECNE_VYSLEDKY, stranySMandaty } from '@/lib/konecneVysledky'
import { formatujCasCSU, KOD_MAGISTRATU } from '@/lib/vysledky'

export const metadata: Metadata = {
  title: 'Výsledky',
  description:
    'Konečné výsledky voleb do Zastupitelstva hlavního města Prahy a zastupitelstev 57 městských částí 2026: mandáty, zvolení zastupitelé, účast.',
}

const procenta = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Konečné výsledky čte stránka z repozitáře (`pnpm import:vysledky`), ne ze
 * snapshotu volební noci — po sečtení se už nemění.
 */
export default function StrankaVysledku() {
  const vysledky = KONECNE_VYSLEDKY
  const magistrat = vysledky.zastupitelstva.find((z) => z.kod === KOD_MAGISTRATU)
  const casti = vysledky.zastupitelstva
    .filter((z) => z.kod !== KOD_MAGISTRATU)
    .sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs', { numeric: true }))

  return (
    <div className="space-y-12">
      <header className="max-w-prose">
        <p className="popisek-uredni">Volby 9.–10. října 2026 · sečteno</p>
        <h1 className="mt-2 text-4xl">Výsledky</h1>
        <p className="mt-4">
          Konečné výsledky všech 58 pražských zastupitelstev. Kdo s kým o vedení města a městských
          částí jedná, sledujeme na stránce{' '}
          <Link href="/koalice" className="odkaz-akcent">
            Vyjednávání a koalice
          </Link>
          .
        </p>
      </header>

      {magistrat && (
        <section id="magistrat" className="space-y-4">
          <h2 className="text-3xl">Zastupitelstvo hlavního města Prahy</h2>
          <VysledekZastupitelstva z={magistrat} odkazyStran />
        </section>
      )}

      <section id="mestske-casti">
        <h2 className="text-3xl">Městské části</h2>
        <p className="popisek-uredni mt-1">
          Rozdělení mandátů · podrobné výsledky a zvolení zastupitelé na stránce městské části
        </p>
        <ul className="mt-5 grid gap-px border border-inkoust bg-linka-silna sm:grid-cols-2 lg:grid-cols-3">
          {casti.map((z) => (
            <li key={z.kod} className="bg-papir p-3">
              <Link href={`/mestska-cast/${z.slug}#vysledky`} className="no-underline">
                <span className="font-display font-medium">{z.nazev}</span>
              </Link>
              <span className="popisek-uredni mt-1 block">
                účast {procenta.format(z.ucastProcenta)} % · {z.mandatuCelkem} mandátů
              </span>
              <ul className="mt-2 space-y-0.5 text-sm">
                {stranySMandaty(z).map((s) => (
                  <li key={s.cislo} className="flex justify-between gap-3">
                    <span>{s.nazev}</span>
                    <span className="font-mono">{s.mandaty}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <p className="popisek-uredni">
        Zdroj: Český statistický úřad, data prezentační aplikace{' '}
        <a href="https://www.volbyhned.cz/app/kv2026/cs/20261009/home" className="underline">
          volbyhned.cz
        </a>
        , vygenerováno {formatujCasCSU(vysledky.generovano)}. Údaje nijak neupravujeme. Závazné
        jsou výsledky vyhlášené Státní volební komisí.
      </p>
    </div>
  )
}
