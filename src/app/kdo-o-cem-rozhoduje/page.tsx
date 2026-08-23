import type { Metadata } from 'next'
import { kompetence } from '#content'
import { KompetencniMatice } from '@/components/KompetencniMatice'
import { MDXContent } from '@/components/mdx'
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

      <div className="proza max-w-prose">
        <MDXContent code={stranka.content} />
      </div>

      <KompetencniMatice />

      <footer className="border-t border-linka pt-6">
        <p className="popisek-uredni">
          {kompetence.agendy.length} agend · aktualizováno {stranka.aktualizovano} · odkazy vedou
          na úplné znění předpisu
        </p>
      </footer>
    </article>
  )
}
