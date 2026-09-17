import type { Preklad } from './typy'

/**
 * České texty vyhledávače okrsku.
 *
 * Vyhledávač je jediná komponenta webu, kterou používá česká i cizojazyčná
 * verze. Aby nemusela existovat dvakrát, bere texty zvenčí — a čeština je
 * tady, ve stejném tvaru jako překlady, ne zadrátovaná v komponentě.
 * Typ `Preklad['vyhledavac']` zajistí, že když někdo přidá řetězec do
 * angličtiny, nezapomene ho ani tady: jinak neprojde `tsc`.
 *
 * Doslovné znění je totožné s tím, co na `/kde-volim` stálo předtím —
 * přesun do slovníku nic nepřepsal.
 */
/**
 * Odkud web zná adresu volební místnosti. Sdílené s widgetem podle polohy:
 * obojí zobrazuje tutéž místnost a dvě znění téhož by se rozešla.
 */
export const ZDROJE_MISTNOSTI_CESKY = {
  'oznameni-2026':
    'Podle dokumentu městské části k volbám 2026 — sídlo okrsku z úřední desky',
  'drivejsi-volby': 'Údaj z dřívějších voleb — do 24. 9. 2026 se může změnit',
  ruian: 'Poznámka městské části v registru RÚIAN — není to oznámení pro rok 2026',
}

export const VYHLEDAVAC_CESKY: Preklad['vyhledavac'] = {
  ulice: 'Ulice',
  ulicePlaceholder: 'například Partyzánská',
  cisloDomu: 'Číslo domu',
  cisloPlaceholder: '18/23',
  odeslat: 'Najít okrsek',
  napovedaCisla:
    'Číslo domu stačí orientační (ze štítku na domě) nebo popisné. Na diakritice nezáleží.',
  navrhyUlic: 'Návrhy ulic',
  vicekrat: '{pocet}× v Praze',

  indexChyba: 'Seznam ulic se nepodařilo načíst. Zkuste stránku obnovit.',
  hleda: 'Hledám…',
  chyba: 'Data se nepodařilo načíst. Zkuste to znovu.',
  uliceNenalezena:
    'Ulici {ulice} jsme v Praze nenašli. Zkuste ji vybrat z nabídky — název musí sedět celý. U adres bez ulice (Hradčany, Malá Strana) zadejte název části obce.',
  cisloNenalezeno:
    'Ulice {ulice} leží v části {casti}, ale číslo {cislo} v ní registr adres nezná. Zkuste druhé číslo z domovního štítku — na štítku bývá popisné i orientační.',
  viceAdres: 'Zadání odpovídá {pocet} adresám — vyberte tu svou podle celého čísla.',

  volebniOkrsek: 'Volební okrsek',
  bezbarierova: 'bezbariérová',
  zdroj: 'zdroj',
  mistnostNeznamaUvod: 'Adresu volební místnosti pro tento okrsek zatím neznáme. Zveřejní ji ',
  uredniDeska: 'úřední deska {mc}',
  mistnostNeznamaLhuta: ' nejpozději 24. září 2026.',

  naAdrese: 'Volební místnost je přímo na vaší adrese.',
  vzdusnouCarou: 'Vzdušnou čarou asi {vzdalenost} od vaší adresy.',
  jednotkaM: 'm',
  jednotkaKm: 'km',

  kdoKandiduje: 'Kdo kandiduje v části {mc}',
  registrAdres: 'registr adres ČÚZK k {datum}',

  zdrojeMistnosti: ZDROJE_MISTNOSTI_CESKY,

  mapa: {
    popisek: 'Mapa volebního okrsku {okrsek}',
    chyba: 'Mapu se nepodařilo načíst. Polohu adresy otevře odkaz pod mapou.',
    nacita: 'Načítám mapu… · ',
    legenda: 'Červeně hranice okrsku {okrsek} podle RÚIAN, bílý bod je vaše adresa',
    legendaMistnost: ', červený čtverec volební místnost',
    osm: 'otevřít v OpenStreetMap',
    autori: '&copy; přispěvatelé <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
}

/** Formát data a čísel pro českou verzi. */
export const LOCALE_CESKY = 'cs-CZ'
