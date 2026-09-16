import { ImageResponse } from 'next/og'

/**
 * Náhledová karta pro sdílení, společná pro všechny jazykové verze.
 *
 * Kreslí se za běhu z textu, aby se nemusel udržovat obrázek; barvy jsou
 * design tokeny webu (papír, inkoust, pražská červená). Od chvíle, kdy má
 * web víc kořenových layoutů, potřebuje `opengraph-image` každá skupina
 * zvlášť — kresba je proto tady a soubory v `app/` jsou jen tenké obaly.
 *
 * Na kartě vede **název stránky**, ne název webu. Odkaz se sdílí do
 * cizineckých skupin na sociálních sítích a rozhoduje, jestli na něj někdo
 * klikne; „Volím Prahu" nikomu nic neřekne, „Can you vote in Prague this
 * October?" ano. Název webu zůstává dole u červené linky jako podpis.
 *
 * Písmo se nenahrává vlastní: `ImageResponse` má záložní rodinu s cyrilicí
 * i s českou diakritikou a ověřeně je vykreslí. Stahovat Bricolage při
 * buildu by znamenalo síťový požadavek v nasazení kvůli jednomu obrázku —
 * a Bricolage stejně cyrilici nemá.
 */
export const VELIKOST = { width: 1200, height: 630 }
export const TYP_OBSAHU = 'image/png'

/**
 * Velikost titulku podle délky. Delší otázky musí zmenšit, jinak se
 * nevejdou na tři řádky a karta se ořízne. Meze jsou odměřené na
 * nejdelších titulcích, které web má.
 */
function velikostTitulku(delka: number): number {
  if (delka <= 20) return 104
  if (delka <= 34) return 88
  if (delka <= 52) return 72
  return 58
}

export function nahledovyObrazek({
  nadpisek,
  titulek,
  podtitul,
  znacka = 'Volím Prahu · volimprahu.cz',
}: {
  /** Řádek nahoře: druh voleb a termín. */
  nadpisek: string
  /** Hlavní sdělení karty — název stránky, ne název webu. */
  titulek: string
  /** Krátké doplnění pod titulkem. Vynechá se, když by kartu přeplnilo. */
  podtitul?: string
  znacka?: string
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#ecede9',
          color: '#161c24',
          fontFamily: 'Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#5f6469',
          }}
        >
          {nadpisek}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: velikostTitulku(titulek.length),
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -1,
              maxWidth: 1010,
            }}
          >
            {titulek}
          </div>
          {podtitul && (
            <div
              style={{
                display: 'flex',
                marginTop: 26,
                fontSize: 32,
                lineHeight: 1.3,
                color: '#5f6469',
                maxWidth: 960,
              }}
            >
              {podtitul}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', height: 14, width: 180, background: '#c8102e' }} />
          <div style={{ display: 'flex', fontSize: 24, letterSpacing: 2, color: '#5f6469' }}>
            {znacka}
          </div>
        </div>
      </div>
    ),
    VELIKOST,
  )
}
