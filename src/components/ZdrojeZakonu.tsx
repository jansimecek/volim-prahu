/**
 * Seznam ustanovení, o která se cizojazyčná stránka opírá.
 *
 * Web má zásadu, že každé tvrzení o jmenovaném subjektu má dohledatelný
 * zdroj. U právních tvrzení pro cizince to platí dvojnásob: příručky
 * o volebním právu cizinců se po volební reformě rozešly se zákonem
 * a čtenář musí mít možnost si to ověřit sám, i když česky neumí —
 * číslo předpisu a paragraf jsou srozumitelné napříč jazyky.
 *
 * Odkazy vedou na český text zákona, takže nesou `hrefLang="cs"`.
 */
export function ZdrojeZakonu({
  nadpis,
  zdroje,
  id = 'zdroje',
}: {
  nadpis: string
  zdroje: readonly { popis: string; zakon: string; odkaz: string }[]
  id?: string
}) {
  return (
    <section aria-labelledby={id} className="border-t border-linka pt-8">
      <h2 id={id} className="text-2xl">
        {nadpis}
      </h2>
      <ul className="mt-4 space-y-3">
        {zdroje.map((z) => (
          <li key={`${z.zakon} ${z.popis}`} className="max-w-prose">
            <span>{z.popis}</span>
            <span className="block">
              <a href={z.odkaz} className="odkaz-akcent" hrefLang="cs">
                {z.zakon}
              </a>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
