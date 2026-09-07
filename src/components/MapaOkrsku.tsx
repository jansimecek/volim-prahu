'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import type { HraniceOkrsku } from '@/lib/okrsky'

/**
 * Mapa nalezeného okrsku: jeho hranice z RÚIAN zvýrazněná, ostatní okrsky
 * městské části slabě, bod adresy. Podklad jsou dlaždice OpenStreetMap.
 *
 * Leaflet i hranice se stahují až tady, po zobrazení výsledku — kdo mapu
 * nepotřebuje, nestáhne nic. Dlaždice jdou z cizího serveru, což zásady
 * ochrany údajů říkají výslovně.
 */

type Props = {
  mestskaCast: string
  okrsek: number
  poloha: { lat: number; lon: number }
  popisAdresy: string
  /** Volební místnost, pokud známe její polohu. */
  mistnost?: { nazev: string; poloha: { lat: number; lon: number } }
}

const cacheHranic = new Map<string, Promise<HraniceOkrsku>>()

function nactiHranice(slug: string): Promise<HraniceOkrsku> {
  let slib = cacheHranic.get(slug)
  if (!slib) {
    slib = fetch(`/api/okrsky/${slug}/hranice`).then((o) => {
      if (!o.ok) throw new Error(`Hranice ${slug}: ${o.status}`)
      return o.json() as Promise<HraniceOkrsku>
    })
    cacheHranic.set(slug, slib)
  }
  return slib
}

/** Barvy z design tokenů, aby mapa nesla stejný inkoust a červeň jako zbytek webu. */
function barva(promenna: string, zaloha: string): string {
  if (typeof document === 'undefined') return zaloha
  return getComputedStyle(document.documentElement).getPropertyValue(promenna).trim() || zaloha
}

export function MapaOkrsku({ mestskaCast, okrsek, poloha, popisAdresy, mistnost }: Props) {
  const kontejner = useRef<HTMLDivElement>(null)
  const [stav, setStav] = useState<'nacita' | 'hotovo' | 'chyba'>('nacita')

  useEffect(() => {
    let zruseno = false
    let mapa: import('leaflet').Map | undefined

    async function vykresli() {
      try {
        const [L, hranice] = await Promise.all([import('leaflet'), nactiHranice(mestskaCast)])
        if (zruseno || !kontejner.current) return

        const praha = barva('--color-praha', '#c8102e')
        const inkoust = barva('--color-inkoust', '#1a1a1a')

        // Leaflet potřebuje výchozí pohled dřív, než se přidají vektorové vrstvy.
        mapa = L.map(kontejner.current, { scrollWheelZoom: false, attributionControl: true }).setView(
          [poloha.lat, poloha.lon],
          16,
        )
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; přispěvatelé <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapa)

        const ostatni = L.geoJSON(
          { ...hranice, features: hranice.features.filter((f) => f.properties.cislo !== okrsek) } as GeoJSON.FeatureCollection,
          {
            style: { color: inkoust, weight: 1, opacity: 0.35, fillOpacity: 0.03 },
            onEachFeature: (f, vrstva) =>
              vrstva.bindTooltip(String((f.properties as { cislo: number }).cislo), {
                permanent: false,
                direction: 'center',
                className: 'popisek-uredni',
              }),
          },
        ).addTo(mapa)

        const nalezeny = hranice.features.find((f) => f.properties.cislo === okrsek)
        const vrstvaOkrsku = nalezeny
          ? L.geoJSON(nalezeny as GeoJSON.Feature, {
              style: { color: praha, weight: 2.5, fillColor: praha, fillOpacity: 0.12 },
            }).addTo(mapa)
          : undefined

        L.circleMarker([poloha.lat, poloha.lon], {
          radius: 7,
          color: inkoust,
          weight: 2,
          fillColor: '#ffffff',
          fillOpacity: 1,
        })
          .bindTooltip(popisAdresy, { direction: 'top', offset: [0, -8] })
          .addTo(mapa)

        if (mistnost) {
          // Volební místnost: plný červený čtverec, aby se lišila od kulatého bodu adresy.
          L.marker([mistnost.poloha.lat, mistnost.poloha.lon], {
            icon: L.divIcon({
              className: '',
              html: `<span style="display:block;width:16px;height:16px;background:${praha};border:2px solid #fff;box-shadow:0 0 0 1px ${inkoust}"></span>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            }),
            alt: `Volební místnost: ${mistnost.nazev}`,
          })
            .bindTooltip(`Volební místnost: ${mistnost.nazev}`, { direction: 'top', offset: [0, -10] })
            .addTo(mapa)
        }

        const rozsah = vrstvaOkrsku?.getBounds() ?? ostatni.getBounds()
        rozsah.extend([poloha.lat, poloha.lon])
        if (mistnost) rozsah.extend([mistnost.poloha.lat, mistnost.poloha.lon])
        if (rozsah.isValid()) mapa.fitBounds(rozsah.pad(0.15))

        setStav('hotovo')
      } catch (chyba) {
        console.error('Mapa okrsku se nepodařila vykreslit:', chyba)
        if (!zruseno) setStav('chyba')
      }
    }

    void vykresli()
    return () => {
      zruseno = true
      mapa?.remove()
    }
  }, [mestskaCast, okrsek, poloha.lat, poloha.lon, popisAdresy, mistnost])

  const odkazOsm = `https://www.openstreetmap.org/?mlat=${poloha.lat}&mlon=${poloha.lon}#map=17/${poloha.lat}/${poloha.lon}`

  return (
    <div className="mt-4">
      <div
        ref={kontejner}
        role="region"
        aria-label={`Mapa volebního okrsku ${okrsek}`}
        className="h-80 w-full border border-inkoust bg-papir-tmavsi"
      />
      {stav === 'chyba' && (
        <p className="mt-2 text-sm">Mapu se nepodařilo načíst. Polohu adresy otevře odkaz pod mapou.</p>
      )}
      <p className="popisek-uredni mt-2">
        {stav === 'nacita' ? 'Načítám mapu… · ' : ''}
        Červeně hranice okrsku {okrsek} podle RÚIAN, bílý bod je vaše adresa
        {mistnost ? ', červený čtverec volební místnost' : ''} ·{' '}
        <a href={odkazOsm} className="odkaz-akcent" rel="noopener">
          otevřít v OpenStreetMap
        </a>
      </p>
    </div>
  )
}
