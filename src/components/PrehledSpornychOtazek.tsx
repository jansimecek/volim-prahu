import { PosuvnaTabulka } from '@/components/PosuvnaTabulka'
import { PoziceNaOse } from '@/components/SkalaOtazky'
import { skalaOtazky, subjektySrovnani, vsechnyOtazky } from '@/lib/temata'

/**
 * Přehled sporných otázek: řádky jsou otázky, sloupce subjekty, v buňce
 * poloha na škále dané otázky.
 *
 * Záměrně žádná barva podle „strany sporu“ a žádný součet do jednoho
 * skóre. Osy jednotlivých otázek spolu nesouvisejí — levý pól u jízdného
 * není „levice“ a pravý u parkování není „pravice“. Sečíst je by vyrobilo
 * politický kompas, který z dat neplyne. Proto každý řádek nese vlastní
 * popis pólů a buňka odkazuje na škálu se zdroji.
 */
export function PrehledSpornychOtazek() {
  const subjekty = subjektySrovnani()
  const radky = vsechnyOtazky().map((otazka) => {
    const { moznosti } = skalaOtazky(otazka)
    const poSubjektu = new Map(
      moznosti.flatMap((m) => m.odpovedi.map((o) => [o.subjekt, { moznost: m, odpoved: o }] as const)),
    )
    // Schéma vyžaduje aspoň dvě možnosti, takže oba póly existují vždy.
    const levy = moznosti[0]!.popis
    const pravy = moznosti[moznosti.length - 1]!.popis
    return { otazka, moznosti, poSubjektu, levy, pravy }
  })

  return (
    <PosuvnaTabulka popisek="Přehled sporných otázek podle subjektů" trida="mt-5">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <caption className="sr-only">
          Poloha subjektů na škále každé sporné otázky. Plný kroužek ukazuje zvolenou
          možnost, pomlčka znamená, že postoj nemáme doložený.
        </caption>
        <thead>
          <tr className="border-y border-inkoust">
            <th scope="col" className="popisek-uredni w-72 py-2 pr-3 text-left font-normal">
              Otázka a její póly
            </th>
            {subjekty.map((s) => (
              <th
                key={s.subjekt}
                scope="col"
                className="px-1 py-2 text-center font-display text-xs font-semibold leading-tight"
              >
                {s.zkratka}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {radky.map(({ otazka, moznosti, poSubjektu, levy, pravy }) => (
            <tr key={otazka.id} className="border-b border-linka-silna align-top">
              <th scope="row" className="py-2 pr-3 text-left font-normal">
                <a href={`#otazka-${otazka.id}`} className="font-display font-semibold">
                  {otazka.otazka}
                </a>
                <span className="mt-0.5 block text-drobne leading-snug text-seda-uredni">
                  vlevo: {levy} · vpravo: {pravy}
                </span>
              </th>
              {subjekty.map((s) => {
                const bunka = poSubjektu.get(s.subjekt)
                return (
                  <td key={s.subjekt} className="px-1 py-2 text-center">
                    {bunka ? (
                      <span title={`${bunka.moznost.popis}: ${bunka.odpoved.shrnuti}`}>
                        <PoziceNaOse poradi={bunka.moznost.poradi} pocet={moznosti.length} />
                        <span className="sr-only">
                          {s.zkratka}: {bunka.moznost.popis}
                        </span>
                      </span>
                    ) : (
                      <span className="text-seda-uredni" title="Nedoloženo">
                        –<span className="sr-only">{s.zkratka}: nedoloženo</span>
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </PosuvnaTabulka>
  )
}
