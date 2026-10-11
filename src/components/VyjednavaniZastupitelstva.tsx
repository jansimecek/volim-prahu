import { CasovaOsaVyjednavani } from '@/components/CasovaOsaVyjednavani'
import { KoaliceZMandatu } from '@/components/KoaliceZMandatu'
import { datumCesky } from '@/lib/cestina'
import {
  dohodnutaSestava,
  jeSledovane,
  nazevSubjektu,
  POPIS_STAVU,
  stavVyjednavani,
  subjektySMandaty,
  vylouceniProKoalice,
  vyjednavaniZastupitelstva,
} from '@/lib/vyjednavani'
import type { ZastupitelstvoVysledek } from '@/lib/vysledky'

/**
 * Vyjednávání o vedení jednoho zastupitelstva: stav, doložené události
 * a koalice, které z mandátů vycházejí. Na magistrátu i v městské části stejně.
 */
export function VyjednavaniZastupitelstva({ z, nadpis = 'h2' }: { z: ZastupitelstvoVysledek; nadpis?: 'h2' | 'h3' }) {
  const v = vyjednavaniZastupitelstva(z.slug)
  const stav = stavVyjednavani(v)
  const sestava = dohodnutaSestava(v)
  const H = nadpis
  const tridaNadpisu = nadpis === 'h2' ? 'text-2xl' : 'text-xl'

  return (
    <div className="space-y-8">
      <dl className="grid gap-px border border-inkoust bg-linka-silna sm:grid-cols-3">
        <div className="bg-papir p-3">
          <dt className="popisek-uredni">Stav</dt>
          <dd className="mt-1 font-display font-medium">{POPIS_STAVU[stav]}</dd>
        </div>
        <div className="bg-papir p-3">
          <dt className="popisek-uredni">Dohodnutá sestava</dt>
          <dd className="mt-1">{sestava ? sestava.map((s) => nazevSubjektu(z, s)).join(' + ') : '—'}</dd>
        </div>
        <div className="bg-papir p-3">
          <dt className="popisek-uredni">Ustavující zasedání</dt>
          <dd className="mt-1">
            {v?.ustavujiciZasedani ? datumCesky(v.ustavujiciZasedani.datum) : 'zatím nesvoláno'}
          </dd>
        </div>
      </dl>

      {v && v.vedeni.length > 0 && (
        <div>
          <H className={tridaNadpisu}>Zvolené vedení</H>
          <ul className="mt-3 space-y-1">
            {v.vedeni.map((f) => (
              <li key={`${f.funkce}-${f.jmeno}`}>
                <span className="popisek-uredni">{f.funkce}</span> {f.jmeno} ({nazevSubjektu(z, f.subjekt)})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <H className={tridaNadpisu}>Kdo s kým jedná</H>
        {v && v.udalosti.length > 0 ? (
          <>
            <p className="popisek-uredni mt-1">
              Doložené události od nejnovější · ověřeno {datumCesky(v.overeno)}
            </p>
            <div className="mt-2">
              <CasovaOsaVyjednavani v={v} z={z} />
            </div>
          </>
        ) : (
          <p className="mt-2 max-w-prose">
            {jeSledovane(z.slug)
              ? 'Zatím jsme o vyjednávání nenašli žádnou zprávu, kterou by šlo doložit. Doplňujeme průběžně.'
              : 'Vyjednávání v menších městských částech sledujeme, jen když o něm píšou média. Zatím jsme nic doloženého nenašli.'}
          </p>
        )}
      </div>

      <div>
        <H className={tridaNadpisu}>Možné koalice podle mandátů</H>
        <div className="mt-3">
          <KoaliceZMandatu
            subjekty={subjektySMandaty(z)}
            celkem={z.mandatuCelkem}
            vylouceni={vylouceniProKoalice(z.slug)}
          />
        </div>
      </div>
    </div>
  )
}
