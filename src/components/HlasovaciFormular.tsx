'use client'

import { useState } from 'react'
import { VEKOVE_KATEGORIE } from '@/lib/hlasovani'

type Subjekt = { slug: string; nazev: string }
type MestskaCast = { slug: string; nazev: string }

type Stav = 'formular' | 'odesilam' | 'hotovo' | 'chyba'

export function HlasovaciFormular({
  subjekty,
  mestskeCasti,
}: {
  subjekty: Subjekt[]
  mestskeCasti: MestskaCast[]
}) {
  const [stav, setStav] = useState<Stav>('formular')
  const [chyba, setChyba] = useState('')
  const [email, setEmail] = useState('')
  const [emailUlozen, setEmailUlozen] = useState(false)

  async function odesli(udalost: React.FormEvent<HTMLFormElement>) {
    udalost.preventDefault()
    const data = new FormData(udalost.currentTarget)
    setStav('odesilam')

    const odpoved = await fetch('/api/hlasovani', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mestskaCast: data.get('mestskaCast'),
        vekovaKategorie: data.get('vekovaKategorie'),
        uroven: 'magistrat',
        subjekt: data.get('subjekt'),
      }),
    }).catch(() => null)

    if (!odpoved?.ok) {
      const telo = await odpoved?.json().catch(() => null)
      setChyba(telo?.chyba ?? 'Hlas se nepodařilo uložit. Zkuste to prosím znovu.')
      setStav('chyba')
      return
    }
    setStav('hotovo')
  }

  async function ulozEmail(udalost: React.FormEvent<HTMLFormElement>) {
    udalost.preventDefault()
    const odpoved = await fetch('/api/odber', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null)
    if (odpoved?.ok) setEmailUlozen(true)
  }

  if (stav === 'hotovo') {
    return (
      <div className="border border-inkoust p-5">
        <h2 className="font-display text-xl font-semibold">Hlas je uložený</h2>
        <p className="mt-2 max-w-prose">
          Žádné průběžné výsledky vám neukážeme — ani počet hlasů. Souhrn zveřejníme
          až po zavření volebních místností v sobotu 10. října ve 14:00.
        </p>

        <div className="mt-6 border-t border-linka pt-5">
          <h3 className="font-display font-semibold">Chcete dát vědět, až to zveřejníme?</h3>
          <p className="mt-1 max-w-prose text-sm">
            E-mail se uloží odděleně od vašeho hlasu, do jiné tabulky a bez jakékoli vazby
            na to, koho jste vybral. Spojit je nejde ani z databáze. Použijeme ho jednou —
            na pozvánku k povolebnímu hodnocení.
          </p>

          {emailUlozen ? (
            <p className="mt-3 popisek-uredni">Adresa uložena. Díky.</p>
          ) : (
            <form onSubmit={ulozEmail} className="mt-3 flex flex-wrap items-end gap-2">
              <div>
                <label htmlFor="email" className="popisek-uredni">
                  E-mail (nepovinné)
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-72 max-w-full border border-inkoust bg-papir px-3 py-2 font-mono text-sm"
                />
              </div>
              <button type="submit" className="border border-praha px-4 py-2 text-praha">
                Uložit
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={odesli} className="space-y-6 border border-inkoust p-5">
      <div>
        <label htmlFor="subjekt" className="popisek-uredni">
          Koho byste dnes volili do Zastupitelstva hl. m. Prahy
        </label>
        <select
          id="subjekt"
          name="subjekt"
          required
          className="mt-1 block w-full max-w-md border border-inkoust bg-papir px-3 py-2"
        >
          <option value="">— vyberte —</option>
          {subjekty.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.nazev}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="mestskaCast" className="popisek-uredni">
          Vaše městská část
        </label>
        <select
          id="mestskaCast"
          name="mestskaCast"
          required
          className="mt-1 block w-full max-w-md border border-inkoust bg-papir px-3 py-2"
        >
          <option value="">— vyberte —</option>
          {mestskeCasti.map((mc) => (
            <option key={mc.slug} value={mc.slug}>
              {mc.nazev}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="popisek-uredni">Věk</legend>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
          {VEKOVE_KATEGORIE.map((kategorie) => (
            <label key={kategorie} className="flex items-center gap-2 font-mono text-sm">
              <input type="radio" name="vekovaKategorie" value={kategorie} required />
              {kategorie}
            </label>
          ))}
        </div>
      </fieldset>

      {stav === 'chyba' && (
        <p role="alert" className="border border-praha px-3 py-2 text-sm text-praha">
          {chyba}
        </p>
      )}

      <button
        type="submit"
        disabled={stav === 'odesilam'}
        className="border border-praha px-5 py-2 text-praha disabled:opacity-50"
      >
        {stav === 'odesilam' ? 'Odesílám…' : 'Odeslat hlas'}
      </button>
    </form>
  )
}
