import type { Preklad } from './typy'
import { ZDROJE_MISTNOSTI_CESKY } from './vyhledavacCesky'

/**
 * České texty widgetu „Moje volby".
 *
 * Stejný důvod jako u vyhledávače okrsku: widget obsluhuje českou titulní
 * stranu i cizojazyčné stránky, takže texty bere zvenčí a čeština je
 * slovník stejného tvaru jako překlady. Přidané pole v angličtině shodí
 * `tsc`, dokud ho nemá i čeština.
 *
 * Doslovné znění je totožné s tím, co na titulní straně stálo předtím,
 * až na dvě věci. Odkazy se přesunuly z prostředku vět na konec: uprostřed
 * věty se skládají ze tří kusů a v jazyce s jiným slovosledem z toho vznikne
 * nesmysl. A zvýraznění u nevoleného senátora nese celá věta místo dvou
 * slov, ze stejného důvodu.
 */
export const MOJE_VOLBY_CESKY: Preklad['mojeVolby'] = {
  tlacitko: 'Zjistit podle mojí polohy',
  neboAdresa: 'Nebo zadat adresu',
  hledani: {
    povoleni: 'Čekám na povolení polohy…',
    okrsek: 'Určuji okrsek…',
    hranice: 'Hledám v hranicích okrsků…',
  },

  odmitnuto: 'Bez povolení polohy to nejde, a je to v pořádku — okrsek najdete podle adresy.',
  odmitnutoOdkaz: 'Najít okrsek podle adresy',
  nepodporovano: 'Prohlížeč polohu neumí. Zkuste vyhledání podle adresy.',
  chyba: 'Polohu se nepodařilo určit. Zkuste to znovu, nebo zadejte adresu.',
  mimoPrahu:
    'Tahle poloha neleží v žádném pražském okrsku. Pokud jste teď mimo Prahu, zadejte adresu trvalého pobytu.',
  mimoPrahuOdkaz: 'Vyhledávání podle adresy',

  polohaLeziV: 'Vaše poloha leží v části',
  okrsekVeta:
    'Volební okrsek {okrsek}. Volí se tu jen podle trvalého pobytu — pokud bydlíte jinde, platí vaše adresa, ne tohle místo.',
  kandidatkyMC: 'Kandidátky do zastupitelstva vaší městské části',
  pocetStran: '({pocet} stran)',
  kandidatkyMagistrat: 'Kandidátky na magistrát (volí celá Praha)',

  senatNadpis: 'Senát',
  senatNevoliHlavni: 'Ve vaší části se letos senátor nevolí.',
  senatNevoliDoplnek: 'Senátní lístek nedostanete.',
  senatVoli: 'Volíte i senátora v obvodu č. {cislo} ({nazev}).',
  senatCastecne: 'Část území volí senátora v obvodu č. {cislo} ({nazev}): {popis}.',
  kandidatiSenatu: 'Kandidáti do Senátu',

  mistnostOkrsku: 'Volební místnost okrsku {okrsek}',
  odVasiPolohy: '{vzdalenost} od vaší polohy',
  mistnostNeznama:
    'Adresu místnosti pro tento okrsek zatím neznáme. Zveřejní ji úřední deska nejpozději 24. září 2026.',
  mapaAHledani: 'Mapa okrsku a hledání podle adresy',
  znovu: 'Zjistit znovu',

  jednotkaM: 'm',
  jednotkaKm: 'km',
  zdrojeMistnosti: ZDROJE_MISTNOSTI_CESKY,
}
