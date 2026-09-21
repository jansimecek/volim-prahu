import {
  POPIS_MLADEHO_KANDIDATA,
  POPISEK_MLADEHO_KANDIDATA,
  ZNACKA_MLADEHO_KANDIDATA,
  jeMladyKandidat,
} from '@/lib/vekKandidata'

/**
 * Buňka se věkem kandidáta — společná pro komunální listinu i senátní obvod.
 *
 * Označení nestojí na barvě. Okr už ve stejné tabulce znamená „kandidatura
 * neplatná" a druhý význam téhož odstínu by se pletl, pražská červená je
 * vyhrazená interaktivním prvkům a nová barva by paletu rozšířila o šestou
 * hodnotu. Rozdíl proto nese tvar: značka, polotučná číslice a popisek —
 * tedy i pro čtenáře, který barvy nerozliší (WCAG 1.4.1).
 *
 * Značka je `aria-hidden`, protože hned vedle ní stojí totéž slovy; odečítač
 * obrazovky by jinak četl „čtvereček 34 do 40 let".
 */
export function BunkaVeku({ vek }: { vek: number }) {
  if (!jeMladyKandidat(vek)) {
    return <td className="py-2 pr-3 text-right font-mono">{vek}</td>
  }

  return (
    <td className="py-2 pr-3 text-right font-mono">
      <span className="whitespace-nowrap">
        <span aria-hidden="true" className="mr-1">
          {ZNACKA_MLADEHO_KANDIDATA}
        </span>
        <span className="font-semibold">{vek}</span>
      </span>{' '}
      <span className="popisek-uredni whitespace-nowrap">{POPISEK_MLADEHO_KANDIDATA}</span>
    </td>
  )
}

/**
 * Vysvětlivka pod tabulkou. Zobrazuje se, jen když je co vysvětlovat —
 * stejně jako vysvětlení neplatné kandidatury nad ní.
 */
export function VysvetlivkaVeku() {
  return (
    <p className="mt-2 max-w-prose text-sm text-seda-uredni">
      <span aria-hidden="true" className="mr-1 font-mono">
        {ZNACKA_MLADEHO_KANDIDATA}
      </span>
      <span className="popisek-uredni">{POPISEK_MLADEHO_KANDIDATA}</span> —{' '}
      {POPIS_MLADEHO_KANDIDATA}
    </p>
  )
}
