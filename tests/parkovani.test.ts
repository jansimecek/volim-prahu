import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ParkovaniMistnosti } from '../src/lib/parkovaniTypy'

const data: ParkovaniMistnosti = JSON.parse(
  readFileSync(join(process.cwd(), 'data/mistnosti/parkovani.json'), 'utf8'),
)
const mistnosti: { mestskaCast: string; mistnosti: { adresa: string }[] }[] = JSON.parse(
  readFileSync(join(process.cwd(), '.velite/volebniMistnosti.json'), 'utf8'),
)

/**
 * Zóna placeného stání u místnosti je odvozená z otevřených dat města.
 * Nejcitlivější je tu `zona: null`: znamená „v okolí žádná zóna není", ne
 * „je kde zaparkovat". Kdyby se ta hodnota začala plést s chybějícím
 * záznamem, web by mlčky tvrdil něco, co nikde nestojí.
 */
describe('zóny placeného stání u volebních místností', () => {
  it('se váží na místnost, která v obsahu opravdu je', () => {
    const znameAdresy = new Set(
      mistnosti.flatMap((s) => s.mistnosti.map((m) => `${s.mestskaCast}|${m.adresa}`)),
    )
    const cizi = data.mistnosti.filter((m) => !znameAdresy.has(`${m.mestskaCast}|${m.adresa}`))
    expect(cizi.map((m) => `${m.mestskaCast} — ${m.adresa}`)).toEqual([])
  })

  it('rozlišuje „zóna není" od chybějícího záznamu', () => {
    const spatne = data.mistnosti.filter((m) => m.zona === undefined)
    expect(spatne.map((m) => m.adresa)).toEqual([])
    expect(data.mistnosti.some((m) => m.zona === null)).toBe(true)
  })

  it('drží vzdálenost uvnitř hledaného okolí', () => {
    const mimo = data.mistnosti.filter((m) => m.zona && m.zona.metru > data.okoliMetru)
    expect(mimo.map((m) => `${m.adresa}: ${m.zona?.metru} m`)).toEqual([])
  })

  it('má u každé zóny tarif a ten nese dny i hodiny', () => {
    const podezrele = data.mistnosti.filter(
      (m) => m.zona && !m.zona.tarif.every((r) => /\d{2}:\d{2}/.test(r) && /Po|Út|St|Čt|Pá|So|Ne/.test(r)),
    )
    expect(podezrele.map((m) => `${m.adresa}: ${m.zona?.tarif.join(' | ')}`)).toEqual([])
  })

  it('nenese v tarifu zbytky HTML ze zdroje', () => {
    const sHtml = data.mistnosti.filter((m) => m.zona?.tarif.some((r) => r.includes('<')))
    expect(sHtml.map((m) => m.adresa)).toEqual([])
  })

  it('uvádí zdroj i licenci', () => {
    expect(data.zdroj.url).toContain('opendata.geoportalpraha.cz')
    expect(data.zdroj.licence).toBe('CC BY')
  })

  it('odpovídá tomu, kde zóny v Praze jsou: centrum ano, okrajové části ne', () => {
    const vZone = (slug: string) =>
      data.mistnosti.filter((m) => m.mestskaCast === slug && m.zona).length
    expect(vZone('praha-1')).toBeGreaterThan(0)
    expect(vZone('praha-2')).toBeGreaterThan(0)
    expect(vZone('praha-ujezd')).toBe(0)
    expect(vZone('praha-predni-kopanina')).toBe(0)
  })
})
