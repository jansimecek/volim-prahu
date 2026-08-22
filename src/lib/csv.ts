/**
 * Minimalistický CSV parser pro otevřená data ČSÚ (varianta `csv_od`: UTF-8, čárka,
 * textová pole v uvozovkách). Vlastní implementace místo závislosti — formát je
 * stabilní a chceme ho mít pokrytý testem, ne důvěřovat cizí konfiguraci.
 */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const vstup = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text // BOM
  const radky: string[][] = []
  let pole: string[] = []
  let bunka = ''
  let vUvozovkach = false

  for (let i = 0; i < vstup.length; i++) {
    const znak = vstup[i]!

    if (vUvozovkach) {
      if (znak === '"') {
        if (vstup[i + 1] === '"') {
          bunka += '"'
          i++
        } else {
          vUvozovkach = false
        }
      } else {
        bunka += znak
      }
      continue
    }

    if (znak === '"') {
      vUvozovkach = true
    } else if (znak === delimiter) {
      pole.push(bunka)
      bunka = ''
    } else if (znak === '\n' || znak === '\r') {
      if (znak === '\r' && vstup[i + 1] === '\n') i++
      pole.push(bunka)
      radky.push(pole)
      pole = []
      bunka = ''
    } else {
      bunka += znak
    }
  }

  if (bunka !== '' || pole.length > 0) {
    pole.push(bunka)
    radky.push(pole)
  }

  return radky
}

/** Řádky jako objekty podle hlavičky. Chybějící buňky jsou prázdný řetězec. */
export function parseCsvObjects(
  text: string,
  delimiter = ',',
): Record<string, string>[] {
  const [hlavicka, ...telo] = parseCsv(text, delimiter)
  if (!hlavicka) return []
  return telo
    .filter((radek) => radek.length > 1 || (radek[0] ?? '') !== '')
    .map((radek) => {
      const zaznam: Record<string, string> = {}
      hlavicka.forEach((klic, i) => {
        zaznam[klic] = radek[i] ?? ''
      })
      return zaznam
    })
}
