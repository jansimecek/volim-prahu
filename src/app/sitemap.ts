import type { MetadataRoute } from 'next'
import { programy, stranky, strany } from '#content'
import { kZobrazeni } from '@/lib/aktuality'
import { kandidatka, vsechnyKandidatky } from '@/lib/kandidatky'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { OBVODY } from '@/lib/senat'
import { absolutni } from '@/lib/web'

/**
 * Sitemapa všech veřejných stránek. Profily kandidátů se generují na
 * vyžádání, takže bez sitemapy by je vyhledávač našel jen přes odkazy
 * z kandidátek; tady jsou všechny. Aktuality se berou přes stejnou bránu
 * jako na webu, aby se během moratoria neodkazovalo na stránku, která
 * vrací 404.
 */
export const revalidate = 3600

type Polozka = MetadataRoute.Sitemap[number]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dnes = new Date()
  const staticke: Polozka[] = [
    { url: absolutni('/'), lastModified: dnes, changeFrequency: 'daily', priority: 1 },
    { url: absolutni('/praha'), lastModified: dnes, changeFrequency: 'daily', priority: 0.9 },
    { url: absolutni('/mestska-cast'), lastModified: dnes, changeFrequency: 'weekly', priority: 0.8 },
    { url: absolutni('/senat'), lastModified: dnes, changeFrequency: 'weekly', priority: 0.8 },
    { url: absolutni('/temata'), lastModified: dnes, changeFrequency: 'weekly', priority: 0.8 },
    { url: absolutni('/aktualne'), lastModified: dnes, changeFrequency: 'daily', priority: 0.8 },
    { url: absolutni('/kde-volim'), lastModified: dnes, changeFrequency: 'weekly', priority: 0.9 },
    { url: absolutni('/hlasovani'), lastModified: dnes, changeFrequency: 'weekly', priority: 0.5 },
    { url: absolutni('/rozhovory'), lastModified: dnes, changeFrequency: 'weekly', priority: 0.5 },
    { url: absolutni('/vysledky'), lastModified: dnes, changeFrequency: 'weekly', priority: 0.6 },
  ]

  const referencni: Polozka[] = stranky
    .filter((s) => !['kde-volim'].includes(s.slug))
    .map((s) => ({
      url: absolutni(`/${s.slug}`),
      lastModified: new Date(s.aktualizovano),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  const mestskeCasti: Polozka[] = MESTSKE_CASTI.map((mc) => ({
    url: absolutni(`/mestska-cast/${mc.slug}`),
    lastModified: dnes,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const subjekty: Polozka[] = strany
    .filter((s) => s.uroven === 'magistrat')
    .flatMap((s) => {
      const profil: Polozka = {
        url: absolutni(`/praha/strana/${s.slug}`),
        lastModified: new Date(s.programOvereno),
        changeFrequency: 'weekly',
        priority: 0.7,
      }
      const maProgram = programy.some((p) => p.uroven === 'magistrat' && p.subjekt === s.slug)
      return maProgram
        ? [profil, { ...profil, url: absolutni(`/praha/strana/${s.slug}/program`), priority: 0.7 }]
        : [profil]
    })

  const senat: Polozka[] = OBVODY.map((o) => ({
    url: absolutni(`/senat/${o.slug}`),
    lastModified: dnes,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const aktuality: Polozka[] = (await kZobrazeni()).map((z) => ({
    url: absolutni(`/aktualne/${z.slug}`),
    lastModified: new Date(z.vydano),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const osoby = new Set<string>()
  for (const slug of vsechnyKandidatky()) {
    for (const strana of kandidatka(slug)?.strany ?? []) {
      for (const k of strana.kandidati) osoby.add(k.slug)
    }
  }
  const kandidati: Polozka[] = [...osoby].sort().map((slug) => ({
    url: absolutni(`/kandidat/${slug}`),
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

  return [...staticke, ...referencni, ...mestskeCasti, ...subjekty, ...senat, ...aktuality, ...kandidati]
}
