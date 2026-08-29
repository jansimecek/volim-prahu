/**
 * Klasifikace chyb při ověřování odkazů.
 *
 * Motivace je konkrétní: úřední desky Prahy 2 a Prahy 4 posílají jen
 * koncový certifikát bez mezilehlého. Prohledávač i curl si chybějící článek
 * dotáhnou přes AIA, Node ne — takže se odkaz, který každému návštěvníkovi
 * v prohlížeči funguje, jeví jako mrtvý. Kdybychom to brali doslova, web by
 * voliči zamlčel adresu, kde má hledat svou volební místnost.
 *
 * Vada je na straně úřadu a stojí za nahlášení, ale není to důvod odkaz
 * skrývat ani shazovat kvůli němu validaci.
 */

export type DruhChyby = 'retez-certifikatu' | 'timeout' | 'jina'

export function popisChybyOdkazu(chyba: unknown): { druh: DruhChyby; popis: string } {
  const zprava =
    chyba instanceof Error
      ? ((chyba.cause as Error | undefined)?.message ?? chyba.message)
      : String(chyba)

  if (/unable to verify the first certificate|self-signed certificate|unable to get local issuer/i.test(zprava)) {
    return {
      druh: 'retez-certifikatu',
      popis:
        'Server neposílá mezilehlý certifikát, takže se řetěz nedá ověřit. V prohlížeči stránka funguje; vada je na straně úřadu.',
    }
  }
  if (/timed out|aborted|ETIMEDOUT/i.test(zprava)) {
    return { druh: 'timeout', popis: 'Server neodpověděl včas.' }
  }
  return { druh: 'jina', popis: zprava }
}

/**
 * Znamená chyba, že je odkaz pro čtenáře nepoužitelný? Neúplný řetěz
 * certifikátů ne — ten vidí jen strojový klient.
 */
export function jeOdkazMrtvy(druh: DruhChyby): boolean {
  return druh !== 'retez-certifikatu'
}
