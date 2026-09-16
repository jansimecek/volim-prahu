import { ImageResponse } from 'next/og'

/**
 * Náhledový obrázek pro sdílení, společný pro všechny jazykové verze.
 *
 * Kreslí se za běhu z textu, aby se nemusel udržovat soubor; barvy jsou
 * design tokeny webu (papír, inkoust, pražská červená). Od chvíle, kdy má
 * web víc kořenových layoutů, potřebuje `opengraph-image` každá skupina
 * zvlášť — kresba je proto tady a soubory v `app/` jsou jen tenké obaly.
 */
export const VELIKOST = { width: 1200, height: 630 }
export const TYP_OBSAHU = 'image/png'

export function nahledovyObrazek({
  nadpisek,
  nazev,
  podtitul,
}: {
  nadpisek: string
  nazev: string
  podtitul: string
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
            fontSize: 28,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#5f6469',
          }}
        >
          {nadpisek}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 108, fontWeight: 700, lineHeight: 1 }}>{nazev}</div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 40, lineHeight: 1.25, maxWidth: 1000 }}>
            {podtitul}
          </div>
        </div>
        <div style={{ display: 'flex', height: 14, width: 220, background: '#c8102e' }} />
      </div>
    ),
    VELIKOST,
  )
}
