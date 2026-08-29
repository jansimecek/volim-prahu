import type { Metadata } from 'next'
import { kompetence } from '#content'
import { KompetencniMatice } from '@/components/KompetencniMatice'
import { Obsah } from '@/components/Obsah'
import { MDXContent } from '@/components/mdx'
import { nadpisyStranky } from '@/lib/nadpisy'
import { datumCesky } from '@/lib/cestina'
import { strankaPodleSlugu } from '@/lib/obsah'

const stranka = strankaPodleSlugu('kdo-o-cem-rozhoduje')

export const metadata: Metadata = { title: stranka.title, description: stranka.popis }

export default function StrankaKompetenci() {
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

      <KompetencniMatice />

      <footer className="border-t border-linka pt-6">
        <p className="popisek-uredni">
          {kompetence.agendy.length} agend · aktualizováno {datumCesky(stranka.aktualizovano)} · odkazy vedou
          na úplné znění předpisu
        </p>
      </footer>
    </article>
  )
}
