'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useState } from 'react'
import type { PrehledProPolohu } from '@/app/api/okrsky/prehled/route'
import type { InfoMestskeCasti } from '@/app/api/okrsky/[slug]/info/route'
import { bodVGeometrii, vzdalenostPriblizne, type Geometrie, type Pozice } from '@/lib/geometrie'
import { POPIS_ZDROJE } from '@/lib/mistnostiTypy'
import { vzdalenostMetru } from '@/lib/geokodovani'

/**
 * „Moje volby" na titulní straně: z polohy prohlížeče se určí okrsek a k němu
 * městská část, kandidátky, senátní obvod a volební místnost.
 *
 * Poloha se čte jen po kliknutí, zůstává v prohlížeči a nikam se neposílá —
 * stáhnou se jen statické soubory: středy okrsků, hranice jedné až tří
 * městských částí a informace o té nalezené. Bez povolení polohy je tu odkaz
 * na vyhledávání podle adresy.
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
async function najdiOkrsek(poloha: Pozice, hlaseni: (krok: string) => void): Promise<Nalez | null> {
  const prehled = await stahni<PrehledProPolohu>('/api/okrsky/prehled')
  const nejblizsi = new Map<string, number>()
  for (const [, mc, lon, lat] of prehled.okrsky) {
    const d = vzdalenostPriblizne(poloha, [lon, lat])
    if (d < (nejblizsi.get(mc) ?? Infinity)) nejblizsi.set(mc, d)
  }
  const kandidati = [...nejblizsi.entries()].sort((a, b) => a[1] - b[1]).slice(0, 3)
  if ((kandidati[0]?.[1] ?? Infinity) > 5000) return null

  for (const [mc] of kandidati) {
    hlaseni(`Hledám v hranicích okrsků…`)
    const hranice = await stahni<Hranice>(`/api/okrsky/${mc}/hranice`)
    const okrsek = hranice.features.find((f) => bodVGeometrii(poloha, f.geometry))
    if (okrsek) {
      const info = await stahni<InfoMestskeCasti>(`/api/okrsky/${mc}/info`)
      return { okrsek: okrsek.properties.cislo, info, poloha }
    }
  }
  return null
}

function popisVzdalenosti(metru: number): string {
  if (metru < 1000) return `asi ${Math.max(50, Math.round(metru / 50) * 50)} m`
  return `asi ${(Math.round(metru / 100) / 10).toLocaleString('cs-CZ')} km`
}

export function MojeVolby() {
  const [stav, setStav] = useState<Stav>({ typ: 'klid' })

  async function zjisti() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStav({ typ: 'nepodporovano' })
      return
    }
    setStav({ typ: 'hleda', krok: 'Čekám na povolení polohy…' })
    let poloha: Pozice
    try {
      poloha = await ziskejPolohu()
    } catch (e) {
      setStav({ typ: (e as GeolocationPositionError).code === 1 ? 'odmitnuto' : 'chyba' })
      return
    }
    try {
      setStav({ typ: 'hleda', krok: 'Určuji okrsek…' })
      const nalez = await najdiOkrsek(poloha, (krok) => setStav({ typ: 'hleda', krok }))
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
            {stav.typ === 'hleda' ? stav.krok : 'Zjistit podle mojí polohy'}
          </button>
          <Link href="/kde-volim" className="odkaz-akcent">
            Nebo zadat adresu
          </Link>
        </div>
      )}

      <div aria-live="polite" className="mt-4">
        {stav.typ === 'odmitnuto' && (
          <p className="max-w-prose">
            Bez povolení polohy to nejde, a je to v pořádku — okrsek najdete{' '}
            <Link href="/kde-volim" className="odkaz-akcent">
              podle adresy
            </Link>
            .
          </p>
        )}
        {stav.typ === 'nepodporovano' && <p>Prohlížeč polohu neumí. Zkuste vyhledání podle adresy.</p>}
        {stav.typ === 'chyba' && <p>Polohu se nepodařilo určit. Zkuste to znovu, nebo zadejte adresu.</p>}
        {stav.typ === 'mimo-prahu' && (
          <p className="max-w-prose">
            Tahle poloha neleží v žádném pražském okrsku. Pokud jste teď mimo Prahu, zadejte
            adresu trvalého pobytu{' '}
            <Link href="/kde-volim" className="odkaz-akcent">
              ve vyhledávači
            </Link>
            .
          </p>
        )}
        {stav.typ === 'nalezeno' && <Vysledek nalez={stav.nalez} znovu={() => setStav({ typ: 'klid' })} />}
      </div>
    </div>
  )
}

function Vysledek({ nalez, znovu }: { nalez: Nalez; znovu: () => void }) {
  const { okrsek, info, poloha } = nalez
  const mistnost = info.mistnosti[okrsek]
  const urlMC = `/mestska-cast/${info.mestskaCast}` as Route
  const vzdalenost = mistnost?.poloha
    ? vzdalenostMetru({ lat: poloha[1], lon: poloha[0] }, mistnost.poloha)
    : undefined

  return (
    <div className="grid gap-px border border-inkoust bg-linka-silna md:grid-cols-2">
      <div className="bg-papir p-5">
        <p className="popisek-uredni">Vaše poloha leží v části</p>
        <p className="mt-1 font-display text-2xl font-semibold">{info.nazev}</p>
        <p className="mt-1 text-sm">
          Volební okrsek <span className="font-mono">{okrsek}</span>. Volí se tu jen podle
          trvalého pobytu — pokud bydlíte jinde, platí vaše adresa, ne tohle místo.
        </p>
        <p className="mt-3">
          <Link href={urlMC} className="odkaz-akcent">
            Kandidátky do zastupitelstva vaší městské části
            {info.pocetStran > 0 && ` (${info.pocetStran} stran)`}
          </Link>
        </p>
        <p className="mt-1">
          <Link href="/praha" className="odkaz-akcent">
            Kandidátky na magistrát (volí celá Praha)
          </Link>
        </p>
      </div>

      <div className="bg-papir p-5">
        <p className="popisek-uredni">Senát</p>
        {info.senat.stav === 'nevoli' && (
          <p className="mt-1">
            Ve vaší části se letos <strong>senátor nevolí</strong>. Senátní lístek nedostanete.
          </p>
        )}
        {info.senat.stav === 'voli' && (
          <p className="mt-1">
            Volíte i senátora v obvodu č. {info.senat.cislo} ({info.senat.nazev}).{' '}
            <Link href={`/senat/${info.senat.slug}` as Route} className="odkaz-akcent">
              Kandidáti do Senátu
            </Link>
          </p>
        )}
        {info.senat.stav === 'castecne' && (
          <p className="mt-1">
            Část území volí senátora v obvodu č. {info.senat.cislo} ({info.senat.nazev}):{' '}
            {info.senat.popis}.{' '}
            <Link href={`/senat/${info.senat.slug}` as Route} className="odkaz-akcent">
              Kandidáti do Senátu
            </Link>
          </p>
        )}
      </div>

      <div className="bg-papir p-5 md:col-span-2">
        <p className="popisek-uredni">Volební místnost okrsku {okrsek}</p>
        {mistnost ? (
          <>
            <p className="mt-1">
              <strong>{mistnost.nazev}</strong>
              {mistnost.adresa !== mistnost.nazev && <>, {mistnost.adresa}</>}
              {vzdalenost !== undefined && (
                <span className="text-sm"> · {popisVzdalenosti(vzdalenost)} od vaší polohy</span>
              )}
            </p>
            <p className="popisek-uredni mt-2">{POPIS_ZDROJE[mistnost.zdroj.typ]}</p>
          </>
        ) : (
          <p className="mt-1">
            Adresu místnosti pro tento okrsek zatím neznáme. Zveřejní ji úřední deska
            nejpozději 24. září 2026.
          </p>
        )}
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link href="/kde-volim" className="odkaz-akcent">
            Mapa okrsku a hledání podle adresy
          </Link>
          <button type="button" onClick={znovu} className="odkaz-akcent">
            Zjistit znovu
          </button>
        </p>
      </div>
    </div>
  )
}
