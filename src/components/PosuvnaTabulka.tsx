/**
 * Obal pro tabulku, která se na úzké obrazovce posouvá do stran.
 *
 * Samotné `overflow-x-auto` je past: myší se obsah posunout dá, klávesnicí
 * ne — do neinteraktivního divu se nedostane focus, takže část tabulky je
 * pro čtenáře na klávesnici nedosažitelná (WCAG 2.1.1, axe
 * `scrollable-region-focusable`). Proto tabindex a pojmenovaná oblast.
 *
 * `relative` není kosmetika: skryté popisky pro odečítač (`sr-only`) jsou
 * absolutně pozicované, a bez pozicovaného předka se počítají vůči celé
 * stránce, ne vůči posuvné oblasti. Široká tabulka pak roztáhla do stran
 * celý dokument — na telefonu se dala posouvat vodorovně celá stránka.
 */
export function PosuvnaTabulka({
  popisek,
  trida,
  children,
}: {
  popisek: string
  trida?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="region"
      aria-label={popisek}
      tabIndex={0}
      className={`relative overflow-x-auto${trida ? ` ${trida}` : ''}`}
    >
      {children}
    </div>
  )
}
