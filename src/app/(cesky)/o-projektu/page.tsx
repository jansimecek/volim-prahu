import type { Metadata } from 'next'
import { Obsah } from '@/components/Obsah'
import { MDXContent } from '@/components/mdx'
import { nadpisyStranky } from '@/lib/nadpisy'
import { datumCesky } from '@/lib/cestina'
import { strankaPodleSlugu } from '@/lib/obsah'

const stranka = strankaPodleSlugu('o-projektu')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

export default function Stranka() {
  return (
    <article className="space-y-8">
      <header className="max-w-prose">
        <h1 className="text-4xl">{stranka.title}</h1>
        <p className="mt-3 text-lg text-seda-uredni">{stranka.popis}</p>
      </header>
      <Obsah polozky={nadpisyStranky(stranka.surovy)} />

      <div className="proza max-w-prose">
        <MDXContent code={stranka.content} />
      </div>
      <p className="popisek-uredni">Aktualizováno {datumCesky(stranka.aktualizovano)}</p>
    </article>
  )
}
