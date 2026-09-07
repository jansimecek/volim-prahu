import type { Metadata } from 'next'
import { UredniDesky } from '@/components/UredniDesky'
import { VyhledavacOkrsku } from '@/components/VyhledavacOkrsku'
import { Obsah } from '@/components/Obsah'
import { MDXContent } from '@/components/mdx'
import { nadpisyStranky } from '@/lib/nadpisy'
import { datumCesky } from '@/lib/cestina'
import { strankaPodleSlugu } from '@/lib/obsah'

const stranka = strankaPodleSlugu('kde-volim')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

export default function Stranka() {
  return (
    <article className="space-y-8">
      <header className="max-w-prose">
        <h1 className="text-4xl">{stranka.title}</h1>
        <p className="mt-3 text-lg text-seda-uredni">{stranka.popis}</p>
      </header>
      <Obsah polozky={nadpisyStranky(stranka.surovy)} />

      <section className="border-t border-inkoust pt-8" aria-labelledby="vyhledavac-okrsku">
        <h2 id="vyhledavac-okrsku" className="text-2xl">
          Najděte svůj volební okrsek
        </h2>
        <p className="mt-2 max-w-prose">
          Zadejte adresu trvalého pobytu. Číslo okrsku bereme z registru adres ČÚZK, který
          městské části průběžně aktualizují; adresu volební místnosti doplňujeme z oznámení
          na úředních deskách, jakmile vyjdou.
        </p>
        <div className="mt-5">
          <VyhledavacOkrsku />
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
