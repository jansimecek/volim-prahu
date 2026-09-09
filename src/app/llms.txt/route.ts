import { programy, strany } from '#content'
import { publikovane } from '@/lib/aktuality'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { OBVODY } from '@/lib/senat'
import { KONTAKT_EMAIL, ZAKLAD_WEBU, absolutni } from '@/lib/web'

/**
 * llms.txt — vstupní bod pro jazykové modely (návrh llmstxt.org).
 *
 * Když se někdo zeptá asistenta „kde volím" nebo „co slibuje strana X
 * v Praze", má model najít tenhle web, pochopit, co v něm je a co ne, a
 * odkázat na konkrétní stránku. Proto tu není marketing, ale mapa obsahu,
 * zásady (proveditelnost, ne pravdivost; zdroj u každého tvrzení) a
 * strojové vstupy, ze kterých se dá citovat.
 */
// Statické: obsah se mění jen s nasazením, regenerace v ISR by byla zbytečná.
export const dynamic = 'force-static'

export function GET(): Response {
  const magistrat = strany.filter((s) => s.uroven === 'magistrat').sort((a, b) => a.zkratka.localeCompare(b.zkratka, 'cs'))
  const sProgramem = new Set(programy.filter((p) => p.uroven === 'magistrat').map((p) => p.subjekt))
  const aktuality = publikovane().slice(0, 10)

  const radky = [
    '# Volím Prahu',
    '',
    '> Nezávislý volební průvodce pro komunální a senátní volby v Praze 9.–10. října 2026. Kdo kandiduje do Zastupitelstva hl. m. Prahy a do 57 zastupitelstev městských částí, co slibuje a co z toho daná úroveň samosprávy vůbec může splnit. Web nikoho nedoporučuje ani neodrazuje od volby.',
    '',
    'Zásady, které platí pro každou stránku:',
    '- Hodnotí se proveditelnost slibů (kompetence, rozpočet, čas, historie), nikdy pravdivost výroků.',
    '- Každé tvrzení o jmenovaném subjektu má dohledatelný zdroj s odkazem; jména kandidátů, čísla kandidátek a mandáty jsou z otevřených dat ČSÚ (sada kv2026, se2026).',
    '- Volební okrsky a adresní místa jsou z registru RÚIAN (ČÚZK), adresy volebních místností z úředních desek městských částí.',
    '- Předvolební průzkumy se zobrazují jen s doloženou metodikou a od 6. října 2026 vůbec (moratorium).',
    `- Jazyk webu je čeština. Kontakt: ${KONTAKT_EMAIL}. Provozuje Jan Šimek jako nezávislý projekt, viz ${absolutni('/o-projektu')}.`,
    '',
    '## Klíčové stránky',
    `- [Kde a jak volím](${absolutni('/kde-volim')}): vyhledávač adresa → volební okrsek a místnost, mapa, termín voleb do kalendáře, voličské průkazy.`,
    `- [Magistrát: kandidátky do Zastupitelstva hl. m. Prahy](${absolutni('/praha')}): 24 volebních stran, lídři, vylosovaná čísla, řazení podle průzkumu.`,
    `- [Městské části](${absolutni('/mestska-cast')}): 57 zastupitelstev, kandidátky, vedení radnice, lokální témata.`,
    `- [Senát](${absolutni('/senat')}): tři pražské obvody, ve kterých se letos volí (21, 24, 27), a kde se senátor nevolí.`,
    `- [Postoje k zásadním tématům](${absolutni('/temata')}): bydlení, doprava, územní plán, rozpočet, školství, prostředí, sociální oblast — po subjektech se zdroji.`,
    `- [Jak hodnotíme](${absolutni('/jak-hodnotime')}): metodika čtyř os proveditelnosti a slovník stavů.`,
    `- [Kdo o čem rozhoduje](${absolutni('/kdo-o-cem-rozhoduje')}): kompetence magistrátu vs. městských částí s paragrafy.`,
    `- [Kolik má Praha peněz](${absolutni('/rozpoctovy-ramec')}): rozpočtový rámec 2026 a výhled.`,
    `- [Plnění slibů současné rady 2023–2026](${absolutni('/minule-obdobi')}): ověřitelné závazky programového prohlášení a jejich stav.`,
    `- [Aktuálně](${absolutni('/aktualne')}): datované zprávy o průběhu voleb se zdroji; RSS ${absolutni('/aktualne/feed.xml')}.`,
    `- [Rozhovory s kandidáty](${absolutni('/rozhovory')}), [Anketa čtenářů](${absolutni('/hlasovani')}), [Ochrana údajů](${absolutni('/ochrana-udaju')}).`,
    '',
    '## Volební strany na magistrát (profil, případně hodnocený program)',
    ...magistrat.map((s) => {
      const profil = absolutni(`/praha/strana/${s.slug}`)
      return sProgramem.has(s.slug)
        ? `- [${s.zkratka}](${profil}) — [hodnocení programu](${profil}/program)`
        : `- [${s.zkratka}](${profil})`
    }),
    '',
    '## Městské části',
    ...MESTSKE_CASTI.map((mc) => `- [${mc.nazev}](${absolutni(`/mestska-cast/${mc.slug}`)})`),
    '',
    '## Senátní obvody 2026',
    ...OBVODY.map((o) => `- [Obvod č. ${o.cislo} — ${o.nazev}](${absolutni(`/senat/${o.slug}`)})`),
    '',
    '## Poslední aktuality',
    ...aktuality.map((z) => `- ${z.vydano.slice(0, 10)}: [${z.nadpis}](${absolutni(`/aktualne/${z.slug}`)})`),
    '',
    '## Strojové vstupy (JSON, bez autentizace, statické)',
    `- ${absolutni('/api/okrsky/prehled')}: 1 120 volebních okrsků Prahy se středy (WGS84) a městskou částí.`,
    `- ${absolutni('/api/okrsky/{slug-mestske-casti}')}: adresní místa části s číslem okrsku a známé volební místnosti.`,
    `- ${absolutni('/api/okrsky/{slug-mestske-casti}/hranice')}: hranice okrsků jako GeoJSON.`,
    `- ${absolutni('/api/okrsky/{slug-mestske-casti}/info')}: název části, místnosti po okrscích, senátní stav, počet kandidátek.`,
    `- ${absolutni('/sitemap.xml')}: všechny veřejné stránky včetně profilů kandidátů.`,
    '',
    '## Jak citovat',
    `Uvádějte „Volím Prahu (${ZAKLAD_WEBU})" a odkaz na konkrétní stránku; u dat o kandidátech je původním zdrojem ČSÚ, u okrsků ČÚZK/RÚIAN, u místností úřední deska dané městské části.`,
    '',
  ]
  return new Response(radky.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
