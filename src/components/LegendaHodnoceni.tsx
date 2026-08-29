import { OSY, TON_TRIDA, type Ton } from '@/lib/hodnoceni'

const ZNACKA: Record<Ton, string> = {
  prima: '●',
  stredni: '◐',
  prekazka: '○',
  nezname: '–',
}

/**
 * Legenda se generuje z týchž konstant, ze kterých se vykresluje razítko.
 * Metodika tak nemůže odejít od skutečnosti — to je celý smysl.
 */
export function LegendaHodnoceni() {
  return (
    <div className="space-y-8">
      {OSY.map((osa) => (
        <section key={osa.klic}>
          <h3 className="popisek-uredni">{osa.popisek}</h3>
          <dl className="mt-2 divide-y divide-linka-silna border-t border-b border-linka-silna">
            {Object.entries(osa.popisy).map(([klic, stav]) => (
              <div key={klic} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
                <dt className={`razitko-hodnota ${TON_TRIDA[stav.ton]}`}>
                  <span className="znacka" aria-hidden="true">
                    {ZNACKA[stav.ton]}
                  </span>
                  <span>{stav.zkratka}</span>
                </dt>
                <dd className="text-sm">{stav.popis}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
