/**
 * Převod S-JTSK (Křovákovo zobrazení, EPSG:5514) na WGS84.
 *
 * Data ČÚZK — adresní místa i hranice volebních okrsků — jsou v S-JTSK.
 * Mapa na webu potřebuje zeměpisné souřadnice. Vlastní implementace podle
 * EPSG Guidance Note 7-2 místo závislosti na proj4: jde o pár desítek řádků
 * matematiky, které se nemění, a chceme je mít pokryté testem proti
 * referenčním bodům z geometrického serveru ČÚZK.
 *
 * EPSG:5514 má osy „East North" se zápornými hodnotami: x = −Y(JTSK),
 * y = −X(JTSK). Sestavy ČÚZK v CSV uvádějí kladné hodnoty JTSK; ty se před
 * převodem negují (viz `src/lib/ruian.ts`).
 *
 * Přesnost: Helmertova transformace mezi Besselovým elipsoidem a WGS84
 * (EPSG:1623) dává na území Prahy chybu do jednoho metru. Geometrický server
 * hl. m. Prahy používá hrubší tříparametrovou transformaci (EPSG:1622), která
 * je proti té naší posunutá asi o deset metrů — proto se referenční body
 * v testu berou z ČÚZK, ne z Prahy.
 */

const A_BESSEL = 6377397.155
const F_BESSEL = 1 / 299.1528128
const E2 = 2 * F_BESSEL - F_BESSEL * F_BESSEL
const E = Math.sqrt(E2)

const RAD = Math.PI / 180
/** Zeměpisná šířka počátku: 49°30′. */
const FI_C = 49.5 * RAD
/** Zeměpisná délka počátku od Greenwiche: 24°50′ (42°30′ od Ferra). */
const LAMBDA_0 = (24 + 50 / 60) * RAD
/** Azimut počáteční přímky: 30°17′17,3031″. */
const ALFA_C = (30 + 17 / 60 + 17.3031 / 3600) * RAD
/** Pseudo-standardní rovnoběžka: 78°30′. */
const FI_P = 78.5 * RAD
const K_P = 0.9999

const A_KONST = (A_BESSEL * Math.sqrt(1 - E2)) / (1 - E2 * Math.sin(FI_C) ** 2)
const B_KONST = Math.sqrt(1 + (E2 * Math.cos(FI_C) ** 4) / (1 - E2))
const GAMA_0 = Math.asin(Math.sin(FI_C) / B_KONST)
const T_0 =
  (Math.tan(Math.PI / 4 + GAMA_0 / 2) *
    ((1 + E * Math.sin(FI_C)) / (1 - E * Math.sin(FI_C))) ** ((E * B_KONST) / 2)) /
  Math.tan(Math.PI / 4 + FI_C / 2) ** B_KONST
const N_KONST = Math.sin(FI_P)
const R_0 = (K_P * A_KONST) / Math.tan(FI_P)

/**
 * Helmertova transformace S-JTSK → WGS84 (EPSG:1623). Posuny v metrech,
 * rotace v úhlových vteřinách, měřítko v ppm.
 *
 * Znaménková konvence rotací je Position Vector — tak parametry čte PROJ
 * (`+towgs84=570.8,85.7,462.8,4.998,1.587,5.261,3.56`) a tak je používá
 * i ČÚZK ve své prohlížecí službě nad RÚIAN, proti které je test. Opačná
 * konvence (Coordinate Frame) posune body o desítky metrů.
 */
const HELMERT = {
  dx: 570.8,
  dy: 85.7,
  dz: 462.8,
  rx: 4.998,
  ry: 1.587,
  rz: 5.261,
  ppm: 3.56,
}

const A_WGS = 6378137
const F_WGS = 1 / 298.257223563
const E2_WGS = 2 * F_WGS - F_WGS * F_WGS

export type Wgs84 = { lat: number; lon: number }

/** Inverzní Křovák: EPSG:5514 → zeměpisné souřadnice na Besselově elipsoidu. */
export function krovakNaBessel(x: number, y: number): Wgs84 {
  const jih = -y
  const zapad = -x
  const r = Math.sqrt(jih * jih + zapad * zapad)
  const theta = Math.atan2(zapad, jih)
  const d = theta / Math.sin(FI_P)
  const t = 2 * (Math.atan((R_0 / r) ** (1 / N_KONST) * Math.tan(Math.PI / 4 + FI_P / 2)) - Math.PI / 4)
  const u = Math.asin(Math.cos(ALFA_C) * Math.sin(t) - Math.sin(ALFA_C) * Math.cos(t) * Math.cos(d))
  const v = Math.asin((Math.cos(t) * Math.sin(d)) / Math.cos(u))

  let fi = u
  for (let i = 0; i < 10; i++) {
    const dalsi =
      2 *
      (Math.atan(
        T_0 ** (-1 / B_KONST) *
          Math.tan(u / 2 + Math.PI / 4) ** (1 / B_KONST) *
          ((1 + E * Math.sin(fi)) / (1 - E * Math.sin(fi))) ** (E / 2),
      ) -
        Math.PI / 4)
    if (Math.abs(dalsi - fi) < 1e-12) {
      fi = dalsi
      break
    }
    fi = dalsi
  }
  const lambda = LAMBDA_0 - v / B_KONST
  return { lat: fi / RAD, lon: lambda / RAD }
}

/** Zeměpisné souřadnice na Besselu → WGS84 přes geocentrické XYZ a Helmerta. */
export function besselNaWgs84(bod: Wgs84): Wgs84 {
  const fi = bod.lat * RAD
  const la = bod.lon * RAD
  const nB = A_BESSEL / Math.sqrt(1 - E2 * Math.sin(fi) ** 2)
  const x0 = nB * Math.cos(fi) * Math.cos(la)
  const y0 = nB * Math.cos(fi) * Math.sin(la)
  const z0 = nB * (1 - E2) * Math.sin(fi)

  const s = 1 + HELMERT.ppm * 1e-6
  const rx = (HELMERT.rx / 3600) * RAD
  const ry = (HELMERT.ry / 3600) * RAD
  const rz = (HELMERT.rz / 3600) * RAD
  const x1 = HELMERT.dx + s * (x0 - rz * y0 + ry * z0)
  const y1 = HELMERT.dy + s * (rz * x0 + y0 - rx * z0)
  const z1 = HELMERT.dz + s * (-ry * x0 + rx * y0 + z0)

  const p = Math.sqrt(x1 * x1 + y1 * y1)
  let lat = Math.atan2(z1, p * (1 - E2_WGS))
  for (let i = 0; i < 10; i++) {
    const nW = A_WGS / Math.sqrt(1 - E2_WGS * Math.sin(lat) ** 2)
    const dalsi = Math.atan2(z1 + E2_WGS * nW * Math.sin(lat), p)
    if (Math.abs(dalsi - lat) < 1e-13) {
      lat = dalsi
      break
    }
    lat = dalsi
  }
  return { lat: lat / RAD, lon: Math.atan2(y1, x1) / RAD }
}

/** EPSG:5514 (záporné hodnoty) → WGS84. */
export function sjtskNaWgs84(x: number, y: number): Wgs84 {
  return besselNaWgs84(krovakNaBessel(x, y))
}

/** Zaokrouhlení na šest desetinných míst (asi 10 cm) — víc do JSONu nepatří. */
export function zaokrouhli(hodnota: number): number {
  return Math.round(hodnota * 1e6) / 1e6
}
