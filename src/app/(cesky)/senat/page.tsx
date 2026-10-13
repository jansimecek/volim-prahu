import type { Metadata } from 'next'
import Link from 'next/link'
import { DruheKoloSenatu } from '@/components/DruheKoloSenatu'
import { StrukturovanaData } from '@/components/StrukturovanaData'
import { sPoctem } from '@/lib/cestina'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { OBVODY, pocetDotcenychMC, senatniStavMestskeCasti } from '@/lib/senat'
import { nazevStranySenat } from '@/lib/senatKandidati'
import { soubojDruhehoKola, vysledkyObvodu } from '@/lib/senatVysledky'
import { DRUHE_KOLO_SENATU } from '@/lib/terminy'
import { absolutni } from '@/lib/web'

export const metadata: Metadata = {
  title: 'Senátní volby v Praze 2026: druhé kolo 16.–17. října',
  description:
    'Druhé kolo senátních voleb v Praze 16.–17. října 2026: kdo s kým se utká v obvodech Praha 1, Praha 5 a Praha 9, výsledky prvního kola a jak se ve druhém kole volí.',
}

const procenta = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function StrankaSenatu() {
  const nevoli = MESTSKE_CASTI.filter((mc) => senatniStavMestskeCasti(mc.slug).stav === 'nevoli')
  const dnes = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })
  const predDruhymKolem = dnes < DRUHE_KOLO_SENATU.od
  const poDruhemKole = dnes > DRUHE_KOLO_SENATU.do

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
        <h1 className="mt-2 text-4xl">Druhé kolo senátních voleb</h1>
        <p className="mt-4">
          V prvním kole 9.–10. října nikdo v žádném ze tří pražských obvodů nezískal nadpoloviční
          většinu. O senátorech proto rozhodne druhé kolo{' '}
          {predDruhymKolem ? 'v pátek 16. a v sobotu 17. října' : '16.–17. října'} — v každém obvodu
          mezi dvěma kandidáty, kteří v prvním kole skončili první a druzí.
        </p>
        {poDruhemKole && (
          <p className="mt-3 border-l-2 border-okr pl-4">
            Druhé kolo proběhlo. Výsledky doplníme z dat Českého statistického úřadu.
          </p>
        )}
      </header>

      <section aria-labelledby="souboje">
        <h2 id="souboje" className="text-2xl">
          Kdo s kým
        </h2>
        <ul className="mt-5 grid gap-px border border-inkoust bg-linka-silna lg:grid-cols-3">
          {OBVODY.map((obvod) => {
            const dvojice = soubojDruhehoKola(obvod.cislo)
            const v = vysledkyObvodu(obvod.cislo)
            return (
              <li key={obvod.slug} className="bg-papir">
                <Link href={`/senat/${obvod.slug}`} className="group block h-full p-4 no-underline hover:bg-papir-tmavsi sm:p-5">
                  <span className="popisek-uredni">Obvod č. {obvod.cislo}</span>
                  <span className="mt-1 block font-display text-xl font-semibold group-hover:underline">
                    {obvod.nazev}
                  </span>
                  <span className="mt-3 block space-y-2">
                    {dvojice.map((r) => (
                      <span key={r.cislo} className="block">
                        <span className="block font-medium">{r.celeJmeno}</span>
                        <span className="block text-sm">
                          {nazevStranySenat(r.kandidat?.volebniStrana ?? r.navrhujici)} · 1. kolo{' '}
                          <span className="font-mono">{procenta.format(r.procenta)} %</span>
                        </span>
                      </span>
                    ))}
                  </span>
                  {v && (
                    <span className="popisek-uredni mt-3 block">
                      účast v 1. kole {procenta.format(v.kolo1.ucastProcenta)} %
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-seda-uredni">
          Ve druhém kole se začíná od nuly: rozhoduje jen to, kdo dostane víc hlasů, ne výsledek
          prvního kola. Celé výsledky prvního kola jsou na stránce každého obvodu.
        </p>
      </section>

      <DruheKoloSenatu />

      <section className="max-w-prose border-l-2 border-praha pl-5">
        <h2 className="text-2xl">Volím senátora já?</h2>
        <p className="mt-2">
          Senátora letos volí jen {pocetDotcenychMC()} z {MESTSKE_CASTI.length} městských částí, a u dvou
          z nich pouze část území. Ve zbylých {nevoli.length} se senátor nevolí — jejich obvody přijdou
          na řadu až v dalších letech. Patří mezi ně i celá Praha 4, Praha 8, Praha 10, Praha 11 nebo
          Praha 12.
        </p>
        <p className="mt-3">
          Který obvod je váš, poznáte na stránce obvodu níže, nebo podle polohy na{' '}
          <Link href="/" className="odkaz-akcent">
            titulní straně
          </Link>
          . V Praze 2 a Praze 6 rozhoduje adresa, ne městská část.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Tři obvody, kde se letos volí</h2>
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
                <span className="popisek-uredni mt-2 block">dosavadní senátor {obvod.senator}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="popisek-uredni">
        Výsledky prvního kola: Český statistický úřad, data prezentační aplikace{' '}
        <a href="https://www.volbyhned.cz/app/senat/20261009/cs/home" className="underline" rel="noopener">
          volbyhned.cz
        </a>
        . Závazné jsou výsledky vyhlášené Státní volební komisí.
      </p>
    </div>
  )
}
