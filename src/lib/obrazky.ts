/**
 * Rozměry obrázku z hlavičky souboru.
 *
 * Bez knihovny schválně: kvůli jedinému skriptu se do projektu netahá další
 * závislost. Rozměry jsou ve schématu zprávičky povinné — bez nich si
 * prohlížeč nerezervuje místo a stránka při načtení podskočí.
 *
 * Formáty jsou ty, které dávají na webu smysl. Na cokoli jiného vrací null
 * a volající to musí ošetřit; hádat rozměry je horší než je neznat.
 */
export type Rozmery = { sirka: number; vyska: number }

export function rozmery(data: Buffer): Rozmery | null {
  // PNG: signatura + IHDR na pevné pozici.
  if (data.length > 24 && data.toString('hex', 0, 8) === '89504e470d0a1a0a') {
    return { sirka: data.readUInt32BE(16), vyska: data.readUInt32BE(20) }
  }

  // GIF: rozměry v hlavičce, little-endian.
  if (data.length > 10 && data.toString('ascii', 0, 3) === 'GIF') {
    return { sirka: data.readUInt16LE(6), vyska: data.readUInt16LE(8) }
  }

  // WebP: kontejner RIFF, tři různé varianty bloku.
  if (
    data.length > 30 &&
    data.toString('ascii', 0, 4) === 'RIFF' &&
    data.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const typ = data.toString('ascii', 12, 16)
    if (typ === 'VP8 ') {
      return { sirka: data.readUInt16LE(26) & 0x3fff, vyska: data.readUInt16LE(28) & 0x3fff }
    }
    if (typ === 'VP8L') {
      const bity = data.readUInt32LE(21)
      return { sirka: (bity & 0x3fff) + 1, vyska: ((bity >> 14) & 0x3fff) + 1 }
    }
    if (typ === 'VP8X') {
      const cti24 = (od: number) => data[od]! | (data[od + 1]! << 8) | (data[od + 2]! << 16)
      return { sirka: cti24(24) + 1, vyska: cti24(27) + 1 }
    }
  }

  // JPEG: projít značky až k SOF, kde jsou rozměry uložené.
  //
  // Klíčové je nepřeskakovat naslepo. Podle ITU T.81 smí před značkou stát
  // libovolný počet výplňových bajtů 0xFF a existují značky bez užitečné
  // zátěže, u kterých se délka nečte. Kdyby se procházení rozsynchronizovalo
  // a hledalo další 0xFF po bajtech, mohlo by přijmout SOF z EXIF náhledu
  // uvnitř APP1 — a skript by pak tvrdil, že fotka 3000×2000 má 160×120.
  // Při jakémkoli nesouladu proto raději vrátíme null než odhad.
  if (data.length > 4 && data.readUInt16BE(0) === 0xffd8) {
    let pozice = 2
    while (pozice + 1 < data.length) {
      if (data[pozice] !== 0xff) return null
      const znacka = data[pozice + 1]!

      // Výplňový bajt před značkou.
      if (znacka === 0xff) {
        pozice++
        continue
      }
      // Značky bez zátěže: TEM a restartovací značky.
      if (znacka === 0x01 || (znacka >= 0xd0 && znacka <= 0xd7)) {
        pozice += 2
        continue
      }
      // Konec obrázku nebo začátek komprimovaných dat — dál už rozměry nejsou.
      if (znacka === 0xd9 || znacka === 0xda) return null

      if (pozice + 4 > data.length) return null
      const delka = data.readUInt16BE(pozice + 2)
      if (delka < 2 || pozice + 2 + delka > data.length) return null

      // SOF0–SOF15 kromě DHT (c4), JPGA (c8) a DAC (cc) — ty rozměry nenesou.
      if (znacka >= 0xc0 && znacka <= 0xcf && znacka !== 0xc4 && znacka !== 0xc8 && znacka !== 0xcc) {
        if (delka < 7) return null
        // Pořadí v SOF je výška, teprve pak šířka. Prohození by prošlo jen
        // u čtvercových obrázků a všechny ostatní by měly převrácený poměr.
        return { sirka: data.readUInt16BE(pozice + 7), vyska: data.readUInt16BE(pozice + 5) }
      }

      pozice += 2 + delka
    }
    return null
  }

  // SVG: rozměry z kořenového elementu. Bez nich by skript nahrál soubor,
  // ke kterému schéma zprávičky vyžaduje rozměry, a redaktor by je neměl
  // odkud vzít.
  const zacatekSvg = data.subarray(0, 2048).toString('utf8')
  if (zacatekSvg.includes('<svg')) {
    const atribut = (nazev: string) => {
      const shoda = zacatekSvg.match(new RegExp(`\\b${nazev}\\s*=\\s*["']([\\d.]+)(px)?["']`, 'i'))
      return shoda?.[1] ? Math.round(Number(shoda[1])) : null
    }
    const sirka = atribut('width')
    const vyska = atribut('height')
    if (sirka && vyska) return { sirka, vyska }

    const viewBox = zacatekSvg.match(/\bviewBox\s*=\s*["']\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
    if (viewBox?.[1] && viewBox[2]) {
      return { sirka: Math.round(Number(viewBox[1])), vyska: Math.round(Number(viewBox[2])) }
    }
    return null
  }

  return null
}
