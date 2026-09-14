/**
 * Výčet koalic, které z daného rozdělení mandátů mají většinu.
 *
 * Ukazuje se jen aritmetika: které sestavy by měly v zastupitelstvu aspoň
 * nadpoloviční většinu. Kdo s kým opravdu půjde, z mandátů odvodit nejde —
 * proto se k sestavám připisují jen doložená vyloučení, ne odhady.
 */

export type StranaSMandaty = { id: string; mandaty: number }

/** Subjekt `kdo` veřejně vyloučil spolupráci se subjektem `koho`; `deklarace` odkazuje na doložení. */
export type Vylouceni = { kdo: string; koho: string; deklarace: string }

export type Koalice = {
  clenove: string[]
  mandaty: number
  /**
   * Doložená vyloučení mezi členy sestavy. Prázdné pole neznamená, že se
   * členové dohodnou — jen že žádné veřejné vyloučení mezi nimi neznáme.
   */
  vylouceni: Vylouceni[]
}

/** Nadpoloviční většina z celkového počtu členů zastupitelstva. */
export const vetsina = (celkem: number): number => Math.floor(celkem / 2) + 1

/** Při 65 mandátech a klauzuli 5 % víc subjektů s mandátem být nemůže. */
const MAX_SUBJEKTU = 20

/**
 * Minimální vítězné koalice: sestavy subjektů s mandátem, které mají dohromady
 * aspoň většinu a po odebrání kteréhokoli člena by ji ztratily. Větší sestavy
 * vzniknou přibráním dalšího partnera k některé z nich, takže se nevypisují.
 *
 * Pořadí: nejdřív podle počtu členů, pak podle pořadí, v jakém subjekty přišly
 * na vstup (na webu abecedně). Podle počtu mandátů se neřadí — sestava nahoře
 * by vypadala pravděpodobněji, a to kalkulačka tvrdit nesmí.
 */
export function minimalniKoalice(
  strany: readonly StranaSMandaty[],
  celkem: number,
  vylouceni: readonly Vylouceni[] = [],
): Koalice[] {
  const sMandatem = strany.filter((s) => s.mandaty > 0)
  const n = sMandatem.length
  if (n > MAX_SUBJEKTU) {
    throw new Error(`Výčet koalic zvládne nejvýš ${MAX_SUBJEKTU} subjektů s mandátem, dostal ${n}.`)
  }
  const cil = vetsina(celkem)

  // Součet a nejmenší člen každé sestavy se dopočítají ze sestavy bez nejnižšího bitu.
  const soucet = new Int32Array(1 << n)
  const nejmensi = new Int32Array(1 << n)
  const nalezene: number[] = []
  for (let maska = 1; maska < 1 << n; maska++) {
    const bit = maska & -maska
    const i = 31 - Math.clz32(bit)
    const zbytek = maska ^ bit
    const m = sMandatem[i]!.mandaty
    soucet[maska] = soucet[zbytek]! + m
    nejmensi[maska] = zbytek === 0 ? m : Math.min(nejmensi[zbytek]!, m)
    // Minimální je sestava, které k většině nestačí ani bez svého nejmenšího člena.
    if (soucet[maska]! >= cil && soucet[maska]! - nejmensi[maska]! < cil) nalezene.push(maska)
  }

  return nalezene
    .map((maska) => ({ maska, indexy: sMandatem.map((_, j) => j).filter((j) => maska & (1 << j)) }))
    .sort((a, b) => a.indexy.length - b.indexy.length || porovnejIndexy(a.indexy, b.indexy))
    .map(({ maska, indexy }) => {
      const clenove = indexy.map((j) => sMandatem[j]!.id)
      const mnozina = new Set(clenove)
      return {
        clenove,
        mandaty: soucet[maska]!,
        vylouceni: vylouceni.filter((v) => mnozina.has(v.kdo) && mnozina.has(v.koho)),
      }
    })
}

function porovnejIndexy(a: readonly number[], b: readonly number[]): number {
  for (let k = 0; k < Math.min(a.length, b.length); k++) {
    if (a[k] !== b[k]) return a[k]! - b[k]!
  }
  return a.length - b.length
}
