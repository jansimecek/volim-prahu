import { duvodSkryti, smiZobrazitPruzkum } from '@/lib/moratorium'

/**
 * Obal pro jakýkoli obsah obsahující výsledky předvolebních průzkumů.
 * Veškerý takový obsah MUSÍ projít tudy — o zobrazení nerozhoduje stránka,
 * ale jedna funkce, aby se na to nedalo zapomenout.
 */
export function BlokPruzkumu({ children }: { children: React.ReactNode }) {
  if (smiZobrazitPruzkum()) return <>{children}</>

  return (
    <section className="max-w-prose border-l-2 border-praha pl-5">
      <h2 className="popisek-uredni">Skryto</h2>
      <p className="mt-1">{duvodSkryti()}</p>
    </section>
  )
}
