'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useState } from 'react'
import type { PrehledProPolohu } from '@/app/api/okrsky/prehled/route'
import type { InfoMestskeCasti } from '@/app/api/okrsky/[slug]/info/route'
import { bodVGeometrii, vzdalenostPriblizne, type Geometrie, type Pozice } from '@/lib/geometrie'
import { vzdalenostMetru } from '@/lib/geokodovani'
import { dosad } from '@/lib/sablony'
import type { Preklad } from '@/preklady'
import { LOCALE_CESKY } from '@/preklady/vyhledavacCesky'
import { MOJE_VOLBY_CESKY } from '@/preklady/mojeVolbyCesky'

/**
 * „Moje volby" na titulní straně: z polohy prohlížeče se určí okrsek a k němu
 * městská část, kandidátky, senátní obvod a volební místnost.
 *
 * Poloha se čte jen po kliknutí, zůstává v prohlížeči a nikam se neposílá —
 * stáhnou se jen statické soubory: středy okrsků, hranice jedné až tří
 * městských částí a informace o té nalezené. Bez povolení polohy je tu odkaz
 * na vyhledávání podle adresy.
 *
 * Texty a formát čísel bere zvenčí, aby tentýž widget obsloužil českou
 * titulní stranu i cizojazyčné stránky. Čeština je v `MOJE_VOLBY_CESKY`,
 * ve stejném tvaru jako překlady. Názvy městských částí, volebních
 * místností a senátních obvodů zůstávají české — jsou to jména míst.
 */

type Hranice = { features: { properties: { cislo: number; mestskaCast: string }; geometry: Geometrie }[] }

type Nalez = { okrsek: number; info: InfoMestskeCasti; poloha: Pozice }

type Stav =
  | { typ: 'klid' }
  | { typ: 'hleda'; krok: string }
  | { typ: 'nalezeno'; nalez: Nalez }
  | { typ: 'mimo-prahu' }
  | { typ: 'odmitnuto' }
  | { typ: 'nepodporovano' }
  | { typ: 'chyba' }

async function stahni<T>(url: string): Promise<T> {
  const o = await fetch(url)
  if (!o.ok) throw new Error(`${url}: ${o.status}`)
  return o.json() as Promise<T>
}

function ziskejPolohu(): Promise<Pozice> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve([p.coords.longitude, p.coords.latitude]),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  })
}

/**
 * Okrsek z polohy: seřadit městské části podle nejbližšího středu okrsku,
 * postupně stahovat jejich hranice a hledat polygon, ve kterém bod leží.
 * Tři části stačí i na trojmezí; dál je bod nejspíš mimo Prahu.
 */
async function najdiOkrsek(
  poloha: Pozice,
  hlaseni: (krok: string) => void,
  texty: Preklad['mojeVolby'],
): Promise<Nalez | null> {
  const prehled = await stahni<PrehledProPolohu>('/api/okrsky/prehled')
  const nejblizsi = new Map<string, number>()
  for (const [, mc, lon, lat] of prehled.okrsky) {
    const d = vzdalenostPriblizne(poloha, [lon, lat])
    if (d < (nejblizsi.get(mc) ?? Infinity)) nejblizsi.set(mc, d)
  }
  const kandidati = [...nejblizsi.entries()].sort((a, b) => a[1] - b[1]).slice(0, 3)
  if ((kandidati[0]?.[1] ?? Infinity) > 5000) return null

  for (const [mc] of kandidati) {
    hlaseni(texty.hledani.hranice)
    const hranice = await stahni<Hranice>(`/api/okrsky/${mc}/hranice`)
    const okrsek = hranice.features.find((f) => bodVGeometrii(poloha, f.geometry))
    if (okrsek) {
      const info = await stahni<InfoMestskeCasti>(`/api/okrsky/${mc}/info`)
      return { okrsek: okrsek.properties.cislo, info, poloha }
    }
  }
  return null
}

export function popisVzdalenosti(
  metru: number,
  texty: Preklad['mojeVolby'],
  locale: string,
): string {
  return metru < 1000
    ? `${Math.max(50, Math.round(metru / 50) * 50)} ${texty.jednotkaM}`
    : `${(Math.round(metru / 100) / 10).toLocaleString(locale)} ${texty.jednotkaKm}`
}

export function MojeVolby({
  texty = MOJE_VOLBY_CESKY,
  locale = LOCALE_CESKY,
  odkazNaAdresu = '/kde-volim',
}: {
  texty?: Preklad['mojeVolby']
  locale?: string
  /** Kam vede „zadat adresu". V cizojazyčné verzi na vlastní vyhledávač. */
  odkazNaAdresu?: Route
} = {}) {
  const [stav, setStav] = useState<Stav>({ typ: 'klid' })

  async function zjisti() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStav({ typ: 'nepodporovano' })
      return
    }
    setStav({ typ: 'hleda', krok: texty.hledani.povoleni })
    let poloha: Pozice
    try {
      poloha = await ziskejPolohu()
    } catch (e) {
      setStav({ typ: (e as GeolocationPositionError).code === 1 ? 'odmitnuto' : 'chyba' })
      return
    }
    try {
      setStav({ typ: 'hleda', krok: texty.hledani.okrsek })
      const nalez = await najdiOkrsek(poloha, (krok) => setStav({ typ: 'hleda', krok }), texty)
      setStav(nalez ? { typ: 'nalezeno', nalez } : { typ: 'mimo-prahu' })
    } catch {
      setStav({ typ: 'chyba' })
    }
  }

  return (
    <div>
      {stav.typ !== 'nalezeno' && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={() => void zjisti()}
            disabled={stav.typ === 'hleda'}
            className="border border-praha bg-praha px-5 py-2.5 font-display text-base font-semibold text-papir disabled:opacity-60"
          >
            {stav.typ === 'hleda' ? stav.krok : texty.tlacitko}
          </button>
          <Link href={odkazNaAdresu} className="odkaz-akcent">
            {texty.neboAdresa}
          </Link>
        </div>
      )}

      <div aria-live="polite" className="mt-4">
        {stav.typ === 'odmitnuto' && (
          <p className="max-w-prose">
            {texty.odmitnuto}{' '}
            <Link href={odkazNaAdresu} className="odkaz-akcent">
              {texty.odmitnutoOdkaz}
            </Link>
          </p>
        )}
        {stav.typ === 'nepodporovano' && <p className="max-w-prose">{texty.nepodporovano}</p>}
        {stav.typ === 'chyba' && <p className="max-w-prose">{texty.chyba}</p>}
        {stav.typ === 'mimo-prahu' && (
          <p className="max-w-prose">
            {texty.mimoPrahu}{' '}
            <Link href={odkazNaAdresu} className="odkaz-akcent">
              {texty.mimoPrahuOdkaz}
            </Link>
          </p>
        )}
        {stav.typ === 'nalezeno' && (
          <Vysledek
            nalez={stav.nalez}
            znovu={() => setStav({ typ: 'klid' })}
            texty={texty}
            locale={locale}
            odkazNaAdresu={odkazNaAdresu}
          />
        )}
      </div>
    </div>
  )
}

function Vysledek({
  nalez,
  znovu,
  texty,
  locale,
  odkazNaAdresu,
}: {
  nalez: Nalez
  znovu: () => void
  texty: Preklad['mojeVolby']
  locale: string
  odkazNaAdresu: Route
}) {
  const { okrsek, info, poloha } = nalez
  const mistnost = info.mistnosti[okrsek]
  const urlMC = `/mestska-cast/${info.mestskaCast}` as Route
  const vzdalenost = mistnost?.poloha
    ? vzdalenostMetru({ lat: poloha[1], lon: poloha[0] }, mistnost.poloha)
    : undefined

  return (
    <div className="grid gap-px border border-inkoust bg-linka-silna md:grid-cols-2">
      <div className="bg-papir p-5">
        <p className="popisek-uredni">{texty.polohaLeziV}</p>
        {/* Název městské části je jméno místa, ne text k překladu. */}
        <p className="mt-1 font-display text-2xl font-semibold" lang="cs">
          {info.nazev}
        </p>
        <p className="mt-1 text-sm">{dosad(texty.okrsekVeta, { okrsek })}</p>
        <p className="mt-3">
          <Link href={urlMC} className="odkaz-akcent" hrefLang="cs">
            {texty.kandidatkyMC}
            {info.pocetStran > 0 && ` ${dosad(texty.pocetStran, { pocet: info.pocetStran })}`}
          </Link>
        </p>
        <p className="mt-1">
          <Link href="/praha" className="odkaz-akcent" hrefLang="cs">
            {texty.kandidatkyMagistrat}
          </Link>
        </p>
      </div>

      <div className="bg-papir p-5">
        <p className="popisek-uredni">{texty.senatNadpis}</p>
        {info.senat.stav === 'nevoli' && (
          <p className="mt-1">
            {/* Zvýrazněná je celá věta, ne půlka: kolem <strong> uprostřed
                věty se nedá skládat text v jazyce s jiným slovosledem. */}
            <strong>{texty.senatNevoliHlavni}</strong> {texty.senatNevoliDoplnek}
          </p>
        )}
        {info.senat.stav !== 'nevoli' && (
          <p className="mt-1">
            {dosad(
              info.senat.stav === 'voli' ? texty.senatVoli : texty.senatCastecne,
              {
                cislo: info.senat.cislo,
                nazev: info.senat.nazev,
                popis: info.senat.stav === 'castecne' ? info.senat.popis : '',
              },
            )}{' '}
            <Link href={`/senat/${info.senat.slug}` as Route} className="odkaz-akcent" hrefLang="cs">
              {texty.kandidatiSenatu}
            </Link>
          </p>
        )}
      </div>

      <div className="bg-papir p-5 md:col-span-2">
        <p className="popisek-uredni">{dosad(texty.mistnostOkrsku, { okrsek })}</p>
        {mistnost ? (
          <>
            <p className="mt-1" lang="cs">
              <strong>{mistnost.nazev}</strong>
              {mistnost.adresa !== mistnost.nazev && <>, {mistnost.adresa}</>}
              {vzdalenost !== undefined && (
                <span className="text-sm" lang={undefined}>
                  {' · '}
                  {dosad(texty.odVasiPolohy, {
                    vzdalenost: popisVzdalenosti(vzdalenost, texty, locale),
                  })}
                </span>
              )}
            </p>
            <p className="popisek-uredni mt-2">{texty.zdrojeMistnosti[mistnost.zdroj.typ]}</p>
          </>
        ) : (
          <p className="mt-1 max-w-prose">{texty.mistnostNeznama}</p>
        )}
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link href={odkazNaAdresu} className="odkaz-akcent">
            {texty.mapaAHledani}
          </Link>
          <button type="button" onClick={znovu} className="odkaz-akcent">
            {texty.znovu}
          </button>
        </p>
      </div>
    </div>
  )
}
