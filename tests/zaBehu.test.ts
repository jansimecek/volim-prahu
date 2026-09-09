import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MORATORIUM_DO, MORATORIUM_OD } from '../src/lib/moratorium'
import { REVALIDACE_LAYOUTU_S, potrebujeCasZaBehu } from '../src/lib/zaBehu'

/**
 * Bezpečnost moratoria stojí na dvou číslech, která spolu musí sedět:
 * layout regeneruje stránky po 900 s a čas za běhu se čte v okně dvou
 * revalidací kolem hranice. Kdyby někdo jedno změnil bez druhého, mohla by
 * uložená kopie s průzkumem přežít do zakázané lhůty.
 */
describe('okno pro čtení času za běhu', () => {
  const od = MORATORIUM_OD!.getTime()
  const okno = 2 * REVALIDACE_LAYOUTU_S * 1000

  it('mimo okno se čas za běhu nečte (stránka zůstane v cache)', () => {
    expect(potrebujeCasZaBehu(new Date(od - okno - 1000))).toBe(false)
    expect(potrebujeCasZaBehu(new Date('2026-09-09T12:00:00+02:00'))).toBe(false)
    expect(potrebujeCasZaBehu(new Date(MORATORIUM_DO.getTime() + okno + 1000))).toBe(false)
  })

  it('kolem začátku i konce lhůty se čte za běhu', () => {
    expect(potrebujeCasZaBehu(new Date(od - okno + 1000))).toBe(true)
    expect(potrebujeCasZaBehu(new Date(od))).toBe(true)
    expect(potrebujeCasZaBehu(new Date(od + okno - 1000))).toBe(true)
    expect(potrebujeCasZaBehu(new Date(MORATORIUM_DO.getTime() - 60_000))).toBe(true)
  })

  it('layout regeneruje přesně tak často, s čím počítá okno', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8')
    expect(layout).toContain(`export const revalidate = ${REVALIDACE_LAYOUTU_S}`)
  })
})
