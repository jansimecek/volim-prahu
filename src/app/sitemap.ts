import type { MetadataRoute } from 'next'
import { programy, stranky, strany } from '#content'
import { jeSPruzkumem, publikovane } from '@/lib/aktuality'
import { kandidatka, vsechnyKandidatky } from '@/lib/kandidatky'
import { JAZYKY, PODSTRANKY } from '@/lib/jazyky'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { OBVODY } from '@/lib/senat'
import { naposledyOvereno, vyjednavaniZastupitelstva } from '@/lib/vyjednavani'
import { absolutni } from '@/lib/web'

/**
 * Sitemapa všech veřejných stránek. Profily kandidátů se generují na
 * vyžádání, takže bez sitemapy by je vyhledávač našel jen přes odkazy
 * z kandidátek; tady jsou všechny.
 *
 * Generuje se při buildu a je deterministická — žádné `new Date()`, aby
 * se megabajtový soubor nezapisoval do ISR cache znovu při každé
 * regeneraci (Vercel účtuje zápis jen při změně obsahu). Aktuality
 * s průzkumem tu nejsou vůbec: během moratoria vracejí 404 a sitemapa
 * by na ně nesměla odkazovat; z rubriky jsou dostupné tak jako tak.
 */
type Polozka = MetadataRoute.Sitemap[number]

export default function sitemap(): MetadataRoute.Sitemap {
  // Datum z obsahu, ne z hodin — sitemapa zůstává deterministická.
  const vyjednavaniZmeneno = naposledyOvereno()
  const zmeneno = vyjednavaniZmeneno ? { lastModified: new Date(vyjednavaniZmeneno) } : {}

  // Po volbách vedou výsledky a vyjednávání; předvolební průvodce je archiv kampaně.
  const staticke: Polozka[] = [
    { url: absolutni('/'), ...zmeneno, changeFrequency: 'daily', priority: 1 },
    { url: absolutni('/koalice'), ...zmeneno, changeFrequency: 'daily', priority: 1 },
    { url: absolutni('/vysledky'), lastModified: new Date('2026-10-11'), changeFrequency: 'monthly', priority: 0.9 },
    { url: absolutni('/aktualne'), changeFrequency: 'daily', priority: 0.8 },
    { url: absolutni('/mestska-cast'), changeFrequency: 'weekly', priority: 0.8 },
    { url: absolutni('/praha'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absolutni('/senat'), changeFrequency: 'weekly', priority: 0.7 },
    { url: absolutni('/temata'), changeFrequency: 'monthly', priority: 0.6 },
    { url: absolutni('/kde-volim'), changeFrequency: 'monthly', priority: 0.4 },
    { url: absolutni('/hlasovani'), changeFrequency: 'monthly', priority: 0.3 },
    { url: absolutni('/rozhovory'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absolutni('/debaty'), changeFrequency: 'monthly', priority: 0.4 },
  ]

  /**
   * Cizojazyčná sekce. Pro voliče z EU s pobytem v Praze je to jediná
   * stránka na celém webu, která mu odpoví na otázku, jestli vůbec smí —
   * takže musí být v sitemapě, ne jen za přepínačem v hlavičce. Priorita
   * odpovídá /kde-volim: je to táž informace pro jinou skupinu čtenářů.
   */
  const cizojazycne: Polozka[] = JAZYKY.flatMap((jazyk) => [
    { url: absolutni(`/${jazyk}`), changeFrequency: 'weekly' as const, priority: 0.9 },
    ...PODSTRANKY.map((s) => ({
      url: absolutni(`/${jazyk}/${s}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ])

  const referencni: Polozka[] = stranky
    .filter((s) => !['kde-volim', 'koalice'].includes(s.slug))
    .map((s) => ({
      url: absolutni(`/${s.slug}`),
      lastModified: new Date(s.aktualizovano),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  const mestskeCasti: Polozka[] = MESTSKE_CASTI.map((mc) => {
    const overeno = vyjednavaniZastupitelstva(mc.slug)?.overeno
    return {
      url: absolutni(`/mestska-cast/${mc.slug}`),
      ...(overeno ? { lastModified: new Date(overeno) } : {}),
      changeFrequency: 'weekly',
      priority: 0.8,
    }
  })

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
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const aktuality: Polozka[] = publikovane()
    .filter((z) => !jeSPruzkumem(z))
    .map((z) => ({
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

  return [...staticke, ...cizojazycne, ...referencni, ...mestskeCasti, ...subjekty, ...senat, ...aktuality, ...kandidati]
}
