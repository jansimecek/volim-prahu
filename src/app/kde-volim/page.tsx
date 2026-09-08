import type { Metadata } from 'next'
import { UredniDesky } from '@/components/UredniDesky'
import { VyhledavacOkrsku } from '@/components/VyhledavacOkrsku'
import { PridatDoKalendare } from '@/components/PridatDoKalendare'
import { Obsah } from '@/components/Obsah'
import { MDXContent } from '@/components/mdx'
import { nadpisyStranky } from '@/lib/nadpisy'
import { datumCesky } from '@/lib/cestina'
import { cislo, strankaPodleSlugu } from '@/lib/obsah'
import { pokrytiMistnosti } from '@/lib/mistnosti'
import { prehledOkrsku } from '@/lib/okrsky'

const stranka = strankaPodleSlugu('kde-volim')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

/** Sekce mimo MDX musí být v obsahu stránky také — jinak by nešly přeskočit. */
const SEKCE_STRANKY = [
  { id: 'najdete-svuj-okrsek', text: 'Najděte svůj okrsek' },
  { id: 'kdy-se-voli', text: 'Kdy se volí' },
]

export default function Stranka() {
  const pokryti = pokrytiMistnosti(prehledOkrsku()?.okrsky ?? [])
  return (
    <article className="space-y-10">
      <header className="max-w-prose">
        <h1 className="text-4xl">{stranka.title}</h1>
        <p className="mt-3 text-lg text-seda-uredni">{stranka.popis}</p>
      </header>

      <section aria-labelledby="najdete-svuj-okrsek" className="border border-inkoust bg-papir p-5 sm:p-8">
        <h2 id="najdete-svuj-okrsek" className="text-2xl">
          Najděte svůj volební okrsek a místnost
        </h2>
        <p className="mt-2 max-w-prose">
          Zadejte adresu trvalého pobytu. Číslo okrsku bereme z registru adres ČÚZK, který
          městské části průběžně aktualizují; adresu volební místnosti z dokumentů na úředních
          deskách. Adresa zůstává ve vašem prohlížeči.
        </p>
        <div className="mt-6">
          <VyhledavacOkrsku />
        </div>
        <p className="popisek-uredni mt-6">
          Adresu místnosti známe pro {cislo(pokryti.okrskuSMistnosti)} z {cislo(pokryti.okrskuCelkem)} okrsků
          {pokryti.okrskuPodle2026 > 0 && <>, z toho {cislo(pokryti.okrskuPodle2026)} podle dokumentů k volbám 2026</>}
          {' · '}
          oficiální nástroj:{' '}
          <a href="https://kudykvolbam.iprpraha.cz" className="odkaz-akcent" rel="noopener">
            Kudy k volbám (IPR Praha)
          </a>
        </p>
      </section>

      <Obsah polozky={[...SEKCE_STRANKY, ...nadpisyStranky(stranka.surovy)]} />

      <section aria-labelledby="kdy-se-voli" className="max-w-prose">
        <h2 id="kdy-se-voli" className="text-2xl">
          Kdy se volí
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt className="popisek-uredni">Pátek 9. října 2026</dt>
          <dd className="font-mono">14:00 – 22:00</dd>
          <dt className="popisek-uredni">Sobota 10. října 2026</dt>
          <dd className="font-mono">8:00 – 14:00</dd>
        </dl>
        <p className="mt-4">
          Volí se do zastupitelstev městských částí a Zastupitelstva hlavního města Prahy,
          ve třech senátních obvodech i do Senátu. Případné druhé kolo senátních voleb
          připadá na 16. a 17. října 2026.
        </p>
      </section>

      <Obsah polozky={[...SEKCE_STRANKY, ...nadpisyStranky(stranka.surovy)]} />

      <section aria-labelledby="kdy-se-voli" className="max-w-prose">
        <h2 id="kdy-se-voli" className="text-2xl">
          Kdy se volí
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt className="popisek-uredni">Pátek 9. října 2026</dt>
          <dd className="font-mono">14:00 – 22:00</dd>
          <dt className="popisek-uredni">Sobota 10. října 2026</dt>
          <dd className="font-mono">8:00 – 14:00</dd>
        </dl>
        <p className="mt-4">
          Volí se do zastupitelstev městských částí a Zastupitelstva hlavního města Prahy,
          ve třech senátních obvodech i do Senátu. Případné druhé kolo senátních voleb
          připadá na 16. a 17. října 2026.
        </p>
        <div className="mt-5">
          <PridatDoKalendare />
        </div>
      </section>

      <div className="proza max-w-prose">
        <MDXContent code={stranka.content} />
      </div>

      <section className="border-t border-inkoust pt-8">
        <h2 className="text-2xl">Oznámení z 57 úředních desek</h2>
        <div className="mt-5">
          <UredniDesky />
        </div>
      </section>

      <p className="popisek-uredni">Aktualizováno {datumCesky(stranka.aktualizovano)}</p>
    </article>
  )
}
