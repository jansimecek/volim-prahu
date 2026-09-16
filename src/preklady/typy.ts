import type { en } from './en'

/**
 * Tvar překladu se odvozuje z anglické verze, ne z ručně psaného rozhraní.
 *
 * Ručně psané rozhraní by se muselo udržovat jako třetí kopie struktury
 * a v praxi by zaostávalo za oběma jazyky. Takhle je anglická verze
 * referenční a `const uk: Preklad` neprojde typovou kontrolou, dokud
 * nemá všechny klíče. Délku seznamů hlídá test — typ ji zachytit neumí.
 */
export type Preklad = typeof en
