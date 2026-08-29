/**
 * Obal pro tabulku, která se na úzké obrazovce posouvá do stran.
 *
 * Samotné `overflow-x-auto` je past: myší se obsah posunout dá, klávesnicí
 * ne — do neinteraktivního divu se nedostane focus, takže část tabulky je
 * pro čtenáře na klávesnici nedosažitelná (WCAG 2.1.1, axe
 * `scrollable-region-focusable`). Proto tabindex a pojmenovaná oblast.
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
      className={`overflow-x-auto${trida ? ` ${trida}` : ''}`}
    >
      {children}
    </div>
  )
}
