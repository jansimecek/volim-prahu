'use client'

import { useId, useMemo, useState } from 'react'
import { PosuvnaTabulka } from '@/components/PosuvnaTabulka'
import { sPoctem } from '@/lib/cestina'
import { minimalniKoalice, vetsina, type Vylouceni } from '@/lib/koalice'
import { rozdelMandaty } from '@/lib/mandaty'

export type SubjektKalkulacky = { slug: string; zkratka: string; kandidatu: number }

export type PruzkumKalkulacky = {
  /** Kdo, pro koho, kdy a na kolika lidech — zobrazuje se vždy u tlačítka. */
  popis: string
  url: string
  procenta: Record<string, number>
}

const formatProcent = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 })

/** Prázdné pole je nula. Desetinná čárka i tečka projdou; cokoli jiného je chyba (NaN). */
function prectiProcenta(text: string): number {
  const t = text.replace(/\s/g, '').replace(',', '.')
  if (t === '') return 0
  if (!/^\d+(\.\d+)?$/.test(t)) return Number.NaN
  const n = Number(t)
  return n <= 100 ? n : Number.NaN
}

/** Jedno vyloučení na dvojici subjektů, i když ho doložilo víc vyjádření. */
function bezOpakovani(vylouceni: readonly Vylouceni[]): Vylouceni[] {
  const videne = new Map<string, Vylouceni>()
  for (const v of vylouceni) if (!videne.has(`${v.kdo}>${v.koho}`)) videne.set(`${v.kdo}>${v.koho}`, v)
  return [...videne.values()]
}

/**
 * Kalkulačka mandátů pro Zastupitelstvo hl. m. Prahy.
 *
 * Tři zásady ji drží na straně aritmetiky:
 *  1. Na serveru se vykreslí prázdná. Čísla z průzkumu se do ní dostanou, jen
 *     když o to čtenář sám požádá — a tlačítko existuje, jen když průzkum smí
 *     být zveřejněný. O tom rozhoduje stránka přes moratorium, ne komponenta.
 *  2. Sestavy se neřadí podle mandátů. Sestava nahoře by vypadala pravděpodobněji.
 *  3. U sestav se vyznačují jen doložená vyloučení, žádné odhady ochoty.
 */
export function KalkulackaMandatu({
  subjekty,
  mandatu,
  vylouceni,
  pruzkum,
}: {
  subjekty: readonly SubjektKalkulacky[]
  mandatu: number
  vylouceni: readonly Vylouceni[]
  pruzkum: PruzkumKalkulacky | null
}) {
  const predpona = useId()
  const [vstupy, setVstupy] = useState<Record<string, string>>({})

  const hodnoty = useMemo(() => {
    const vysledek: Record<string, number> = {}
    for (const s of subjekty) vysledek[s.slug] = prectiProcenta(vstupy[s.slug] ?? '')
    return vysledek
  }, [subjekty, vstupy])

  const chybne = subjekty.filter((s) => Number.isNaN(hodnoty[s.slug]))
  const soucet = subjekty.reduce((n, s) => n + (Number.isNaN(hodnoty[s.slug]) ? 0 : (hodnoty[s.slug] ?? 0)), 0)
  const presSto = soucet > 100 + 1e-9
  const lzePocitat = chybne.length === 0 && soucet > 0 && !presSto

  const prepocet = useMemo(
    () =>
      lzePocitat
        ? rozdelMandaty(
            subjekty.map((s) => ({ id: s.slug, hlasy: hodnoty[s.slug] ?? 0, kandidatu: s.kandidatu })),
            mandatu,
            100,
          )
        : null,
    [lzePocitat, subjekty, hodnoty, mandatu],
  )

  const sestavy = useMemo(
    () =>
      prepocet
        ? minimalniKoalice(
            prepocet.strany.map((s) => ({ id: s.id, mandaty: s.mandaty })),
            mandatu,
            bezOpakovani(vylouceni),
          )
        : [],
    [prepocet, mandatu, vylouceni],
  )

  const zkratka = (slug: string) => subjekty.find((s) => s.slug === slug)?.zkratka ?? slug
  const vysledekStrany = new Map((prepocet?.strany ?? []).map((s) => [s.id, s]))

  function vyplnPodlePruzkumu() {
    if (!pruzkum) return
    setVstupy(
      Object.fromEntries(Object.entries(pruzkum.procenta).map(([slug, p]) => [slug, formatProcent.format(p)])),
    )
  }

  return (
    <section aria-labelledby="kalkulacka" className="space-y-5">
      <div className="max-w-prose">
        <h2 id="kalkulacka" className="scroll-mt-20 text-2xl">
          Kalkulačka mandátů
        </h2>
        <p className="mt-3">
          Zadejte, kolik procent platných hlasů by jednotlivé subjekty dostaly. Subjekty bez čísla se
          počítají s nulou. Nic se neukládá ani neodesílá.
        </p>
        <p className="mt-3 border-l-2 border-praha pl-5 text-sm">
          <span className="popisek-uredni block">Aritmetika, ne předpověď</span>
          Kalkulačka ukazuje jen to, co ze zadaných čísel vychází podle § 45 zákona o volbách do
          zastupitelstev obcí. Která sestava opravdu vznikne, z mandátů odvodit nejde.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {pruzkum && (
          <button type="button" onClick={vyplnPodlePruzkumu} className="border border-praha px-4 py-2 text-praha">
            Vyplnit podle posledního průzkumu
          </button>
        )}
        <button type="button" onClick={() => setVstupy({})} className="border border-inkoust px-4 py-2">
          Vynulovat
        </button>
      </div>
      {pruzkum && (
        <p className="max-w-prose text-sm text-seda-uredni">
          Průzkum:{' '}
          <a href={pruzkum.url} className="underline" rel="noopener nofollow">
            {pruzkum.popis}
          </a>
          . Měří, koho by lidé volili, ne hlasy pro kandidáty, a subjekty, které v něm nejsou, vyplní
          nulou. Výsledek je proto jen orientační.
        </p>
      )}

      <PosuvnaTabulka popisek="Zadání procent a přepočet na mandáty">
        <table className="w-full min-w-[26rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-inkoust">
              <th scope="col" className="popisek-uredni py-2 pr-3">
                Subjekt
              </th>
              <th scope="col" className="popisek-uredni py-2 pr-3">
                Procent hlasů
              </th>
              <th scope="col" className="popisek-uredni py-2 text-right">
                Mandátů
              </th>
            </tr>
          </thead>
          <tbody>
            {subjekty.map((s) => {
              const id = `${predpona}-${s.slug}`
              const vysledek = vysledekStrany.get(s.slug)
              const chyba = Number.isNaN(hodnoty[s.slug])
              return (
                <tr key={s.slug} className="border-b border-linka-silna">
                  <th scope="row" className="py-2 pr-3 font-normal">
                    <label htmlFor={id}>{s.zkratka}</label>
                  </th>
                  <td className="py-1 pr-3">
                    <input
                      id={id}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={vstupy[s.slug] ?? ''}
                      aria-invalid={chyba || undefined}
                      onChange={(e) => setVstupy((v) => ({ ...v, [s.slug]: e.target.value }))}
                      className={`w-24 border bg-papir px-2 py-1 text-right font-mono ${chyba ? 'border-praha' : 'border-inkoust'}`}
                    />
                    <span aria-hidden="true"> %</span>
                  </td>
                  <td className="py-2 text-right font-mono">
                    {!vysledek
                      ? '—'
                      : vysledek.mandaty > 0
                        ? vysledek.mandaty
                        : vysledek.hlasy > 0 && !vysledek.postupuje
                          ? 'pod hranicí'
                          : vysledek.hlasy > 0
                            ? '0'
                            : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </PosuvnaTabulka>

      <div aria-live="polite" className="max-w-prose text-sm">
        {chybne.length > 0 ? (
          <p className="text-praha">
            U {chybne.map((s) => s.zkratka).join(', ')} není číslo mezi 0 a 100.
          </p>
        ) : presSto ? (
          <p className="text-praha">Zadaná procenta dávají dohromady {formatProcent.format(soucet)} %, tedy víc než sto.</p>
        ) : !prepocet ? (
          <p className="text-seda-uredni">Zatím není co přepočítat.</p>
        ) : (
          <p>
            {`Rozděleno ${prepocet.rozdeleno} z ${mandatu} mandátů · uzavírací klauzule ${prepocet.klauzule} %`}
            {prepocet.klauzule < 5 ? ', snížená podle § 45' : ''}
            {` · většina je ${vetsina(mandatu)} · zadáno ${formatProcent.format(soucet)} %`}
            {prepocet.los ? ' · o posledním mandátu by rozhodl los' : ''}
          </p>
        )}
      </div>

      {prepocet && (
        <div>
          <h3 className="text-lg">Sestavy s většinou</h3>
          <p className="mt-1 max-w-prose text-sm text-seda-uredni">
            Jen sestavy, ze kterých nemůže nikdo odejít, aniž by většinu ztratily; větší vzniknou
            přibráním dalšího partnera. Řazené podle počtu členů a abecedy, ne podle mandátů. Vyznačené je,
            když některý člen jiného veřejně vyloučil — šipka vede od toho, kdo vyloučení vyslovil,
            k tomu, koho vyloučil.
          </p>
          <ul className="mt-3 border-t border-inkoust">
            {sestavy.map((k) => (
              <li key={k.clenove.join('+')} className="border-b border-linka-silna py-3">
                <p>
                  <span className="font-display font-semibold">{k.clenove.map(zkratka).join(' + ')}</span>{' '}
                  <span className="font-mono">{sPoctem(k.mandaty, 'mandát', 'mandáty', 'mandátů')}</span>
                </p>
                {k.vylouceni.length > 0 && (
                  <p className="mt-1 text-sm">
                    <span className="popisek-uredni">Vyloučeno: </span>
                    {k.vylouceni.map((v, i) => (
                      <span key={`${v.kdo}>${v.koho}`}>
                        {i > 0 && ', '}
                        {/* Šipka místo slovesa: „Piráti vylučuje ANO“ by u množného čísla
                            ani u skloňovaných názvů stran gramaticky nesedělo. */}
                        <a href={`#deklarace-${v.deklarace}`} className="underline">
                          {zkratka(v.kdo)} → {zkratka(v.koho)}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
