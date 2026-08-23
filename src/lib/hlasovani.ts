import { z } from 'zod'

/**
 * Anketa „koho byste volili".
 *
 * Tři pravidla, která drží celý návrh a nesmí se změnit bez rozmyslu:
 *
 *  1. ŽÁDNÉ AGREGÁTY PŘED VOLBAMI. Ani počet hlasů, ani procenta, ani „už
 *     hlasovalo X lidí". Vynucuje to server, ne skrytí v UI — jinak by to byl
 *     předvolební průzkum se vším, co k tomu patří.
 *  2. HLAS JE ANONYMNÍ. Neukládá se e-mail, IP ani user agent. Nic, co by šlo
 *     zpětně spojit s člověkem.
 *  3. E-MAIL ŽIJE ODDĚLENĚ. Kdo chce pozvánku k povolebnímu hodnocení, uloží se
 *     do jiné tabulky bez jakékoli vazby na svůj hlas.
 */

/** Konec hlasování a zároveň okamžik, od kterého se smí zveřejnit výsledky. */
export const KONEC_VOLEB = new Date('2026-10-10T14:00:00+02:00')

export const VEKOVE_KATEGORIE = ['18-29', '30-44', '45-59', '60+'] as const
export const UROVNE = ['magistrat', 'mestska-cast'] as const

export type VekovaKategorie = (typeof VEKOVE_KATEGORIE)[number]
export type Uroven = (typeof UROVNE)[number]

/** Hlasovat lze jen dokud se volí. Po zavření uren je anketa uzavřená. */
export function hlasovaniOtevrene(ted: Date = new Date()): boolean {
  return ted < KONEC_VOLEB
}

/**
 * Výsledky se smí vydat až po zavření volebních místností. Tahle funkce je
 * jediné místo, kde se o tom rozhoduje — volá ji API i stránka výsledků.
 */
export function vysledkyZverejnitelne(ted: Date = new Date()): boolean {
  return ted >= KONEC_VOLEB
}

export const schemaHlasu = z.object({
  mestskaCast: z.string().min(1).max(64),
  vekovaKategorie: z.enum(VEKOVE_KATEGORIE),
  uroven: z.enum(UROVNE),
  subjekt: z.string().min(1).max(160),
})

export const schemaOdberu = z.object({
  // Záměrně bez jména a bez čehokoli dalšího — víc než adresu nepotřebujeme.
  email: z.string().email().max(254),
})

export type Hlas = z.infer<typeof schemaHlasu>
export type Odber = z.infer<typeof schemaOdberu>

export const COOKIE_HLASU = 'vp_hlasovano'
