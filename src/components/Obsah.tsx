/**
 * Obsah stránky.
 *
 * Stejný vzor jako přehled okruhů na stránce témat: vodorovný seznam kotev
 * v úředním popisku, ohraničený linkami. Zobrazuje se až od tří položek —
 * u dvou sekcí je obsah zbytečná mezistanice.
 */
export function Obsah({
  polozky,
  popisek = 'Na stránce',
}: {
  polozky: { id: string; text: string }[]
  popisek?: string
}) {
  if (polozky.length < 3) return null

  return (
    <nav aria-label="Obsah stránky" className="border-y border-inkoust py-3">
      <p className="popisek-uredni">{popisek}</p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {polozky.map((p) => (
          <li key={p.id}>
            <a href={`#${p.id}`} className="odkaz-navigace">
              {p.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
