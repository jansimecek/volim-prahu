import type { Metadata } from 'next'
import { UredniDesky } from '@/components/UredniDesky'
import { MDXContent } from '@/components/mdx'
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
      <div className="proza max-w-prose">
        <MDXContent code={stranka.content} />
      </div>

      <section className="border-t border-inkoust pt-8">
        <h2 className="text-2xl">Oznámení z 57 úředních desek</h2>
        <div className="mt-5">
          <UredniDesky />
        </div>
      </section>

      <p className="popisek-uredni">Aktualizováno {stranka.aktualizovano}</p>
    </article>
  )
}
