import type { Metadata } from 'next'
import { rozpocet } from '#content'
import { RozpoctovyRamec } from '@/components/RozpoctovyRamec'
import { Obsah } from '@/components/Obsah'
import { MDXContent } from '@/components/mdx'
import { nadpisyStranky } from '@/lib/nadpisy'
import { datumCesky } from '@/lib/cestina'
import { strankaPodleSlugu } from '@/lib/obsah'

const stranka = strankaPodleSlugu('rozpoctovy-ramec')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

export default function StrankaRozpoctu() {
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

      <p className="max-w-prose border-l-2 border-praha pl-5">{rozpocet.uvodniVarovani}</p>

      <RozpoctovyRamec />

      <footer className="border-t border-linka pt-6">
        <p className="popisek-uredni">
          {rozpocet.polozky.length} údajů · aktualizováno {datumCesky(stranka.aktualizovano)}
        </p>
      </footer>
    </article>
  )
}
