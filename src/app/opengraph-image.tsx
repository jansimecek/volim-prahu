import { ImageResponse } from 'next/og'

/**
 * Výchozí náhledový obrázek pro sdílení. Bez něj sociální sítě a chatovací
 * aplikace ukazují prázdnou kartu. Kreslí se za běhu z textu, aby se
 * nemusel udržovat soubor; barvy jsou design tokeny webu (papír, inkoust,
 * pražská červená).
 */
export const alt = 'Volím Prahu — volební průvodce pro komunální a senátní volby 9.–10. října 2026'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function ObrazekProSdileni() {
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
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 4, textTransform: 'uppercase', color: '#5f6469' }}>
          Komunální a senátní volby · 9.–10. října 2026
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 108, fontWeight: 700, lineHeight: 1 }}>Volím Prahu</div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 40, lineHeight: 1.25, maxWidth: 1000 }}>
            Kdo kandiduje, co slibuje — a co z toho jeho úroveň samosprávy vůbec může splnit.
          </div>
        </div>
        <div style={{ display: 'flex', height: 14, width: 220, background: '#c8102e' }} />
      </div>
    ),
    size,
  )
}
