import Link from 'next/link'
import { hlasovaniOtevrene } from '@/lib/hlasovani'
import { ulozisteNastaveno } from '@/lib/uloziste'

/**
 * Výzva k anketě na titulní straně. Ukazuje se jen dokud anketa běží
 * a má kam ukládat — jinak by čtenář klikl na formulář, který selže.
 * Pravidlo „před volbami žádné agregáty" tu platí stejně: výzva nikdy
 * neříká, kolik lidí už hlasovalo.
 */
export function VyzvaAnketa() {
  if (!hlasovaniOtevrene() || !ulozisteNastaveno()) return null

  return (
    <section aria-labelledby="anketa" className="border-2 border-praha bg-papir p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="max-w-prose">
          <p className="popisek-uredni">Anketa čtenářů · běží do soboty 10. října 14:00</p>
          <h2 id="anketa" className="mt-1 text-2xl">
            Koho byste volili do zastupitelstva Prahy?
          </h2>
          <p className="mt-2 text-sm">
            Anonymní, bez registrace, minuta času. Není to průzkum: výsledky zveřejníme až po
            zavření volebních místností, aby anketa nemohla nikoho ovlivnit.
          </p>
        </div>
        <Link
          href="/hlasovani"
          className="inline-block border border-praha bg-praha px-5 py-2.5 font-display text-base font-semibold text-papir no-underline"
        >
          Hlasovat v anketě
        </Link>
      </div>
    </section>
  )
}
