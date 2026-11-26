import { datumCesky } from '@/lib/cestina'
import { POPIS_ZAVER, TON_TRIDA, ZNACKA } from '@/lib/hodnoceni'
import { jePodmineny, jeProverovaci, maCislo, maLetopocet, type Zavazek } from '@/lib/smlouva'
import { POPIS_STAVU_PLNENI } from '@/lib/smlouvaTypy'

/**
 * Jeden závazek koaliční smlouvy: doslovné znění, strojové štítky a rozbor,
 * pokud už je. Štítky říkají, co v textu stojí, ne jak ho hodnotíme — proto
 * jsou v úředním popisku, ne v razítku.
 */
export function ZavazekSmlouvy({
  zavazek,
  nazevSubjektu,
}: {
  zavazek: Zavazek
  nazevSubjektu: (slug: string) => string
}) {
  const { zneni, analyza } = zavazek
  const stitky = [
    maCislo(zneni) && 's číslem',
    maLetopocet(zneni) && 's termínem',
    jeProverovaci(zneni) && 'prověřovací',
    jePodmineny(zneni) && 'podmíněný',
  ].filter(Boolean)

  return (
    <li id={zavazek.id} className="scroll-mt-20 border-b border-linka-silna py-4">
      <blockquote className="max-w-prose font-cteci text-lg">{`„${zneni}“`}</blockquote>
      <p className="popisek-uredni mt-2">
        {[
          ...stitky,
          zavazek.opakuje && `opakuje ${zavazek.opakuje}`,
          analyza ? `rozbor ověřen ${datumCesky(analyza.overeno)}` : 'zatím bez rozboru',
        ]
          .filter(Boolean)
          .join(' · ')}
        {' · '}
        <a href={`#${zavazek.id}`} className="odkaz-akcent" aria-label={`Odkaz na závazek ${zavazek.id}`}>
          #{zavazek.id}
        </a>
      </p>
      {zavazek.souvisi.length > 0 && (
        <p className="mt-1 text-sm">
          Souvisí:{' '}
          {zavazek.souvisi.map((id, i) => (
            <span key={id}>
              {i > 0 && ', '}
              <a href={`#${id}`} className="odkaz-akcent">
                {id}
              </a>
            </span>
          ))}
        </p>
      )}

      {analyza && (
        <div className="mt-3 max-w-prose space-y-2 border-l-2 border-inkoust pl-4 text-sm">
          {analyza.hodnoceni && (
            <div>
              <p className={`razitko-hodnota ${TON_TRIDA[POPIS_ZAVER[analyza.hodnoceni.zaver].ton]}`}>
                <span className="znacka" aria-hidden="true">
                  {ZNACKA[POPIS_ZAVER[analyza.hodnoceni.zaver].ton]}
                </span>
                <span>{POPIS_ZAVER[analyza.hodnoceni.zaver].nazev}</span>
              </p>
              <p className="mt-1">{analyza.hodnoceni.zduvodneni}</p>
              <ul>
                {analyza.hodnoceni.zdroje.map((url) => (
                  <li key={url}>
                    <a href={url} className="odkaz-akcent inline-block py-1 break-all" rel="noopener">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analyza.puvod.length > 0 && (
            <p>
              <span className="popisek-uredni">Ve volebním programu</span>{' '}
              {analyza.puvod.map((p, i) => (
                <span key={p.subjekt}>
                  {i > 0 && ', '}
                  <a href={p.citace_zdroje} className="odkaz-akcent" rel="noopener">
                    {nazevSubjektu(p.subjekt)}
                  </a>
                </span>
              ))}
            </p>
          )}
          {analyza.plneni && (
            <div>
              <p>
                <span className="popisek-uredni">Plnění</span> {POPIS_STAVU_PLNENI[analyza.plneni.stav]}
              </p>
              <p className="mt-1">{analyza.plneni.popis}</p>
              <ul>
                {analyza.plneni.zdroje.map((z) => (
                  <li key={z.url}>
                    <a href={z.url} className="odkaz-akcent inline-block py-1" rel="noopener">
                      {z.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
