import type { Metadata, Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Aktualita } from '@/components/Aktualita'
import { MojeVolby } from '@/components/MojeVolby'
import { StrukturovanaData } from '@/components/StrukturovanaData'
import { mistoTerminu, Vyhled } from '@/components/Vyhled'
import { nejnovejsi } from '@/lib/aktuality'
import { datumCesky } from '@/lib/cestina'
import { KONECNE_VYSLEDKY, stranySMandaty, vysledekZastupitelstva } from '@/lib/konecneVysledky'
import { vetsina } from '@/lib/koalice'
import { lhutyUstavujichZasedani } from '@/lib/terminy'
import { vyhledOd } from '@/lib/vyhled'
import {
  dohodnutaSestava,
  jeSledovane,
  naposledyOvereno,
  nazevSubjektu,
  pocetPodleStavu,
  POPIS_STAVU,
  posledniUdalost,
  stavVyjednavani,
  vsechnyUdalosti,
  vyjednavaniZastupitelstva,
  type Stav,
} from '@/lib/vyjednavani'
import { KOD_MAGISTRATU } from '@/lib/vysledky'
import { absolutni } from '@/lib/web'

export const metadata: Metadata = {
  title: { absolute: 'Volím Prahu — kdo povede Prahu po volbách 2026' },
  description:
    'Aktuální stav vyjednávání o vedení Prahy a 57 městských částí po komunálních volbách 2026: kdo s kým jedná, podepsané dohody, zvolení starostové, konečné výsledky a sestavy s většinou. Každá zpráva se zdrojem.',
}

const procenta = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Pořadí stavů od nejdál dotaženého — tak se čtou počty v přehledu. */
const PORADI_STAVU: Stav[] = ['zvoleno-vedeni', 'koalicni-smlouva', 'memorandum', 'dohoda', 'jednani', 'bez-zprav']

export default async function Rozcestnik() {
  const vysledky = KONECNE_VYSLEDKY.zastupitelstva
  const magistrat = vysledky.find((z) => z.kod === KOD_MAGISTRATU)!
  const vMagistrat = vyjednavaniZastupitelstva('magistrat')
  const sestavaMagistratu = dohodnutaSestava(vMagistrat)
  const casti = vysledky
    .filter((z) => z.kod !== KOD_MAGISTRATU && jeSledovane(z.slug))
    .sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs', { numeric: true }))
  const pocty = pocetPodleStavu(casti.map((z) => z.slug))
  const sVetsinouJedne = casti.filter((z) => {
    const prvni = stranySMandaty(z)[0]
    return prvni !== undefined && prvni.mandaty >= vetsina(z.mandatuCelkem)
  }).length
  const zpravy = vsechnyUdalosti().slice(0, 8)
  const overeno = naposledyOvereno()
  const lhuty = lhutyUstavujichZasedani()
  const dnes = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })
  const terminy = vyhledOd(dnes)
  const aktuality = await nejnovejsi(4)

  return (
    <div className="space-y-12 sm:space-y-16">
      <StrukturovanaData
        data={{
          '@type': 'WebPage',
          name: 'Kdo povede Prahu po volbách 2026',
          description:
            'Aktuální stav povolebního vyjednávání o vedení hlavního města Prahy a městských částí, konečné výsledky komunálních voleb 2026.',
          url: absolutni('/'),
          inLanguage: 'cs',
          ...(overeno ? { dateModified: overeno } : {}),
          about: [
            { '@type': 'GovernmentOrganization', name: 'Zastupitelstvo hlavního města Prahy' },
            { '@type': 'Event', name: 'Volby do zastupitelstev obcí 2026', startDate: '2026-10-09', endDate: '2026-10-10' },
          ],
        }}
      />

      <section>
        <p className="popisek-uredni">
          Po komunálních volbách 2026{overeno && <> · stav k {datumCesky(overeno)}</>}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl">Kdo povede Prahu</h1>
        <p className="mt-4 max-w-prose text-lg">
          Volby skončily, teď se jedná o vedení města a 57 městských částí. Zapisujeme jen doložené:
          kdo s kým jedná, kdo co vyloučil, kdo podepsal dohodu a koho zastupitelé zvolili.
        </p>

        {/* Přehled na jeden pohled: tři otázky, se kterými sem čtenář přichází. */}
        <div className="mt-8 grid gap-px border border-inkoust bg-linka-silna lg:grid-cols-3">
          <Karta popisek={`Magistrát · většina ${vetsina(magistrat.mandatuCelkem)} z ${magistrat.mandatuCelkem}`}>
            <p className="font-display text-2xl font-semibold">{POPIS_STAVU[stavVyjednavani(vMagistrat)]}</p>
            <p className="mt-2 text-sm">
              {stranySMandaty(magistrat)
                .map((s) => `${s.nazev} ${s.mandaty}`)
                .join(' · ')}
            </p>
            <p className="mt-2 text-sm">
              <span className="popisek-uredni">Dohodnutá sestava</span>{' '}
              {sestavaMagistratu ? sestavaMagistratu.map((s) => nazevSubjektu(magistrat, s)).join(' + ') : 'zatím žádná'}
            </p>
            <p className="mt-3">
              <Link href="/koalice#magistrat" className="odkaz-akcent">
                Časová osa a sestavy s většinou
              </Link>
            </p>
          </Karta>

          <Karta popisek="Praha 1–22">
            <ul className="space-y-1">
              {PORADI_STAVU.map((stav) => (
                <li key={stav} className="flex justify-between gap-3">
                  <span>{POPIS_STAVU[stav]}</span>
                  <span className="font-mono">{pocty[stav]}</span>
                </li>
              ))}
            </ul>
            <p className="popisek-uredni mt-3">
              Ve {sVetsinouJedne} z {casti.length} má jedna strana většinu sama
            </p>
            <p className="mt-3">
              <Link href="/koalice#mestske-casti" className="odkaz-akcent">
                Přehled městských částí
              </Link>
            </p>
          </Karta>

          <Karta popisek="Termíny">
            <ul className="space-y-3 text-sm">
              {terminy.slice(0, 3).map((t) => (
                <li key={t.id}>
                  <span className="font-medium">{t.kdy ?? datumCesky(t.datum)}</span> —{' '}
                  {t.zastupitelstvo !== null && `${mistoTerminu(t).nazev}: `}
                  {t.nadpis}
                </li>
              ))}
              {!lhuty && (
                <li>
                  Státní volební komise výsledky zatím nevyhlásila. Od vyhlášení běží 10 dní na soudní
                  návrhy a pak 15 dní na ustavující zasedání.
                </li>
              )}
            </ul>
            <p className="mt-3">
              <Link href="#vyhled" className="odkaz-akcent">
                Celý výhled
              </Link>
            </p>
          </Karta>
        </div>
      </section>

      {terminy.length > 0 && (
        <section aria-labelledby="vyhled" className="scroll-mt-20">
          <h2 id="vyhled" className="text-2xl">
            Co nás čeká
          </h2>
          <p className="mt-2 max-w-prose">
            Jen termíny, které stanoví zákon nebo které strany ohlásily — nic z toho není náš odhad.
            Plány se mohou změnit; u každého je zdroj a plná značka odlišuje pevné termíny od ohlášených.
          </p>
          <Vyhled terminy={terminy} />
        </section>
      )}

      <section aria-labelledby="zpravy">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="zpravy" className="text-2xl">
            Poslední zprávy z vyjednávání
          </h2>
          <Link href="/koalice" className="odkaz-navigace">
            Vše o vyjednávání
          </Link>
        </div>
        {zpravy.length > 0 ? (
          <ol className="mt-2 border-t border-inkoust">
            {zpravy.map((u) => {
              const z = vysledekZastupitelstva(u.zastupitelstvo)
              const href = (u.zastupitelstvo === 'magistrat'
                ? `/koalice#udalost-${u.id}`
                : `/mestska-cast/${u.zastupitelstvo}#udalost-${u.id}`) as Route
              return (
                <li key={`${u.zastupitelstvo}-${u.id}`} className="border-b border-linka-silna py-3">
                  <p className="popisek-uredni">
                    {datumCesky(u.datum)} · {z?.slug === 'magistrat' ? 'Magistrát' : z?.nazev}
                    {z && ` · ${u.subjekty.map((s) => nazevSubjektu(z, s)).join(', ')}`}
                  </p>
                  <p className="mt-1 max-w-prose">
                    <Link href={href} className="no-underline hover:underline">
                      {u.shrnuti}
                    </Link>
                  </p>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="mt-2">Zatím žádné doložené zprávy.</p>
        )}
      </section>

      <section aria-labelledby="casti">
        <h2 id="casti" className="text-2xl">
          Městské části
        </h2>
        <ul className="mt-5 grid gap-px border border-inkoust bg-linka-silna sm:grid-cols-2 lg:grid-cols-3">
          {casti.map((z) => {
            const prvni = stranySMandaty(z)[0]
            const v = vyjednavaniZastupitelstva(z.slug)
            const posledni = posledniUdalost(v)
            return (
              <li key={z.kod} className="bg-papir">
                <Link
                  href={`/mestska-cast/${z.slug}#vyjednavani`}
                  className="group block h-full p-3 no-underline hover:bg-papir-tmavsi"
                >
                  <span className="font-display font-medium group-hover:underline">{z.nazev}</span>
                  {prvni && (
                    <span className="mt-1 block text-sm">
                      {prvni.nazev} {prvni.mandaty}/{z.mandatuCelkem}
                      {prvni.mandaty >= vetsina(z.mandatuCelkem) && ' · sama většina'}
                    </span>
                  )}
                  <span className="popisek-uredni mt-1 block">
                    {POPIS_STAVU[stavVyjednavani(v)]}
                    {posledni && ` · ${datumCesky(posledni.datum)}`}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="mt-3">
          <Link href="/koalice#mestske-casti" className="odkaz-akcent">
            Všech 57 městských částí
          </Link>
        </p>
      </section>

      <section aria-labelledby="vysledky" className="max-w-prose">
        <h2 id="vysledky" className="text-2xl">
          Výsledky voleb
        </h2>
        <p className="mt-2">
          Magistrát: {stranySMandaty(magistrat).map((s) => `${s.nazev} ${s.mandaty}`).join(', ')}. Účast{' '}
          {procenta.format(magistrat.ucastProcenta)} %.{' '}
          <Link href="/vysledky" className="odkaz-akcent">
            Konečné výsledky všech 58 zastupitelstev a zvolení zastupitelé
          </Link>
        </p>
      </section>

      <section aria-labelledby="moje-cast" className="border border-inkoust bg-papir p-5 sm:p-8">
        <p className="popisek-uredni">Moje městská část</p>
        <h2 id="moje-cast" className="mt-1 text-2xl">
          Kam patřím?
        </h2>
        <p className="mt-2 max-w-prose">
          Podle polohy zjistíme váš okrsek, městskou část a senátní obvod. Poloha zůstane ve vašem
          prohlížeči.
        </p>
        <div className="mt-5">
          <MojeVolby />
        </div>
      </section>

      {aktuality.length > 0 && (
        <section aria-labelledby="aktuality">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="aktuality" className="text-2xl">
              Aktuálně
            </h2>
            <Link href="/aktualne" className="odkaz-navigace">
              Všechny aktuality
            </Link>
          </div>
          <div className="mt-2 border-t border-inkoust">
            {aktuality.map((z) => (
              <Aktualita key={z.slug} aktualita={z} strucne />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="archiv">
        <h2 id="archiv" className="text-2xl">
          Archiv kampaně
        </h2>
        <p className="mt-2 max-w-prose text-seda-uredni">
          Co kandidátky slibovaly a jak jsme to hodnotili. Hodí se k porovnání s tím, na čem se nové
          vedení dohodne.
        </p>
        <ul className="mt-5 grid gap-px border border-inkoust bg-linka-silna sm:grid-cols-2 lg:grid-cols-3">
          <Rozcestka
            href="/praha"
            popisek="Magistrát"
            nadpis="Kandidátky a programy"
            popis="Lídři všech 24 kandidátek, jejich programy a hodnocení, co z nich magistrát může splnit."
          />
          <Rozcestka
            href="/temata"
            popisek="Srovnání"
            nadpis="Témata"
            popis="Postoje k bydlení, dopravě a územnímu plánu vedle sebe, u každého zdroj."
          />
          <Rozcestka
            href="/minule-obdobi"
            popisek="Podklad"
            nadpis="Plnění slibů"
            popis="Co slíbila odcházející rada v programovém prohlášení a kolik z toho jde ověřit."
          />
          <Rozcestka
            href="/kdo-o-cem-rozhoduje"
            popisek="Podklad"
            nadpis="Kdo o čem rozhoduje"
            popis="Sedmnáct agend a u každé odkaz na paragraf. Hodí se při čtení koaličních smluv."
          />
          <Rozcestka
            href="/debaty"
            popisek="Kampaň"
            nadpis="Debaty kandidátů"
            popis="Přehled předvolebních debat lídrů pražských kandidátek."
          />
          <Rozcestka href="/senat" popisek="Souběžně" nadpis="Senát" popis="Zvolení senátoři a výsledky ve třech pražských obvodech." />
        </ul>
      </section>
    </div>
  )
}

function Karta({ popisek, children }: { popisek: string; children: ReactNode }) {
  return (
    <div className="bg-papir p-4 sm:p-5">
      <p className="popisek-uredni mb-2">{popisek}</p>
      {children}
    </div>
  )
}

function Rozcestka({
  href,
  popisek,
  nadpis,
  popis,
}: {
  href: Route
  popisek: string
  nadpis: string
  popis: string
}) {
  return (
    <li className="bg-papir">
      <Link href={href} className="group block h-full p-4 no-underline hover:bg-papir-tmavsi sm:p-5">
        <span className="popisek-uredni">{popisek}</span>
        <span className="mt-2 block font-display text-xl font-semibold group-hover:underline">
          {nadpis}
        </span>
        <span className="mt-2 block text-sm">{popis}</span>
      </Link>
    </li>
  )
}
