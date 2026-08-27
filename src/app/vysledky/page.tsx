import type { Metadata } from 'next'
import Link from 'next/link'
import { VysledkyPrehled } from '@/components/VysledkyPrehled'
import { nactiSnapshot } from '@/lib/snapshot'
import { KONEC_VOLEB } from '@/lib/hlasovani'

export const metadata: Metadata = {
  title: 'Výsledky',
  description:
    'Průběžné výsledky voleb do Zastupitelstva hlavního města Prahy a zastupitelstev městských částí 2026 z otevřených dat ČSÚ.',
}

/**
 * Stránka čte výhradně uložený snapshot. Nikdy nefetchuje ČSÚ z požadavku
 * uživatele — ve volební noc by to znamenalo tisíce požadavků na jejich server.
 */
export const revalidate = 30

export default async function StrankaVysledku() {
  // Chybu úložiště schválně NEODCHYTÁVÁME — Next pak podrží poslední úspěšně
  // vyrenderovanou stránku místo aby zacachoval „zatím nemáme data“.
  const snapshot = await nactiSnapshot()
  const scitaniZacalo = new Date() >= KONEC_VOLEB

  return (
    <div className="space-y-8">
      <header className="max-w-prose">
        <p className="popisek-uredni">Volby 9.–10. října 2026</p>
        <h1 className="mt-2 text-4xl">Výsledky</h1>
      </header>

      {snapshot ? (
        <VysledkyPrehled snapshot={snapshot} />
      ) : (
        <section className="max-w-prose space-y-4">
          <p className="border-l-2 border-linka pl-5">
            {scitaniZacalo
              ? 'Sčítání už probíhá, ale výsledky se nám právě nedaří načíst. Zkuste to za chvíli znovu — do té doby jsou spolehlivým zdrojem oficiální stránky ČSÚ.'
              : 'Zatím nemáme žádná data. Sčítání začíná po uzavření volebních místností v sobotu 10. října ve 14:00 a výsledky se tady začnou objevovat průběžně.'}
          </p>
          <p>
            Do té doby si můžete projít{' '}
            <Link href="/praha" className="odkaz-akcent">
              kandidující subjekty
            </Link>{' '}
            nebo{' '}
            <Link href="/kde-volim" className="odkaz-akcent">
              zjistit, kde se u vás volí
            </Link>
            .
          </p>
          <p className="text-sm text-seda-uredni">
            Oficiální průběžné výsledky zveřejňuje Český statistický úřad na{' '}
            <a href="https://www.volby.cz" className="odkaz-akcent" rel="noopener">
              volby.cz
            </a>
            .
          </p>
        </section>
      )}
    </div>
  )
}
