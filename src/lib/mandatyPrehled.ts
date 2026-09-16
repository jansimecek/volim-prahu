import { MAGISTRAT, MESTSKE_CASTI } from './obsah'

/**
 * Počty mandátů, které se dosazují do přeložených textů.
 *
 * Číslo mandátů nesmí být zapsané v překladu: při prvním zjištění se
 * ukázalo, že ručně psaný rozsah „15–45" neodpovídal číselníku, kde je
 * nejmenší zastupitelstvo pětičlenné. Jedna chyba ve třech jazycích je
 * tři chyby a opraví se jen ta, které si někdo všimne. Takhle se počty
 * berou z téhož zdroje jako na českých stránkách.
 */
export function pocetMandatu(): { magistrat: number; mcOd: number; mcDo: number } {
  const mc = MESTSKE_CASTI.map((z) => z.mandaty).filter((m) => m > 0)
  return {
    magistrat: MAGISTRAT.mandaty,
    mcOd: mc.length > 0 ? Math.min(...mc) : 0,
    mcDo: mc.length > 0 ? Math.max(...mc) : 0,
  }
}
