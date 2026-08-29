import { describe, expect, it } from 'vitest'
import { rozmery } from '../src/lib/obrazky'

/**
 * Rozměry se čtou ručně z hlavičky, takže se posun o jeden bajt nikde
 * neprojeví chybou — jen tichým nesmyslným číslem, které skončí ve
 * frontmatteru zprávičky a rozhodí rozvržení stránky. Proto tenhle test.
 */

function png(sirka: number, vyska: number): Buffer {
  const b = Buffer.alloc(30)
  Buffer.from('89504e470d0a1a0a', 'hex').copy(b, 0)
  b.write('IHDR', 12, 'ascii')
  b.writeUInt32BE(sirka, 16)
  b.writeUInt32BE(vyska, 20)
  return b
}

function gif(sirka: number, vyska: number): Buffer {
  const b = Buffer.alloc(20)
  b.write('GIF89a', 0, 'ascii')
  b.writeUInt16LE(sirka, 6)
  b.writeUInt16LE(vyska, 8)
  return b
}

/** Minimální JPEG: SOI, jeden APP0 segment a SOF0 s rozměry. */
function jpeg(sirka: number, vyska: number, znacka = 0xc0): Buffer {
  // Značka (2 B) + délka, která se podle T.81 počítá včetně sebe sama.
  const app0 = Buffer.alloc(2 + 12)
  app0.writeUInt16BE(0xffe0, 0)
  app0.writeUInt16BE(12, 2)
  const sof = Buffer.alloc(11)
  sof.writeUInt16BE(0xff00 | znacka, 0)
  sof.writeUInt16BE(9, 2)
  sof.writeUInt8(8, 4)
  sof.writeUInt16BE(vyska, 5)
  sof.writeUInt16BE(sirka, 7)
  // Za SOF následují reálná data; parser se k nim nedostane, protože rozměry
  // přečte dřív. Zakončení značkou SOS drží soubor tvarem blízko skutečnosti.
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof, Buffer.from([0xff, 0xda])])
}

function webpVP8X(sirka: number, vyska: number): Buffer {
  const b = Buffer.alloc(40)
  b.write('RIFF', 0, 'ascii')
  b.write('WEBP', 8, 'ascii')
  b.write('VP8X', 12, 'ascii')
  const zapis24 = (od: number, hodnota: number) => {
    b[od] = hodnota & 0xff
    b[od + 1] = (hodnota >> 8) & 0xff
    b[od + 2] = (hodnota >> 16) & 0xff
  }
  zapis24(24, sirka - 1)
  zapis24(27, vyska - 1)
  return b
}

describe('rozměry obrázku z hlavičky', () => {
  it.each([
    ['PNG', png(1600, 900)],
    ['GIF', gif(1600, 900)],
    ['JPEG (SOF0)', jpeg(1600, 900)],
    ['JPEG (SOF2, progresivní)', jpeg(1600, 900, 0xc2)],
    ['WebP (VP8X)', webpVP8X(1600, 900)],
  ])('%s', (_nazev, data) => {
    expect(rozmery(data)).toEqual({ sirka: 1600, vyska: 900 })
  })

  it('u JPEG nezamění šířku s výškou', () => {
    // V SOF0 je pořadí výška, pak šířka — prohozením by prošel čtvercový
    // obrázek a všechny ostatní by měly převrácený poměr stran.
    expect(rozmery(jpeg(1920, 1080))).toEqual({ sirka: 1920, vyska: 1080 })
  })

  it('přeskočí segmenty, které rozměry nenesou', () => {
    // 0xC4 je Huffmanova tabulka, ne SOF — kdyby ji parser vzal jako SOF,
    // přečetl by rozměry z délky tabulky.
    const dht = Buffer.alloc(10)
    dht.writeUInt16BE(0xffc4, 0)
    dht.writeUInt16BE(8, 2)
    const s = jpeg(800, 600)
    expect(rozmery(Buffer.concat([s.subarray(0, 2), dht, s.subarray(2)]))).toEqual({
      sirka: 800,
      vyska: 600,
    })
  })

  it('výplňové bajty 0xFF před značkou nerozhodí procházení', () => {
    // T.81 B.1.1.2 je povoluje a některé enkodéry je vkládají. Kdyby se na
    // nich procházení rozsynchronizovalo, parser by mohl přijmout SOF
    // z EXIF náhledu a vypsat rozměry miniatury místo fotky.
    const s = jpeg(1600, 900)
    const sVyplni = Buffer.concat([s.subarray(0, 2), Buffer.from([0xff, 0xff]), s.subarray(2)])
    expect(rozmery(sVyplni)).toEqual({ sirka: 1600, vyska: 900 })
  })

  it('rozsynchronizovaný soubor vrátí null místo odhadu', () => {
    const s = jpeg(1600, 900)
    const rozbity = Buffer.concat([s.subarray(0, 2), Buffer.from([0x00, 0x00]), s.subarray(2)])
    expect(rozmery(rozbity)).toBeNull()
  })

  it('SVG čte rozměry z atributů i z viewBoxu', () => {
    expect(rozmery(Buffer.from('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">'))).toEqual({
      sirka: 800,
      vyska: 600,
    })
    expect(rozmery(Buffer.from('<svg viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">'))).toEqual({
      sirka: 1024,
      vyska: 768,
    })
    expect(rozmery(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull()
  })

  it.each([
    ['prázdný soubor', Buffer.alloc(0)],
    ['zkrácený JPEG', jpeg(800, 600).subarray(0, 8)],
    ['náhodná data', Buffer.alloc(5000, 0xff)],
    ['text', Buffer.from('tohle není obrázek')],
  ])('%s vrací null a nezacyklí se', (_nazev, data) => {
    expect(rozmery(data)).toBeNull()
  })
})
