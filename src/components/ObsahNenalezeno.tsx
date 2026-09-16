import Link from 'next/link'

/**
 * Obsah stránky 404.
 *
 * Profily kandidátů se generují na vyžádání a je jich přes sedm tisíc —
 * překlep v adrese nebo zastaralý odkaz z vyhledávače je tady běžný stav,
 * ne výjimka. Výchozí obrazovka Nextu je anglicky a bez cesty dál.
 *
 * Proč komponenta a ne rovnou stránka: web má dva kořenové layouty
 * (`(cesky)` a `(mezinarodni)`), a Next v takovém případě nevykresluje
 * `app/not-found.tsx` uvnitř žádného z nich — stránka si musí přinést
 * vlastní `<html>`. Zároveň má smysl mít 404 i uvnitř české sekce, kde
 * layout existuje. Obsah je proto na jednom místě a obě stránky ho jen
 * zarámují.
 */
export function ObsahNenalezeno() {
  return (
    <div className="max-w-prose space-y-6">
      <p className="popisek-uredni">Chyba 404</p>
      <h1 className="text-4xl">Tuhle stránku nemáme</h1>
      <p>
        Adresa neexistuje, nebo se změnila. Nejčastěji se to stává u profilů kandidátů —
        těch je přes sedm tisíc a jejich adresy se odvozují ze jména, příjmení a bydliště
        podle otevřených dat ČSÚ.
      </p>
      <ul className="space-y-2">
        <li>
          <Link href="/hledani" className="odkaz-akcent">
            Vyhledávání
          </Link>{' '}
          — najde kandidáta, volební stranu i městskou část podle jména.
        </li>
        <li>
          <Link href="/praha" className="odkaz-akcent">
            Magistrát
          </Link>{' '}
          — 24 kandidátek do zastupitelstva hlavního města.
        </li>
        <li>
          <Link href="/mestska-cast" className="odkaz-akcent">
            Městské části
          </Link>{' '}
          — 57 samostatných zastupitelstev.
        </li>
        <li>
          <Link href="/aktualne" className="odkaz-akcent">
            Aktuálně
          </Link>{' '}
          — co je kolem voleb nového.
        </li>
        <li>
          <Link href="/" className="odkaz-akcent">
            Titulní strana
          </Link>
        </li>
      </ul>
    </div>
  )
}
