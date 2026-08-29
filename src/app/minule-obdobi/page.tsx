import type { Metadata } from 'next'
import { PlneniProhlaseni } from '@/components/PlneniProhlaseni'
import { Obsah } from '@/components/Obsah'
import { MDXContent } from '@/components/mdx'
import { nadpisyStranky } from '@/lib/nadpisy'
import { datumCesky } from '@/lib/cestina'
import { strankaPodleSlugu } from '@/lib/obsah'

const stranka = strankaPodleSlugu('minule-obdobi')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

export default function StrankaMinulehoObdobi() {
  return (
    <article className="space-y-10">
      <header className="max-w-prose">
        <p className="popisek-uredni">Referenční přehled</p>
        <h1 className="mt-2 text-4xl">{stranka.title}</h1>
      </header>

      <Obsah polozky={nadpisyStranky(stranka.surovy)} />

      <div className="proza max-w-prose">
        <MDXContent code={stranka.content} />
      </div>

      <PlneniProhlaseni />

      <footer className="border-t border-linka pt-6">
        <p className="popisek-uredni">Aktualizováno {datumCesky(stranka.aktualizovano)}</p>
      </footer>
    </article>
  )
}
