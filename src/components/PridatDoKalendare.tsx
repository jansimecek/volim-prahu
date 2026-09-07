/**
 * Připomínka voleb do kalendáře. Soubor .ics v public/ má oba volební dny
 * a upozornění den předem; odkaz pro Google Kalendář je pro ty, kdo soubor
 * neotevřou (typicky Android). Žádný skript, žádná cizí služba kromě
 * samotného kalendáře, do kterého čtenář jde sám.
 */
const POPIS =
  'Volby do zastupitelstev městských částí a hl. m. Prahy, v části Prahy i do Senátu. ' +
  'Volí se jen v okrsku podle trvalého pobytu, voličský průkaz pro komunální volby neexistuje. ' +
  'Vezměte občanský průkaz nebo pas. Okrsek a místnost: https://volimprahu.cz/kde-volim'

const GOOGLE = new URL('https://calendar.google.com/calendar/render')
GOOGLE.searchParams.set('action', 'TEMPLATE')
GOOGLE.searchParams.set('text', 'Komunální a senátní volby 2026')
GOOGLE.searchParams.set('dates', '20261009T120000Z/20261010T120000Z')
GOOGLE.searchParams.set('details', POPIS)
GOOGLE.searchParams.set('location', 'Praha')

export function PridatDoKalendare() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href="/volby-2026.ics"
        download="volby-2026.ics"
        className="inline-block border border-praha px-4 py-2 text-praha no-underline"
      >
        Přidat do kalendáře (.ics)
      </a>
      <a href={GOOGLE.toString()} className="odkaz-akcent" rel="noopener">
        Google Kalendář
      </a>
      <span className="popisek-uredni">Připomene den předem</span>
    </div>
  )
}
