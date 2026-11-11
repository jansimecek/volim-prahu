import { CasovaOsaVyjednavani } from '@/components/CasovaOsaVyjednavani'
import { KoaliceZMandatu } from '@/components/KoaliceZMandatu'
import { RadaPodleStran } from '@/components/RadaPodleStran'
import { datumCesky } from '@/lib/cestina'
import {
  dohodnutaSestava,
  jeSledovane,
  nazevSubjektu,
  POPIS_STAVU,
  rozlozeniMandatu,
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
  const rozlozeni = rozlozeniMandatu(z)
  const tridaNadpisu = nadpis === 'h2' ? 'text-2xl' : 'text-xl'
  const podnadpis = nadpis === 'h2' ? 'h3' : 'h4'

  return (
    <div className="space-y-8">
      {rozlozeni.typ === 'jedina-kandidatka' && (
        <p className="max-w-prose border-l-2 border-praha pl-4">
          Kandidovala jediná kandidátka, <strong>{rozlozeni.subjekt.nazev}</strong>, a obsadila všech{' '}
          {z.mandatuCelkem} křesel. O koalici se tu nevyjednává: starostu a radu zvolí jen její
          zastupitelé na ustavujícím zasedání.
        </p>
      )}
      {rozlozeni.typ === 'samostatna-vetsina' && (
        <p className="max-w-prose border-l-2 border-praha pl-4">
          Kandidátka <strong>{rozlozeni.subjekt.nazev}</strong> má sama většinu ({rozlozeni.subjekt.mandaty} z{' '}
          {z.mandatuCelkem}), vedení tedy může zvolit bez partnera. Jestli si přesto koaličního partnera
          přibere, zapíšeme, až to bude doložené.
        </p>
      )}
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
          <p className="popisek-uredni mt-1">
            {v.vedeni.some((f) => f.gesce.length > 0)
              ? 'Po stranách, s oblastmi, které jednotliví radní řídí'
              : 'Po stranách · rozdělení gescí zatím nemáme doložené'}
          </p>
          <div className="mt-3">
            <RadaPodleStran clenove={v.vedeni} nazev={(s) => nazevSubjektu(z, s)} nadpis={podnadpis} />
          </div>
        </div>
      )}

      {v?.ocekavanaRada && v.vedeni.length === 0 && (
        <div id="ocekavana-rada">
          <H className={tridaNadpisu}>Očekávaná rada a gesce</H>
          <p className="mt-2 max-w-prose">{v.ocekavanaRada.poznamka}</p>
          <p className="popisek-uredni mt-1">
            Zdroj:{' '}
            {(() => {
              const zdroj = v.zdroje.find((x) => x.id === v.ocekavanaRada!.zdroj)!
              return (
                <a href={zdroj.url} className="underline" rel="noopener nofollow">
                  {zdroj.medium}, {datumCesky(zdroj.datum)}
                </a>
              )
            })()}
          </p>
          <div className="mt-3">
            <RadaPodleStran
              clenove={v.ocekavanaRada.clenove}
              nazev={(s) => nazevSubjektu(z, s)}
              nadpis={podnadpis}
            />
          </div>
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
            {rozlozeni.typ === 'jedina-kandidatka'
              ? 'Jiná kandidátka v zastupitelstvu není, takže se nemá s kým jednat. Doplníme zvolené vedení po ustavujícím zasedání.'
              : jeSledovane(z.slug)
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
