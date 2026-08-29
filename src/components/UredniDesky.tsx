import Link from 'next/link'
import { LHUTA_OZNAMENI, souhrnDesek, type StavDesky, odkazNaDesku } from '@/lib/desky'
import { PosuvnaTabulka } from '@/components/PosuvnaTabulka'
import { datumCesky } from '@/lib/cestina'

const POPIS_STAVU: Record<StavDesky['stav'], { text: string; trida: string; znacka: string }> = {
  'oznameni-nalezeno': { text: 'oznámení vyvěšeno', trida: 'razitko-prima', znacka: '●' },
  'ceka-se': { text: 'zatím nevyvěšeno', trida: 'razitko-nezname', znacka: '–' },
  'bez-otevrenych-dat': { text: 'jen odkaz na desku', trida: 'razitko-nezname', znacka: '–' },
  'zdroj-nedostupny': { text: 'zdroj nedostupný', trida: 'razitko-stredni', znacka: '◐' },
}

const formatDatumu = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long' })

export function UredniDesky() {
  const souhrn = souhrnDesek()
  if (!souhrn) return null

  const nalezeno = souhrn.stavy.filter((s) => s.stav === 'oznameni-nalezeno')
  const strojove = souhrn.stavy.filter((s) => s.zdroj === 'otevrena-data')
  const poLhute = new Date() > LHUTA_OZNAMENI

  return (
    <div className="space-y-8">
      <section className="max-w-prose">
        <p>
          Závazná informace o tom, kde se ve vaší městské části volí, je{' '}
          <strong>Oznámení o době a místě konání voleb</strong>. Každá ze 57 částí ho
          vyvěšuje na vlastní úřední desce, takže je roztroušené na 57 různých místech.
          Sbíráme je sem.
        </p>
        <p className="mt-3">
          Vyvěsit se musí nejpozději {formatDatumu.format(LHUTA_OZNAMENI)}.{' '}
          {poLhute
            ? 'Lhůta už uplynula — kde oznámení chybí, stojí za to na úřad zavolat.'
            : 'Do té doby je normální, že u většiny částí ještě žádné není.'}
        </p>
        <p className="popisek-uredni mt-4">
          Nalezeno {nalezeno.length} z {souhrn.stavy.length} · strojově čitelnou desku má{' '}
          {strojove.length} částí · kontrolováno {formatDatumu.format(new Date(souhrn.zkontrolovano))}
        </p>
      </section>

      <PosuvnaTabulka popisek="Úřední desky městských částí">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-inkoust">
              <th className="popisek-uredni py-2 pr-3">Městská část</th>
              <th className="popisek-uredni py-2 pr-3">Stav</th>
              <th className="popisek-uredni py-2">Oznámení nebo úřední deska</th>
            </tr>
          </thead>
          <tbody>
            {souhrn.stavy.map((s) => {
              const stav = POPIS_STAVU[s.stav]
              return (
                <tr key={s.slug} className="border-b border-linka-silna align-top">
                  <td className="py-2 pr-3">
                    <Link href={`/mestska-cast/${s.slug}`} className="odkaz-akcent">
                      {s.nazev}
                    </Link>
                  </td>
                  <td className={`py-2 pr-3 razitko-hodnota ${stav.trida}`}>
                    <span className="znacka" aria-hidden="true">
                      {stav.znacka}
                    </span>
                    <span>{stav.text}</span>
                  </td>
                  <td className="py-2">
                    {s.oznameni ? (
                      <>
                        <a href={s.oznameni.url} className="odkaz-akcent" rel="noopener">
                          {s.oznameni.nazev}
                        </a>
                        {s.oznameni.vyveseno && (
                          <span className="popisek-uredni ml-2">
                            vyvěšeno {datumCesky(s.oznameni.vyveseno)}
                          </span>
                        )}
                      </>
                    ) : odkazNaDesku(s) ? (
                      <a href={odkazNaDesku(s)} className="odkaz-akcent" rel="noopener">
                        úřední deska
                      </a>
                    ) : (
                      <span className="text-seda-uredni">adresu desky nemáme</span>
                    )}
                    {/* Vysvětlení, proč se u téhle části nedá číst strojově
                        nebo proč adresa zlobí. Bez něj vypadá prázdný řádek
                        jako naše nedbalost, ne jako stav na straně úřadu. */}
                    {s.poznamka && (
                      <span className="mt-1 block text-drobne text-seda-uredni">{s.poznamka}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </PosuvnaTabulka>

      <p className="max-w-prose text-sm text-seda-uredni">
        Sbíráme jen odkazy na dokumenty zveřejněné úřady, samotné oznámení nepřebíráme.
        Když u vaší části odkaz chybí nebo nefunguje,{' '}
        <Link href="/o-projektu" className="odkaz-akcent">
          napište nám
        </Link>{' '}
        — opravíme to přednostně.
      </p>
    </div>
  )
}
