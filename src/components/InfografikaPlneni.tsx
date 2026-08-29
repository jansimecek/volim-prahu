import { plneni } from '#content'
import { sPoctem } from '@/lib/cestina'
import { POPIS_KATEGORIE, POPIS_STAVU, POradiSTAVU, type StavPlneni } from '@/lib/plneni'

/**
 * Infografika k plnění programového prohlášení.
 *
 * Dvě panely, protože jde o dvě různé věci a smíchat je do jednoho grafu by
 * lhalo o měřítku:
 *
 *  1. Kolik závazků vůbec jde ověřit. Z 576 jich má měřitelný cíl devět —
 *     to je hlavní zjištění celé stránky a patří nahoru.
 *  2. Těch devět rozdělených podle priority, kterou jim dala sama rada,
 *     a podle doloženého výsledku.
 *
 * Sloupce v prvním panelu mají všechny stejnou barvu: délka už hodnotu nese,
 * obarvit ji podle velikosti by znovu kódovalo totéž. Ve druhém panelu barva
 * nese stav, ale nikdy sama — vždycky se značkou a slovem.
 */
export function InfografikaPlneni() {
  const { mereni, zavazky } = plneni

  const kroky = [
    { popisek: 'Závazků v prohlášení', hodnota: mereni.zavazkuCelkem },
    { popisek: 'Obsahuje číslici', hodnota: mereni.sJakymkoliCislem },
    { popisek: 'Obsahuje letopočet', hodnota: mereni.sLetopoctem },
    { popisek: 'Má měřitelný cíl', hodnota: mereni.sKonkretnimCilem },
  ]

  const celkemVKategorii: Record<string, number> = {
    'v-realizaci': mereni.vRealizaci,
    pripravovane: mereni.pripravovane,
    vyhled: mereni.vyhled,
  }

  const pocty = POradiSTAVU.map((stav) => ({
    stav,
    pocet: zavazky.filter((z) => z.stav === stav).length,
  })).filter((p) => p.pocet > 0)

  return (
    <section aria-labelledby="prehled" className="space-y-8">
      <div className="max-w-prose">
        <h2 id="prehled" className="text-2xl">
          Přehled na jeden pohled
        </h2>
        <p className="mt-2">
          Rada si do prohlášení dala {mereni.zavazkuCelkem} závazků. Ověřit jich jde{' '}
          {mereni.sKonkretnimCilem} — u ostatních chybí číslo i termín, takže není proti
          čemu výsledek poměřit.
        </p>
      </div>

      {/* Panel 1 — kolik z prohlášení vůbec jde ověřit */}
      <div className="border border-inkoust p-4 sm:p-5">
        <h3 className="font-display text-lg font-semibold">Kolik závazků jde ověřit</h3>
        <p className="popisek-uredni mt-1">Podíl z {mereni.zavazkuCelkem} závazků</p>

        <ul className="mt-4 space-y-3">
          {kroky.map((krok) => {
            const podil = (krok.hodnota / mereni.zavazkuCelkem) * 100
            return (
              <li key={krok.popisek} className="grid grid-cols-[10rem_3rem_1fr] items-center gap-3">
                <span className="text-sm">{krok.popisek}</span>
                <span className="text-right font-mono tabular-nums">{krok.hodnota}</span>
                {/* Hodnota stojí vedle, takže pruh sám nenese žádnou informaci navíc. */}
                <span aria-hidden="true" className="block h-3 bg-papir-tmavsi">
                  <span
                    className="block h-3 min-w-[3px] bg-inkoust"
                    style={{ width: `${podil}%` }}
                  />
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Panel 2 — devět měřitelných závazků podle priority a výsledku */}
      <div className="border border-inkoust p-4 sm:p-5">
        <h3 className="font-display text-lg font-semibold">
          {sPoctem(zavazky.length, 'měřitelný závazek', 'měřitelné závazky', 'měřitelných závazků')}{' '}
          podle priority a výsledku
        </h3>
        <p className="mt-1 max-w-prose text-sm text-seda-uredni">
          Priority určilo samo prohlášení — dělí závazky na to, co je v realizaci, co se
          připravuje a co je jen výhled bez vazby na volební období.
        </p>

        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {pocty.map(({ stav, pocet }) => (
            <li key={stav} className={`razitko-hodnota ${POPIS_STAVU[stav].trida}`}>
              <span className="znacka" aria-hidden="true">
                {POPIS_STAVU[stav].znacka}
              </span>
              <span>
                {POPIS_STAVU[stav].nazev} — {pocet}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 grid gap-px bg-linka-silna sm:grid-cols-3">
          {(Object.keys(POPIS_KATEGORIE) as (keyof typeof POPIS_KATEGORIE)[]).map((kategorie) => {
            const vKategorii = zavazky.filter((z) => z.kategorie === kategorie)
            return (
              <div key={kategorie} className="bg-papir p-3">
                <p className="popisek-uredni">{POPIS_KATEGORIE[kategorie]}</p>
                <p className="mt-1 font-mono text-lg">
                  {celkemVKategorii[kategorie]}
                  <span className="ml-2 text-sm text-seda-uredni">
                    z toho měřitelných {vKategorii.length}
                  </span>
                </p>

                <ul className="mt-3 space-y-2">
                  {vKategorii.map((z) => {
                    const stav = POPIS_STAVU[z.stav as StavPlneni]
                    return (
                      <li key={z.id}>
                        <a
                          href={`#${z.id}`}
                          className={`block border-l-4 py-1 pl-3 no-underline hover:bg-papir-tmavsi ${stav.pruh}`}
                        >
                          <span className={`razitko-hodnota ${stav.trida}`}>
                            <span className="znacka" aria-hidden="true">
                              {stav.znacka}
                            </span>
                            <span>{stav.nazev}</span>
                          </span>
                          <span className="mt-0.5 block text-sm">{z.oblast}</span>
                          <span className="block text-drobne text-seda-uredni">
                            {zkrat(z.zneni)}
                          </span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="mt-4 max-w-prose text-sm text-seda-uredni">
          Barva nikdy nestojí sama — u každého stavu je i značka a slovní popis. Pražská
          červená a okr jsou pro část čtenářů s poruchou barvocitu k nerozeznání.
        </p>
      </div>
    </section>
  )
}

/** Zkrácené znění pro dlaždici. Celé je o pár řádků níž u samotného závazku. */
function zkrat(text: string): string {
  return text.length > 64 ? `${text.slice(0, 61)}…` : text
}
