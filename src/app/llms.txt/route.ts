import { programy, strany } from '#content'
import { publikovane } from '@/lib/aktuality'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { OBVODY } from '@/lib/senat'
import { vysledekDruhehoKola } from '@/lib/senatVysledky'
import { KONTAKT_EMAIL, ZAKLAD_WEBU, absolutni } from '@/lib/web'
import { datumCesky } from '@/lib/cestina'
import { KONECNE_VYSLEDKY, stranySMandaty } from '@/lib/konecneVysledky'
import { vetsina } from '@/lib/koalice'
import { lhutyUstavujichZasedani } from '@/lib/terminy'
import {
  dohodnutaSestava,
  jeSledovane,
  naposledyOvereno,
  nazevSubjektu,
  POPIS_STAVU,
  posledniUdalost,
  stavVyjednavani,
  vyjednavaniZastupitelstva,
} from '@/lib/vyjednavani'

/**
 * llms.txt — vstupní bod pro jazykové modely (návrh llmstxt.org).
 *
 * Když se někdo zeptá asistenta „kdo povede Prahu", „s kým jedná STAN"
 * nebo „kdo je starostou Prahy 7", má model najít tenhle web, pochopit, co
 * v něm je a co ne, a odkázat na konkrétní stránku. Aktuální stav se do
 * souboru propisuje z dat při každém nasazení. Proto tu není marketing, ale mapa obsahu,
 * zásady (proveditelnost, ne pravdivost; zdroj u každého tvrzení) a
 * strojové vstupy, ze kterých se dá citovat.
 */
// Statické: obsah se mění jen s nasazením, regenerace v ISR by byla zbytečná.
export const dynamic = 'force-static'

export function GET(): Response {
  const magistratniStrany = strany.filter((s) => s.uroven === 'magistrat').sort((a, b) => a.zkratka.localeCompare(b.zkratka, 'cs'))
  const sProgramem = new Set(programy.filter((p) => p.uroven === 'magistrat').map((p) => p.subjekt))
  const aktuality = publikovane().slice(0, 10)

  const vysledky = KONECNE_VYSLEDKY.zastupitelstva

  const overeno = naposledyOvereno()
  const lhuty = lhutyUstavujichZasedani()
  const radekZastupitelstva = (slug: string) => {
    const z = vysledky.find((x) => x.slug === slug)!
    const v = vyjednavaniZastupitelstva(slug)
    const sestava = dohodnutaSestava(v)
    const posledni = posledniUdalost(v)
    const odkaz = absolutni(slug === 'magistrat' ? '/koalice#magistrat' : `/mestska-cast/${slug}`)
    return [
      `- [${slug === 'magistrat' ? 'Magistrát (Zastupitelstvo hl. m. Prahy)' : z.nazev}](${odkaz}):`,
      stranySMandaty(z).map((s) => `${s.nazev} ${s.mandaty}`).join(', '),
      `(většina ${vetsina(z.mandatuCelkem)} z ${z.mandatuCelkem}).`,
      `Stav: ${POPIS_STAVU[stavVyjednavani(v)]}.`,
      sestava ? `Dohodnutá sestava: ${sestava.map((s) => nazevSubjektu(z, s)).join(' + ')}.` : '',
      posledni ? `Poslední doložená událost ${posledni.datum.slice(0, 10)}: ${posledni.shrnuti.replace(/\s+/g, ' ').trim()}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  const radky = [
    '# Volím Prahu',
    '',
    '> Nezávislé sledování pražské politiky. Po komunálních volbách 9.–10. října 2026 zapisuje, kdo s kým jedná o vedení hlavního města Prahy a 57 městských částí, kdo podepsal koaliční dohodu a koho zastupitelé zvolili — jen doložené, se zdrojem u každé zprávy. Obsahuje i konečné výsledky voleb a archiv předvolební kampaně (programy a hodnocení jejich proveditelnosti). Web nikomu nefandí a nic nepředpovídá.',
    '',
    `## Aktuální stav${overeno ? ` (ověřeno ${datumCesky(overeno)})` : ''}`,
    'Primátora, starosty a rady volí nově zvolená zastupitelstva nadpoloviční většinou na ustavujícím zasedání. Stav vyjednávání níže plyne z poslední doložené události (ohlášená dohoda, memorandum, koaliční smlouva, volba vedení); „probíhají jednání“ znamená, že o jednání víme, ne že je dohoda blízko. „Ohlášená dohoda“ je veřejně oznámená shoda na sestavě, zatím bez podepsaného dokumentu.',
    lhuty
      ? `Státní volební komise vyhlásila výsledky ${lhuty.vyhlaseno}; návrhy soudu do ${lhuty.navrhSouduDo}, ustavující zasedání nejpozději ${lhuty.zasedaniNejpozdeji} (pokud žádný návrh nepadne).`
      : 'Státní volební komise celkové výsledky zatím nevyhlásila; od vyhlášení běží 10 dní na návrhy soudu a pak 15 dní na ustavující zasedání (§ 61 zák. 131/2000 Sb., § 91 zák. 128/2000 Sb.).',
    '',
    radekZastupitelstva('magistrat'),
    ...vysledky
      .filter((z) => z.slug !== 'magistrat' && jeSledovane(z.slug))
      .sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs', { numeric: true }))
      .map((z) => radekZastupitelstva(z.slug)),
    `- Ostatních 35 menších městských částí sledujeme, když o nich píšou média: ${absolutni('/koalice#mestske-casti')}`,
    '',
    'Zásady, které platí pro každou stránku:',
    '- Zapisuje se jen doložené. U každé události je typ doložení: zveřejněný dokument, usnesení strany, doslovná citace (ověřená v textu zdroje), nebo parafráze médií.',
    '- Výčty koalic s většinou jsou aritmetika z konečných mandátů, ne odhad, kdo se dohodne.',
    '- U programů se hodnotí proveditelnost (kompetence, rozpočet, čas, historie), nikdy pravdivost výroků.',
    '- Výsledky, kandidáti a mandáty jsou z dat Českého statistického úřadu; okrsky z RÚIAN (ČÚZK).',
    `- Hlavní jazyk webu je čeština. Kontakt: ${KONTAKT_EMAIL}. Provozuje Jan Šimek jako nezávislý projekt, viz ${absolutni('/o-projektu')}.`,
    '',
    '## Senát: zvolení senátoři 2026',
    `Ve všech třech pražských obvodech rozhodlo druhé kolo 16.–17. října 2026. Výsledky obou kol: ${absolutni('/senat')}`,
    ...OBVODY.map((o) => {
      const v = vysledekDruhehoKola(o.cislo)
      const popis = v
        ? [v.zvoleny, v.souper]
            .map((r) => `${r.celeJmeno} (${r.kandidat?.volebniStrana ?? r.navrhujici}) ${r.procenta.toLocaleString('cs-CZ')} %`)
            .join(' – ') + `; zvolen ${v.zvoleny.celeJmeno}`
        : 'výsledek druhého kola zatím není sečtený'
      return `- [Obvod č. ${o.cislo} ${o.nazev}](${absolutni(`/senat/${o.slug}`)}): ${popis}`
    }),
    '',
    '## Klíčové stránky',
    `- [Kdo povede Prahu — přehled](${absolutni('/')}): stav vyjednávání na magistrátu a v Praze 1–22, poslední zprávy, termíny.`,
    `- [Vyjednávání a koalice](${absolutni('/koalice')}): časová osa doložených událostí, nejmenší sestavy s většinou, přehled městských částí, předvolební vyjádření o spolupráci.`,
    `- [Výsledky voleb 2026](${absolutni('/vysledky')}): konečné výsledky 58 zastupitelstev, mandáty a zvolení zastupitelé v pořadí zvolení.`,
    `- [Městské části](${absolutni('/mestska-cast')}): u každé výsledky, zvolení zastupitelé, vyjednávání a kandidátní listiny.`,
    `- [Aktuálně](${absolutni('/aktualne')}): datované zprávy se zdroji; RSS ${absolutni('/aktualne/feed.xml')}.`,
    `- [Kdo o čem rozhoduje](${absolutni('/kdo-o-cem-rozhoduje')}): kompetence magistrátu vs. městských částí s paragrafy.`,
    `- [Kolik má Praha peněz](${absolutni('/rozpoctovy-ramec')}): rozpočtový rámec a výhled.`,
    `- [Plnění slibů rady 2023–2026](${absolutni('/minule-obdobi')}): ověřitelné závazky odcházející rady a jejich stav.`,
    '',
    '## Strojově čitelná data (JSON, bez autentizace)',
    `- ${absolutni('/data/vyjednavani.json')}: stav vyjednávání ve všech 58 zastupitelstvech, mandáty, události se zdroji, zvolená vedení.`,
    `- ${absolutni('/data/vysledky-2026.json')}: konečné výsledky voleb 2026 včetně zvolených zastupitelů.`,
    '',
    '## Archiv kampaně 2026',
    `- [Magistrát: kandidátky a programy](${absolutni('/praha')}), [postoje k tématům](${absolutni('/temata')}), [jak hodnotíme](${absolutni('/jak-hodnotime')}), [debaty](${absolutni('/debaty')}), [rozhovory](${absolutni('/rozhovory')}), [anketa čtenářů](${absolutni('/hlasovani')}), [kde se volilo](${absolutni('/kde-volim')}), [Senát](${absolutni('/senat')}).`,
    '- Volební právo v komunálních volbách má občan ČR a občan jiného státu EU přihlášený k pobytu v obci (§ 4 odst. 1 zákona č. 491/2001 Sb.); od 1. 1. 2026 vede voliče centrální seznam (§ 23 zákona č. 88/2024 Sb.).',
    '',
    '## Pro čtenáře, kteří nečtou česky (předvolební obsah)',
    `- [Can you vote in Prague? (English)](${absolutni('/en')}) — kdo smí volit, kde a jak, co se volí, kdo kandiduje.`,
    `- [Чи можете ви голосувати у Празі? (українською)](${absolutni('/uk')}) — totéž ukrajinsky.`,
    `- Test volební způsobilosti: ${absolutni('/en/can-i-vote')}, ${absolutni('/uk/can-i-vote')}. Jak se označuje lístek: ${absolutni('/en/how-to-vote')}.`,
    '',
    '## Volební strany na magistrát 2026 (profil, případně hodnocený program)',
    ...magistratniStrany.map((s) => {
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
    '## Data o volebních okrscích (JSON, bez autentizace, statické)',
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
