import type { Metadata } from 'next'
import Link from 'next/link'
import { StrukturovanaData } from '@/components/StrukturovanaData'
import { sPoctem } from '@/lib/cestina'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { OBVODY, pocetDotcenychMC, senatniStavMestskeCasti } from '@/lib/senat'
import { nazevStranySenat } from '@/lib/senatKandidati'
import { vysledekDruhehoKola } from '@/lib/senatVysledky'
import { absolutni } from '@/lib/web'

export const metadata: Metadata = {
  title: 'Senátní volby v Praze 2026: zvolení senátoři',
  description:
    'Výsledky senátních voleb 2026 v Praze: Jiří Padevět (Praha 1), Václav Láska (Praha 5) a David Smoljak (Praha 9) vyhráli druhé kolo 16.–17. října. Výsledky obou kol a účast.',
}

const procenta = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function StrankaSenatu() {
  const nevoli = MESTSKE_CASTI.filter((mc) => senatniStavMestskeCasti(mc.slug).stav === 'nevoli')

  return (
    <div className="space-y-12">
      <StrukturovanaData
        data={{
          '@type': 'Event',
          name: 'Druhé kolo senátních voleb v Praze 2026',
          description: 'Druhé kolo voleb do Senátu v obvodech č. 21 Praha 5, č. 24 Praha 9 a č. 27 Praha 1.',
          startDate: '2026-10-16T14:00:00+02:00',
          endDate: '2026-10-17T14:00:00+02:00',
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: { '@type': 'City', name: 'Praha' },
          url: absolutni('/senat'),
        }}
      />

      <header className="max-w-prose">
        <p className="popisek-uredni">Volby do Senátu 2026</p>
        <h1 className="mt-2 text-4xl">Zvolení senátoři za Prahu</h1>
        <p className="mt-4">
          V prvním kole 9.–10. října nikdo v žádném ze tří pražských obvodů nezískal nadpoloviční
          většinu. Rozhodlo proto druhé kolo 16.–17. října mezi dvěma nejúspěšnějšími kandidáty
          v každém obvodu. Dva senátoři mandát obhájili, v Praze 1 nastupuje nový.
        </p>
      </header>

      <section aria-labelledby="zvoleni">
        <h2 id="zvoleni" className="text-2xl">
          Výsledky druhého kola
        </h2>
        <ul className="mt-5 grid gap-px border border-inkoust bg-linka-silna lg:grid-cols-3">
          {OBVODY.map((obvod) => {
            const v = vysledekDruhehoKola(obvod.cislo)
            return (
              <li key={obvod.slug} className="bg-papir">
                <Link href={`/senat/${obvod.slug}`} className="group block h-full p-4 no-underline hover:bg-papir-tmavsi sm:p-5">
                  <span className="popisek-uredni">Obvod č. {obvod.cislo}</span>
                  <span className="mt-1 block font-display text-xl font-semibold group-hover:underline">
                    {obvod.nazev}
                  </span>
                  {v ? (
                    <span className="mt-3 block space-y-2">
                      {[v.zvoleny, v.souper].map((r) => (
                        <span key={r.cislo} className="block">
                          <span className={`block ${r.zvolen ? 'font-medium' : ''}`}>
                            {r.celeJmeno}
                            {r.zvolen && <span className="popisek-uredni ml-2 text-praha">zvolen</span>}
                          </span>
                          <span className="block text-sm">
                            {nazevStranySenat(r.kandidat?.volebniStrana ?? r.navrhujici)} ·{' '}
                            <span className="font-mono">{procenta.format(r.procenta)} %</span>
                          </span>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="mt-3 block text-sm">Výsledek druhého kola zatím není sečtený.</span>
                  )}
                  {v && (
                    <span className="popisek-uredni mt-3 block">
                      účast ve 2. kole {procenta.format(v.kolo.ucastProcenta)} %
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-seda-uredni">
          Účast ve druhém kole byla zhruba poloviční než v prvním, kdy se volilo souběžně se
          zastupitelstvy. Celé výsledky obou kol jsou na stránce každého obvodu.
        </p>
      </section>

      <section aria-labelledby="novy-senat" className="max-w-prose">
        <h2 id="novy-senat" className="text-2xl">
          Nový Senát a jeho předseda
        </h2>
        <p className="mt-3">
          V celé republice se volilo 27 z 81 senátorů. Nejvíc mandátů získalo hnutí STAN, deset ze čtrnácti
          kandidátů, ODS sedm (obhajovala pět) a KDU-ČSL obhájila všechny tři. Vládní ANO neprosadilo ani jednoho
          ze třinácti kandidátů ve druhém kole a Piráti přišli o jedinou senátorku. Nejsilnějším klubem zůstává
          společný klub ODS a TOP 09; jeho předseda Zdeněk Nytra 20. října potvrdil, že zůstane společný. Kolik
          bude mít členů, zatím jasné není — podle Nytry se ještě rozhodují dva senátoři za Naše Česko. Další
          kluby: Starostové s 18 členy a lidovci se 13.
        </p>
        <p className="mt-3">
          Klub SEN 21 a Piráti zanikl, protože klesl pod minimální počet pěti členů. Václav Láska 21. října
          založil nový klub SEN 21 a nezávislých kandidátů, právě s pěti členy: vedle Lásky Martin Krsek, Přemysl
          Rabas, nově zvolený Petr Kazík a pražská senátorka Hana Kordová Marvanová, která přešla z klubu ODS
          a TOP 09.
        </p>
        <p className="mt-3">
          <strong>První schůze Senátu v novém funkčním období je svolaná na 19. listopadu od 10 hodin.</strong>{' '}
          Podle zveřejněného programu senátoři složí slib a volí předsedu a místopředsedy Senátu. Podle senátních
          zvyklostí připadá křeslo předsedy nejsilnějšímu klubu. Klub ODS a TOP 09 do něj podle Nytry znovu
          nominuje dosavadního předsedu Miloše Vystrčila (ODS), který funkci chce obhájit: „Pokud nominaci
          obdržím, tak jsem připraven ji přijmout,“ řekl Deníku.
        </p>
        <p className="mt-3">
          Vystrčil volby hodnotí jako úspěch opozice. Zastal se poražených pražských kandidátů s podporou ODS, Dagmar
          Peckové a Radka Sáblíka; Sáblíkův výsledek označil za „malé vítězství“. Na kritiku Senátu od premiéra
          Andreje Babiše odpověděl, že ho na ustavující schůzi pozve.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>
            <a href="https://ct24.ceskatelevize.cz/clanek/domaci/skoncilo-druhe-kolo-senatnich-voleb-komise-zacinaji-scitat-hlasy-378705" className="underline" rel="noopener">
              Nejvíc senátorů získalo ve volbách hnutí STAN, ANO žádného (ČT24, 17. 10. 2026)
            </a>
          </li>
          <li>
            <a href="https://www.denik.cz/senatni-volby/senat-jsme-jim-nedali-hlasi-ods-vystrcil-chce-v-cele-horni-komory-zustat/" className="underline" rel="noopener">
              Senát jsme jim nedali, hlásí ODS. Vystrčil chce v čele horní komory zůstat (Deník.cz, 17. 10. 2026)
            </a>
          </li>
          <li>
            <a href="https://www.newstream.cz/politika/toto-je-podana-ruka-vystrcil-zve-babise-do-senatu" className="underline" rel="noopener">
              „Toto je podaná ruka.“ Vystrčil zve Babiše do Senátu (Newstream, 18. 10. 2026)
            </a>
          </li>
          <li>
            <a href="https://www.seznamzpravy.cz/clanek/domaci-politika-ods-a-top-09-budou-nadale-pusobit-ve-spolecnem-klubu-uvedl-jeho-predseda-318348" className="underline" rel="noopener">
              ODS a TOP 09 budou nadále působit ve společném klubu, uvedl jeho předseda (Seznam Zprávy / ČTK, 20. 10. 2026)
            </a>
          </li>
          <li>
            <a href="https://ct24.ceskatelevize.cz/clanek/domaci/v-senatu-vznikl-klub-sen-21-a-nezavislych-kandidatu-predsedou-bude-laska-378870" className="underline" rel="noopener">
              V Senátu vznikl klub SEN 21 a nezávislých kandidátů, předsedou bude Láska (ČT24, 21. 10. 2026)
            </a>
          </li>
          <li>
            <a href="https://www.senat.cz/xqw/xervlet/pssenat/prubeh?cid=pssenat_prubeh.pTabNavrhu.pageListFiltr&forEach.action=prubeh&forEach.value=7991" className="underline" rel="noopener">
              Program 1. schůze Senátu v 16. funkčním období (senat.cz)
            </a>
          </li>
        </ul>
      </section>

      <section className="max-w-prose border-l-2 border-praha pl-5">
        <h2 className="text-2xl">Kde se senátor volil</h2>
        <p className="mt-2">
          Senátora letos volilo jen {pocetDotcenychMC()} z {MESTSKE_CASTI.length} městských částí, a u dvou
          z nich pouze část území. Ve zbylých {nevoli.length} se senátor nevolil — jejich obvody přijdou
          na řadu až v dalších letech. Patří mezi ně i celá Praha 4, Praha 8, Praha 10, Praha 11 nebo
          Praha 12.
        </p>
        <p className="mt-3">
          Do kterého obvodu patříte, poznáte na stránce obvodu níže, nebo podle polohy na{' '}
          <Link href="/" className="odkaz-akcent">
            titulní straně
          </Link>
          . V Praze 2 a Praze 6 rozhoduje adresa, ne městská část.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Tři obvody, kde se letos volilo</h2>
        <ul className="mt-5 grid gap-px border border-inkoust bg-linka-silna sm:grid-cols-3">
          {OBVODY.map((obvod) => (
            <li key={obvod.slug} className="bg-papir">
              <Link href={`/senat/${obvod.slug}`} className="block h-full p-4 no-underline hover:bg-papir-tmavsi">
                <span className="popisek-uredni">Obvod č. {obvod.cislo}</span>
                <span className="mt-1 block font-display text-xl font-semibold">{obvod.nazev}</span>
                <span className="mt-2 block text-sm">
                  {sPoctem(obvod.mestskeCasti.length, 'městská část', 'městské části', 'městských částí')}
                  {obvod.mestskeCastiCastecne.length > 0 &&
                    ` + část území dalších ${obvod.mestskeCastiCastecne.length}`}
                </span>
                <span className="popisek-uredni mt-2 block">do letošních voleb {obvod.senator}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="popisek-uredni">
        Výsledky: Český statistický úřad, data prezentační aplikace{' '}
        <a href="https://www.volbyhned.cz/app/senat/20261009/cs/home" className="underline" rel="noopener">
          volbyhned.cz
        </a>
        . Závazné jsou výsledky vyhlášené Státní volební komisí.
      </p>
    </div>
  )
}
