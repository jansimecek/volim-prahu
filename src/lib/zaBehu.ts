import { connection } from 'next/server'
import { MORATORIUM_DO, MORATORIUM_OD, smiZobrazitPruzkum } from './moratorium'

/**
 * Vyhodnocení moratoria v okamžiku požadavku, ne při generování stránky.
 *
 * Proč to nestačí řešit jen přes `revalidate`: stránky jsou statické a Next
 * je po vypršení lhůty neregeneruje dopředu. Nejdřív pošle uloženou verzi
 * a novou staví teprve na pozadí. Stránka vygenerovaná v 23:58 by tak
 * ještě po půlnoci — tedy uvnitř zakázané lhůty — servírovala procenta
 * zapečená do HTML. U zákonné lhůty se na čas generování spoléhat nelze.
 *
 * `connection()` vyřadí render ze statického předgenerování a každý
 * požadavek pak obsluhuje funkce. To je správné jen v okně kolem hranice
 * lhůty; měsíc před ní by to znamenalo, že titulní strana, /praha ani
 * rubrika Aktuálně nejdou uložit do cache vůbec. Proto se čas za běhu čte
 * jen v okně dvou revalidací před hranicí a po ní. Mimo okno je uložená
 * kopie nejvýš 15 minut stará, tedy vždy vyrobená mimo lhůtu — layout má
 * `revalidate = 900` a test hlídá, že to číslo sedí s tímhle souborem.
 */
export const REVALIDACE_LAYOUTU_S = 900

const OKNO_MS = 2 * REVALIDACE_LAYOUTU_S * 1000

/** Je požadavek tak blízko hranice lhůty, že se musí číst čas za běhu? */
export function potrebujeCasZaBehu(ted: Date = new Date()): boolean {
  if (!MORATORIUM_OD) return false
  return [MORATORIUM_OD, MORATORIUM_DO].some(
    (hranice) => Math.abs(ted.getTime() - hranice.getTime()) <= OKNO_MS,
  )
}

export async function smiZobrazitPruzkumZaBehu(jeCoSkryvat: boolean): Promise<boolean> {
  if (!jeCoSkryvat) return true
  if (!potrebujeCasZaBehu()) return smiZobrazitPruzkum()
  await connection()
  return smiZobrazitPruzkum()
}
