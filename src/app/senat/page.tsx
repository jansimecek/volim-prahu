import type { Metadata } from 'next'
import Link from 'next/link'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { OBVODY, pocetDotcenychMC, senatniStavMestskeCasti } from '@/lib/senat'

export const metadata: Metadata = {
  title: 'Senátní volby v Praze',
  description:
    'V Praze se v roce 2026 volí jen ve třech z deseti senátních obvodů. Přehled, kdo senátní lístek dostane a kdo ne.',
}

export default function StrankaSenatu() {
  const nevoli = MESTSKE_CASTI.filter(
    (mc) => senatniStavMestskeCasti(mc.slug).stav === 'nevoli',
  )

  return (
    <div className="space-y-10">
      <header className="max-w-prose">
        <p className="popisek-uredni">Souběžné volby</p>
        <h1 className="mt-2 text-4xl">Senátní volby v Praze</h1>
        <p className="mt-4">
          Senát se obměňuje po třetinách, takže se nikdy nevolí všude. Praha je
          rozdělená do deseti senátních obvodů a v roce 2026 se volí jen ve třech
          z nich. Většina Pražanů proto senátní lístek vůbec nedostane.
        </p>
      </header>

      {/* Nejužitečnější informace na stránce dřív než výčet obvodů. */}
      <section className="max-w-prose border-l-2 border-praha pl-5">
        <h2 className="font-display text-lg font-semibold">Kdo letos senátora nevolí</h2>
        <p className="mt-2">
          Senátní lístek se letos vydává jen v {pocetDotcenychMC()} z{' '}
          {MESTSKE_CASTI.length} městských částí, a u dvou z nich pouze na části území.
          Ve zbylých {nevoli.length} se senátor nevolí — jejich obvody přijdou na řadu
          až v dalších letech. Patří mezi ně i celá Praha 4, Praha 8, Praha 10, Praha 11
          nebo Praha 12.
        </p>
        <p className="mt-3">
          Pokud vaše městská část v seznamu níže není, dostanete ve volební místnosti
          jen lístky pro zastupitelstvo města a městské části.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Tři obvody, kde se letos volí</h2>
        <ul className="mt-5 grid gap-px border border-inkoust bg-linka sm:grid-cols-3">
          {OBVODY.map((obvod) => (
            <li key={obvod.slug} className="bg-papir">
              <Link
                href={`/senat/${obvod.slug}`}
                className="block h-full p-4 no-underline hover:bg-papir-tmavsi"
              >
                <span className="popisek-uredni">Obvod č. {obvod.cislo}</span>
                <span className="mt-1 block font-display text-xl font-semibold">
                  {obvod.nazev}
                </span>
                <span className="mt-2 block text-sm">
                  {obvod.mestskeCasti.length}{' '}
                  {obvod.mestskeCasti.length === 1 ? 'městská část' : 'městských částí'}
                  {obvod.mestskeCastiCastecne.length > 0 &&
                    ` + části dalších ${obvod.mestskeCastiCastecne.length}`}
                </span>
                <span className="popisek-uredni mt-2 block">
                  senátor {obvod.senator}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-prose text-sm text-seda-uredni">
          Uvedení senátoři jsou ti stávající, kterým mandát těmito volbami končí.
          Jestli ho obhajují, poznáte na stránce obvodu — odvozujeme to z kandidátní
          listiny ČSÚ, ne z jejich vyjádření.
        </p>
      </section>

      <section className="max-w-prose">
        <h2 className="text-2xl">Kdy se volí</h2>
        <p className="mt-3">
          První kolo probíhá souběžně s komunálními volbami v pátek 9. a v sobotu
          10. října 2026. Pokud nikdo nezíská nadpoloviční většinu, koná se druhé kolo
          o týden později, 16. a 17. října. Do druhého kola se hlasuje jen o dvou
          nejúspěšnějších kandidátech a komunální lístky se už neodevzdávají.
        </p>
        <p className="mt-4">
          <Link href="/kde-volim" className="odkaz-akcent">
            Kde a jak volím
          </Link>
        </p>
      </section>
    </div>
  )
}
