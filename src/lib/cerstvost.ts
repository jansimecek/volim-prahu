import type { Snapshot } from './vysledky'

/**
 * Čerstvost snapshotu. Vlastní modul bez závislosti na node:fs, protože to
 * potřebuje i klientská komponenta — a ta by s úložištěm v jednom souboru
 * stáhla do prohlížeče půl Node.js.
 */

/** Nad tímhle stářím stránka viditelně upozorní, že data nejsou čerstvá. */
export const PRAH_ZASTARALOSTI_MINUT = 10

export function stariMinut(
  snapshot: Pick<Snapshot, 'stazeno'>,
  ted: Date = new Date(),
): number {
  const stazeno = new Date(snapshot.stazeno).getTime()
  if (!Number.isFinite(stazeno)) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.round((ted.getTime() - stazeno) / 60_000))
}
