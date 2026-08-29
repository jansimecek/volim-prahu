import { kZobrazeni } from '@/lib/aktuality'

/**
 * RSS kanál aktualit.
 *
 * Odběratelem volebního průvodce jsou hlavně novináři a spolky, kteří web
 * nebudou obcházet ručně. Do každé položky proto jde i řádek se zdrojem —
 * zásada „nic bez dohledatelného zdroje" musí platit i mimo web, kde se
 * text čte vytržený z kontextu stránky.
 */

const ZAKLAD = 'https://volimprahu.cz'

/** Feed se přegeneruje stejně často jako zbytek webu. */
export const revalidate = 900

function xml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(): Promise<Response> {
  const aktuality = (await kZobrazeni()).slice(0, 50)
  const aktualizovano = aktuality[0]?.vydano

  const polozky = aktuality
    .map((z) => {
      const odkaz = `${ZAKLAD}/aktualne/${z.slug}`
      const zdroje = z.zdroje.map((s) => `${s.text}: ${s.url}`).join(' | ')
      // Provozní poznámka o webu zdroj nemá a mít nemusí — zdrojem jsme my.
      // Ve čtečce ale stojí vytržená z kontextu rubriky, takže se musí
      // označit; jinak kanál slibuje zdroj u všeho a u některých ho nedodá.
      const popis = zdroje
        ? `${z.shrnuti}\n\nZdroj: ${zdroje}`
        : `Poznámka o webu volimprahu.cz — ${z.shrnuti}`
      return `    <item>
      <title>${xml(z.nadpis)}</title>
      <link>${xml(odkaz)}</link>
      <guid isPermaLink="true">${xml(odkaz)}</guid>
      <pubDate>${new Date(z.vydano).toUTCString()}</pubDate>
      <description>${xml(popis)}</description>
    </item>`
    })
    .join('\n')

  const telo = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Volím Prahu — aktuality</title>
    <link>${ZAKLAD}/aktualne</link>
    <atom:link href="${ZAKLAD}/aktualne/feed.xml" rel="self" type="application/rss+xml" />
    <description>Krátké zápisy o průběhu pražských komunálních a senátních voleb 2026. Zprávy o volbách mají uvedený zdroj, poznámky o samotném webu jsou označené.</description>
    <language>cs</language>${aktualizovano ? `\n    <lastBuildDate>${new Date(aktualizovano).toUTCString()}</lastBuildDate>` : ''}
${polozky}
  </channel>
</rss>
`

  return new Response(telo, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600',
    },
  })
}
