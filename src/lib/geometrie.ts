/**
 * Bod v polygonu pro určení okrsku z polohy. Čistá geometrie nad GeoJSON
 * ve WGS84; na velikosti okrsku (stovky metrů) je zanedbání zakřivení
 * Země bez významu.
 */
export type Pozice = [lon: number, lat: number]
export type Prstenec = Pozice[]
export type Geometrie =
  | { type: 'Polygon'; coordinates: Prstenec[] }
  | { type: 'MultiPolygon'; coordinates: Prstenec[][] }

/** Klasické „ray casting": lichý počet průsečíků polopřímky s hranicí = uvnitř. */
export function bodVPrstenci(bod: Pozice, prstenec: Prstenec): boolean {
  const [x, y] = bod
  let uvnitr = false
  for (let i = 0, j = prstenec.length - 1; i < prstenec.length; j = i++) {
    const [xi, yi] = prstenec[i]!
    const [xj, yj] = prstenec[j]!
    const protina = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (protina) uvnitr = !uvnitr
  }
  return uvnitr
}

/** První prstenec je vnější hranice, další jsou díry. */
function bodVPolygonu(bod: Pozice, prstence: Prstenec[]): boolean {
  const [vnejsi, ...diry] = prstence
  if (!vnejsi || !bodVPrstenci(bod, vnejsi)) return false
  return !diry.some((d) => bodVPrstenci(bod, d))
}

export function bodVGeometrii(bod: Pozice, geometrie: Geometrie): boolean {
  return geometrie.type === 'Polygon'
    ? bodVPolygonu(bod, geometrie.coordinates)
    : geometrie.coordinates.some((p) => bodVPolygonu(bod, p))
}

/** Přibližná vzdálenost v metrech pro řazení kandidátů; ne pro zobrazení. */
export function vzdalenostPriblizne(a: Pozice, b: Pozice): number {
  const dx = (a[0] - b[0]) * 111320 * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180))
  const dy = (a[1] - b[1]) * 111320
  return Math.sqrt(dx * dx + dy * dy)
}
