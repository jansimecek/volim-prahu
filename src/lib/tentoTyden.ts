import type { Route } from 'next'
import { dnesVPraze, rozdelDebaty } from './debaty'
import { kandidaturyOsoby } from './kandidatky'
import { PRAVNI_OPORA } from './moratorium'

/**
 * Co se děje v posledním týdnu před volbami, den po dni.
 *
 * Termíny jsou tytéž, které web jinde dokládá: lhůta pro hlasovací lístky
 * z přehledu ministerstva vnitra (/kde-volim), moratorium z moratorium.ts,
 * doba hlasování z rezim.ts a debaty z content/debaty.yaml. Tady se jen
 * skládají do jednoho seznamu, aby čtenář na titulní straně viděl, co ho
 * čeká, a nemusel to hledat na pěti stránkách.
 */

export type Udalost = {
  /** Kalendářní den v Praze, YYYY-MM-DD. */
  den: string
  /** Popisek dne, když událost trvá víc dní („16.–17. října“). */
  popisekDne?: string
  cas?: string
  nadpis: string
  popis: string
  odkaz?: { href: Route; text: string }
  zdroj?: { text: string; url: string }
}

const PEVNE: Udalost[] = [
  {
    den: '2026-10-06',
    nadpis: 'Poslední den pro doručení hlasovacích lístků',
    popis:
      'Úřad je má dodat nejpozději dnes. Kdo je nedostane nebo zapomene doma, dostane je ve volební místnosti.',
    odkaz: { href: '/kde-volim', text: 'Kde a jak volím' },
    zdroj: {
      text: 'Přehled termínů a lhůt, ministerstvo vnitra',
      url: 'https://archiv.mv.gov.cz/volby/soubor/prehled-terminu-a-lhut-pro-volby-do-zastupitelstev-obci-2026.aspx',
    },
  },
  {
    den: '2026-10-06',
    nadpis: 'Začíná zákaz zveřejňování průzkumů',
    popis: `Do konce hlasování v sobotu ve 14:00 se nesmějí zveřejňovat výsledky předvolebních a volebních průzkumů (${PRAVNI_OPORA}). Web je do té doby skrývá.`,
    zdroj: {
      text: 'Zákon č. 234/2025 Sb., § 6',
      url: 'https://www.zakonyprolidi.cz/cs/2025-234#p6',
    },
  },
  {
    den: '2026-10-09',
    cas: '14:00–22:00',
    nadpis: 'Volí se, první den',
    popis:
      'Ve svém okrsku podle trvalého pobytu, s občanským průkazem, pasem nebo eDokladem. Voličský průkaz u komunálních voleb neexistuje.',
    odkaz: { href: '/kde-volim', text: 'Najít volební místnost' },
  },
  {
    den: '2026-10-10',
    cas: '8:00–14:00',
    nadpis: 'Volí se, druhý den',
    popis: 'Ve 14:00 se místnosti zavírají a začíná sčítání. Průběžné výsledky z dat ČSÚ jsou tady na webu.',
    odkaz: { href: '/vysledky', text: 'Výsledky' },
  },
  {
    den: '2026-10-16',
    popisekDne: 'pátek 16. a sobota 17. října',
    nadpis: 'Případné druhé kolo senátních voleb',
    popis:
      'Jen ve třech pražských senátních obvodech, kde v prvním kole nikdo nezíská nadpoloviční většinu.',
    odkaz: { href: '/senat', text: 'Senát' },
  },
]

/** Debaty z kalendáře, které padnou do volebního týdne. */
function debatyTydne(ted: Date): Udalost[] {
  return rozdelDebaty(ted)
    .nadchazejici.filter((d) => d.datum.slice(0, 10) <= '2026-10-10')
    .map((d) => {
      // Na titulní straně stačí příjmení; celá jména s tituly jsou na /debaty.
      const ucastnici = d.ucastnici.map((slug) => kandidaturyOsoby(slug)[0]?.kandidat.prijmeni ?? slug)
      return {
        den: d.datum.slice(0, 10),
        cas: d.cas ?? undefined,
        nadpis: `Debata: ${d.poradatel}`,
        popis:
          `${d.nazev}${d.kde ? `, ${d.kde}` : ''}.` +
          (ucastnici.length > 0
            ? ` Pozvaní: ${ucastnici.join(', ')}.`
            : ' Složení pořadatel zatím nezveřejnil.'),
        odkaz: { href: '/debaty' as Route, text: 'Kalendář debat' },
        zdroj: { text: d.zdroj.text, url: d.zdroj.url },
      }
    })
}

export type DenTydne = { den: string; popisek: string; dnes: boolean; udalosti: Udalost[] }

const denVTydnu = new Intl.DateTimeFormat('cs-CZ', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/**
 * Dnešek a dny, které ještě přijdou, seřazené. Proběhlé dny se nevypisují:
 * čtenář chce vědět, co ho čeká, a proběhlé debaty jsou na /debaty.
 */
export function tentoTyden(ted: Date = new Date()): DenTydne[] {
  const dnes = dnesVPraze(ted)
  const udalosti = [...PEVNE.filter((u) => u.den >= dnes), ...debatyTydne(ted)]
  const podleDne = new Map<string, Udalost[]>()
  for (const u of udalosti) podleDne.set(u.den, [...(podleDne.get(u.den) ?? []), u])

  return [...podleDne.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([den, seznam]) => ({
      den,
      popisek: seznam.find((u) => u.popisekDne)?.popisekDne ?? denVTydnu.format(new Date(`${den}T00:00:00Z`)),
      dnes: den === dnes,
      udalosti: seznam.sort((a, b) => (a.cas ?? '').localeCompare(b.cas ?? '')),
    }))
}
