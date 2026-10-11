import type { Metadata, Route } from 'next'
import Link from 'next/link'
import { Aktualita } from '@/components/Aktualita'
import { MojeVolby } from '@/components/MojeVolby'
import { StrukturovanaData } from '@/components/StrukturovanaData'
import { nejnovejsi } from '@/lib/aktuality'
import { datumCesky } from '@/lib/cestina'
import { KONECNE_VYSLEDKY, stranySMandaty } from '@/lib/konecneVysledky'
import { vetsina } from '@/lib/koalice'
import {
  jeSledovane,
  nazevSubjektu,
  POPIS_STAVU,
  posledniUdalost,
  stavVyjednavani,
  vyjednavaniZastupitelstva,
} from '@/lib/vyjednavani'
import { KOD_MAGISTRATU } from '@/lib/vysledky'
import { absolutni } from '@/lib/web'

export const metadata: Metadata = {
  description:
    'Po komunálních volbách 2026: konečné výsledky všech 58 pražských zastupitelstev, kdo s kým jedná o vedení Prahy a městských částí, se zdrojem u každé zprávy, a sestavy, které mají většinu.',
}

const procenta = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function Rozcestnik() {
  const vysledky = KONECNE_VYSLEDKY.zastupitelstva
  const magistrat = vysledky.find((z) => z.kod === KOD_MAGISTRATU)!
  const vyjednavaniMagistratu = vyjednavaniZastupitelstva('magistrat')
  const posledniMagistrat = [...(vyjednavaniMagistratu?.udalosti ?? [])]
    .sort((a, b) => b.datum.localeCompare(a.datum))
    .slice(0, 4)
  const casti = vysledky
    .filter((z) => z.kod !== KOD_MAGISTRATU && jeSledovane(z.slug))
    .sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs', { numeric: true }))
  const sVetsinouJedne = casti.filter((z) => {
    const prvni = stranySMandaty(z)[0]
    return prvni !== undefined && prvni.mandaty >= vetsina(z.mandatuCelkem)
  }).length
  const aktuality = await nejnovejsi(4)

  return (
    <div className="space-y-12 sm:space-y-16">
      <StrukturovanaData
        data={{
          '@type': 'WebPage',
          name: 'Volím Prahu — po volbách 2026',
          description:
            'Konečné výsledky komunálních voleb 2026 v Praze a sledování povolebního vyjednávání o vedení města a městských částí.',
          url: absolutni('/'),
        }}
      />

      <section>
        <p className="popisek-uredni">Po komunálních volbách · 9.–10. října 2026</p>
        <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl">
          Kdo povede Prahu a vaši městskou část
        </h1>
        <p className="mt-5 max-w-prose text-lg">
          Sečteno je všech 58 pražských zastupitelstev. Primátora, starosty a rady teď zvolí nově
          zvolení zastupitelé — a k tomu potřebují většinu. Zapisujeme, kdo s kým jedná, vždy se
          zdrojem a s rozlišením, jestli jde o dokument, citaci, nebo parafrázi médií.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
          <Link href="/vysledky" className="odkaz-akcent">
            Konečné výsledky
          </Link>
          <Link href="/koalice" className="odkaz-akcent">
            Vyjednávání a koalice
          </Link>
        </p>
      </section>

      <section aria-labelledby="magistrat" className="border border-inkoust bg-papir p-5 sm:p-8">
        <p className="popisek-uredni">Magistrát · 65 zastupitelů · většina {vetsina(magistrat.mandatuCelkem)}</p>
        <h2 id="magistrat" className="mt-1 text-2xl">
          {POPIS_STAVU[stavVyjednavani(vyjednavaniMagistratu)]}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
          {stranySMandaty(magistrat).map((s) => (
            <li key={s.cislo}>
              {s.nazev} <span className="font-mono">{s.mandaty}</span>
            </li>
          ))}
        </ul>
        <p className="popisek-uredni mt-2">účast {procenta.format(magistrat.ucastProcenta)} %</p>

        {posledniMagistrat.length > 0 && (
          <ol className="mt-6 border-t border-linka-silna">
            {posledniMagistrat.map((u) => (
              <li key={u.id} className="border-b border-linka-silna py-3">
                <p className="popisek-uredni">
                  {datumCesky(u.datum)} · {u.subjekty.map((s) => nazevSubjektu(magistrat, s)).join(', ')}
                </p>
                <p className="mt-1 max-w-prose">{u.shrnuti}</p>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4">
          <Link href="/koalice#magistrat" className="odkaz-akcent">
            Celá časová osa a sestavy s většinou
          </Link>
        </p>
      </section>

      <section aria-labelledby="casti">
        <h2 id="casti" className="text-2xl">
          Městské části
        </h2>
        <p className="mt-2 max-w-prose">
          Vedení vznikne dohodou, pokud nemá jedna strana sama většinu — to se z 22 velkých částí
          stalo v {sVetsinouJedne}. U každé části najdete výsledky, zvolené zastupitele a doložené
          zprávy o vyjednávání.
        </p>
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

      <section aria-labelledby="moje-cast" className="border border-inkoust bg-papir p-5 sm:p-8">
        <p className="popisek-uredni">Moje městská část</p>
        <h2 id="moje-cast" className="mt-1 text-2xl">
          Kam patřím?
        </h2>
        <p className="mt-2 max-w-prose">
          Podle polohy zjistíme váš okrsek, městskou část a jestli se u vás ve druhém kole volí
          senátor. Poloha zůstane ve vašem prohlížeči.
        </p>
        <div className="mt-5">
          <MojeVolby />
        </div>
      </section>

      {/* Druhé kolo senátních voleb je týden po komunálních, ve třech pražských obvodech. */}
      <section aria-labelledby="senat" className="max-w-prose border-l-2 border-praha pl-5">
        <h2 id="senat" className="text-2xl">
          Druhé kolo senátních voleb 16.–17. října
        </h2>
        <p className="mt-2">
          Ve třech pražských obvodech se o senátora rozhodne až ve druhém kole: v obvodu Praha 1
          Jiří Padevět (za STAN) proti Janu Čižinskému (Praha sobě), v obvodu Praha 5 Václav Láska
          (SEN 21) proti Radku Sáblíkovi (ODS) a v obvodu Praha 9 David Smoljak (za STAN) proti
          Dagmar Peckové (za ODS).
        </p>
        <p className="popisek-uredni mt-2">
          Zdroj:{' '}
          <a
            href="https://ct24.ceskatelevize.cz/clanek/regiony/hlavni-mesto-praha/v-praze-vede-stan-druhe-je-spolu-pro-prahu-378045"
            className="underline"
            rel="noopener"
          >
            ČT24, 10. 10. 2026
          </a>{' '}
          ·{' '}
          <Link href="/senat" className="underline">
            senátní obvody
          </Link>
        </p>
      </section>

      {aktuality.length > 0 && (
        <section aria-labelledby="aktuality">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="aktuality" className="text-2xl">
              Co je nového
            </h2>
            <p>
              <Link href="/aktualne" className="odkaz-navigace">
                Všechny aktuality
              </Link>
            </p>
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
          Co kandidátky slibovaly a jak jsme to hodnotili. Hodí se k porovnání s tím, na čem se
          nové vedení dohodne.
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
          <Rozcestka
            href="/senat"
            popisek="Souběžně"
            nadpis="Senát"
            popis="Senátní volby ve třech pražských obvodech."
          />
        </ul>
      </section>
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
