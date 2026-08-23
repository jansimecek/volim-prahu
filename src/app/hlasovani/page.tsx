import type { Metadata } from 'next'
import Link from 'next/link'
import { HlasovaciFormular } from '@/components/HlasovaciFormular'
import { hlasovaniOtevrene } from '@/lib/hlasovani'
import { MESTSKE_CASTI, subjekty } from '@/lib/obsah'

export const metadata: Metadata = {
  title: 'Anketa',
  description:
    'Nezávazná anketa čtenářů. Není to průzkum veřejného mínění a výsledky zveřejňujeme až po zavření volebních místností.',
}

// Stav ankety závisí na čase, takže se stránka nesmí zabetonovat do buildu.
export const revalidate = 300

export default function StrankaAnkety() {
  const kandidujici = subjekty('magistrat')
  const otevrene = hlasovaniOtevrene()

  return (
    <div className="space-y-10">
      <header className="max-w-prose">
        <p className="popisek-uredni">Anketa čtenářů</p>
        <h1 className="mt-2 text-4xl">Koho byste volili do zastupitelstva Prahy?</h1>
      </header>

      {/* Disclaimer je první věc na stránce, ne poznámka pod čarou. */}
      <section className="max-w-prose border-l-2 border-praha pl-5">
        <h2 className="font-display text-lg font-semibold">Tohle není průzkum veřejného mínění</h2>
        <p className="mt-2">
          Hlasují tu lidé, kteří na web sami přišli. Není to reprezentativní vzorek, výsledky
          se nijak nevažují a nedá se z nich odvozovat, jak volby dopadnou. Kdokoli vám takové
          číslo ukáže jako předpověď, používá ho špatně.
        </p>
        <p className="mt-3">
          Proto <strong>před volbami nezveřejňujeme vůbec nic</strong> — ani průběžné počty,
          ani kolik lidí už hlasovalo. Souhrn vydáme až po zavření volebních místností
          v sobotu 10. října ve 14:00, aby anketa nemohla nikoho ovlivnit. Smyslem je
          porovnat si potom očekávání čtenářů se skutečným výsledkem.
        </p>
      </section>

      <section className="max-w-prose">
        <h2 className="text-2xl">Co se o vás uloží</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Koho jste vybral, vaši městskou část a věkovou kategorii.</li>
          <li>
            <strong>Neukládáme</strong> IP adresu, prohlížeč ani nic, čím by šlo hlas
            přiřadit ke konkrétnímu člověku.
          </li>
          <li>
            E-mail je nepovinný, ukládá se do oddělené tabulky bez vazby na hlas a použije
            se jen na jednu pozvánku k povolebnímu hodnocení.
          </li>
          <li>
            Opakovanému hlasování brání jen značka ve vašem prohlížeči. Je to slabá
            ochrana a víme o tom — silnější by znamenala sledovat lidi, což dělat nechceme.
          </li>
        </ul>
        <p className="mt-3 text-sm">
          Podrobnosti v <Link href="/ochrana-udaju" className="odkaz-akcent">zásadách ochrany osobních údajů</Link>.
        </p>
      </section>

      {!otevrene ? (
        <p className="border border-inkoust px-4 py-3">
          Anketa je uzavřená. Výsledky najdete na stránce{' '}
          <Link href="/hlasovani/vysledky" className="odkaz-akcent">
            výsledky ankety
          </Link>
          .
        </p>
      ) : kandidujici.length === 0 ? (
        <section className="max-w-prose border border-okr px-4 py-4 text-okr">
          <h2 className="font-display font-semibold">Anketa se otevře s kandidátkami</h2>
          <p className="mt-2">
            Český statistický úřad zatím kandidátní listiny pro rok 2026 nezveřejnil, takže
            není z čeho vybírat. Jakmile je vydá, objeví se tady výběr ze skutečných
            kandidujících subjektů — vymýšlet si ho dopředu nebudeme.
          </p>
        </section>
      ) : (
        <HlasovaciFormular subjekty={kandidujici} mestskeCasti={MESTSKE_CASTI} />
      )}
    </div>
  )
}
