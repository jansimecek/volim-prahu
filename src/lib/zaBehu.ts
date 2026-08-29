import { connection } from 'next/server'
import { smiZobrazitPruzkum } from './moratorium'

/**
 * Vyhodnocení moratoria v okamžiku požadavku, ne při generování stránky.
 *
 * Proč to nestačí řešit přes `revalidate`: stránky jsou statické a Next je
 * po vypršení lhůty neregeneruje dopředu. Nejdřív pošle uloženou verzi
 * a novou staví teprve na pozadí. Stránka vygenerovaná v 23:58 by tak
 * ještě po půlnoci — tedy uvnitř zakázané lhůty — servírovala procenta
 * zapečená do HTML. U zákonné lhůty se na čas generování spoléhat nelze.
 *
 * `connection()` vyřadí render ze statického předgenerování. Volá se ale
 * jen tehdy, když je vůbec co skrývat: dokud v obsahu žádný průzkum není,
 * zůstává stránka statická a nic to nestojí. O tom, jestli je stránka
 * dynamická, tak rozhoduje obsah, ne natvrdo zapsaná konfigurace.
 */
export async function smiZobrazitPruzkumZaBehu(jeCoSkryvat: boolean): Promise<boolean> {
  if (!jeCoSkryvat) return true
  await connection()
  return smiZobrazitPruzkum()
}
