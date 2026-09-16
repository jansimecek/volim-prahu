'use client'

import { useState } from 'react'
import type { Preklad } from '@/preklady'

/**
 * Tři otázky, ze kterých vyjde, jestli člověk v pražských komunálních
 * volbách smí volit.
 *
 * Proč vůbec test, když odpověď je na stránce i větou: protože otázka
 * „smím?" má tři proměnné a jejich kombinací je osmnáct. Text, který
 * popisuje všechny, se nečte; tři kliknutí ano.
 *
 * Nic se neodesílá — odpověď se počítá v prohlížeči a nikam se neukládá.
 * U otázky na občanství a pobyt je to podmínka, ne bonus: web, který by
 * si zapisoval, kdo se ptal na svůj pobytový status, by byl pro spoustu
 * cizinců důvod ho nepoužít.
 *
 * Pořadí otázek jde podle síly filtru: občanství mimo EU vylučuje volební
 * právo samo o sobě, takže se na pobyt a věk už není potřeba ptát.
 */
type Obcanstvi = 'cz' | 'eu' | 'mimo'
type Pobyt = 'ano' | 'jinde' | 'ne'
type Vek = 'ano' | 'ne'

export type KlicVysledku = keyof Preklad['canIVote']['testVysledky']

/**
 * Vyhodnocení podle § 4 odst. 1 zákona č. 491/2001 Sb. Oddělené od
 * komponenty, aby šlo otestovat bez vykreslování.
 */
export function vyhodnot(
  obcanstvi: Obcanstvi,
  pobyt: Pobyt | null,
  vek: Vek | null,
): KlicVysledku | null {
  // Občanství mimo EU nezakládá volební právo v obci bez ohledu na pobyt
  // i věk — mezinárodní smlouva, kterou zákon vyžaduje, existuje jen pro EU.
  if (obcanstvi === 'mimo') return 'mimoEu'
  if (pobyt === null) return null
  if (pobyt === 'ne') return 'bezPobytu'
  if (pobyt === 'jinde') return 'jinaObec'
  if (vek === null) return null
  if (vek === 'ne') return 'mlady'
  return obcanstvi === 'cz' ? 'czPlny' : 'euPlny'
}

/** Ptá se test po téhle odpovědi ještě na něco dalšího? */
export function dalsiOtazka(
  obcanstvi: Obcanstvi | null,
  pobyt: Pobyt | null,
): 'obcanstvi' | 'pobyt' | 'vek' | null {
  if (obcanstvi === null) return 'obcanstvi'
  if (obcanstvi === 'mimo') return null
  if (pobyt === null) return 'pobyt'
  if (pobyt !== 'ano') return null
  return 'vek'
}

export function TestZpusobilosti({ t }: { t: Preklad }) {
  const [obcanstvi, setObcanstvi] = useState<Obcanstvi | null>(null)
  const [pobyt, setPobyt] = useState<Pobyt | null>(null)
  const [vek, setVek] = useState<Vek | null>(null)

  const otazky = t.canIVote.testOtazky
  const vysledek = obcanstvi === null ? null : vyhodnot(obcanstvi, pobyt, vek)
  const ptaSeNa = dalsiOtazka(obcanstvi, pobyt)

  function znovu() {
    setObcanstvi(null)
    setPobyt(null)
    setVek(null)
  }

  return (
    <div className="border border-inkoust bg-papir p-5 sm:p-6">
      <p className="popisek-uredni">{t.canIVote.testNadpis}</p>
      <p className="mt-2 max-w-prose text-sm">{t.canIVote.testUvod}</p>

      <div className="mt-6 space-y-6">
        <Otazka
          zadani={otazky.obcanstvi.otazka}
          napoveda={otazky.obcanstvi.napoveda}
          moznosti={otazky.obcanstvi.moznosti}
          vybrano={obcanstvi}
          nastav={(k) => {
            setObcanstvi(k as Obcanstvi)
            setPobyt(null)
            setVek(null)
          }}
        />

        {ptaSeNa !== 'obcanstvi' && obcanstvi !== 'mimo' && (
          <Otazka
            zadani={otazky.pobyt.otazka}
            napoveda={otazky.pobyt.napoveda}
            moznosti={otazky.pobyt.moznosti}
            vybrano={pobyt}
            nastav={(k) => {
              setPobyt(k as Pobyt)
              setVek(null)
            }}
          />
        )}

        {ptaSeNa === 'vek' && (
          <Otazka
            zadani={otazky.vek.otazka}
            napoveda={otazky.vek.napoveda}
            moznosti={otazky.vek.moznosti}
            vybrano={vek}
            nastav={(k) => setVek(k as Vek)}
          />
        )}
      </div>

      {/* Výsledek je `aria-live`, protože se objeví bez překreslení stránky —
          odečítač by ho jinak minul a uživatel by nevěděl, že odpověď přišla. */}
      <div aria-live="polite" className="mt-8">
        {vysledek && <Vysledek {...t.canIVote.testVysledky[vysledek]} />}
      </div>

      {obcanstvi !== null && (
        <p className="mt-5">
          <button type="button" onClick={znovu} className="odkaz-akcent bg-transparent">
            {t.canIVote.testZnovu}
          </button>
        </p>
      )}
    </div>
  )
}

function Otazka({
  zadani,
  napoveda,
  moznosti,
  vybrano,
  nastav,
}: {
  zadani: string
  napoveda: string
  moznosti: readonly { klic: string; popisek: string }[]
  vybrano: string | null
  nastav: (klic: string) => void
}) {
  return (
    <fieldset className="border-t border-linka-silna pt-4">
      <legend className="px-0 text-lg">{zadani}</legend>
      <p className="mt-1 max-w-prose text-sm text-seda-uredni">{napoveda}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {moznosti.map((m) => {
          const zvoleno = vybrano === m.klic
          return (
            <button
              key={m.klic}
              type="button"
              aria-pressed={zvoleno}
              onClick={() => nastav(m.klic)}
              className={`border px-3 py-2 text-left text-base ${
                zvoleno
                  ? 'border-inkoust bg-inkoust text-papir'
                  : 'border-linka-silna bg-papir hover:bg-papir-tmavsi'
              }`}
            >
              {m.popisek}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Vysledek({ stav, nadpis, text }: { stav: string; nadpis: string; text: string }) {
  const trida = stav === 'ano' ? 'zpusobilost-ano' : stav === 'ne' ? 'zpusobilost-ne' : ''
  const znacka = stav === 'ano' ? '✓' : stav === 'ne' ? '✕' : '→'

  return (
    <div className="border-t-2 border-inkoust pt-4">
      <p className={`text-xl ${trida}`}>
        <span className="znacka" aria-hidden="true">
          {znacka}
        </span>{' '}
        {nadpis}
      </p>
      <p className="mt-2 max-w-prose">{text}</p>
    </div>
  )
}
