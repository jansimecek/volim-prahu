'use client'

import { useSyncExternalStore } from 'react'
import { sklonuj } from '@/lib/cestina'
import { KONEC_HLASOVANI, ZACATEK_VOLEB } from '@/lib/rezim'

/**
 * Odpočet do otevření volebních místností, během voleb do jejich uzavření.
 *
 * Čas se počítá jen v prohlížeči. Server a první vykreslení ukazují pevnou
 * větu s termínem, aby stránka uložená v cache nenesla zastaralá čísla
 * a hydratace nehlásila nesoulad. Po skončení hlasování odpočet zmizí —
 * o fázi voleb pak mluví pruh nahoře na stránce.
 *
 * `role="timer"` má implicitně `aria-live="off"`: odečítač obrazovky čísla
 * přečte, když na ně čtenář přijde, ale každou sekundu je nehlásí.
 */

type Zbyva = { dny: number; hodiny: number; minuty: number; sekundy: number }

function rozloz(ms: number): Zbyva {
  const s = Math.max(0, Math.floor(ms / 1000))
  return {
    dny: Math.floor(s / 86400),
    hodiny: Math.floor((s % 86400) / 3600),
    minuty: Math.floor((s % 3600) / 60),
    sekundy: s % 60,
  }
}

function odebirej(zmena: () => void): () => void {
  const id = window.setInterval(zmena, 1000)
  return () => window.clearInterval(id)
}

/** Zaokrouhleno na sekundy, aby dvě čtení v téže sekundě vrátila totéž. */
const casVProhlizeci = (): number => Math.floor(Date.now() / 1000) * 1000
const casNaServeru = (): null => null

export function Odpocet() {
  const ted = useSyncExternalStore<number | null>(odebirej, casVProhlizeci, casNaServeru)

  if (ted !== null && ted >= KONEC_HLASOVANI.getTime()) return null

  const behemVoleb = ted !== null && ted >= ZACATEK_VOLEB.getTime()
  const cil = behemVoleb ? KONEC_HLASOVANI : ZACATEK_VOLEB
  const nadpis = behemVoleb
    ? 'Do uzavření volebních místností zbývá'
    : 'Do otevření volebních místností zbývá'

  return (
    <div className="border border-inkoust bg-papir p-4 sm:p-5">
      <p className="popisek-uredni">{nadpis}</p>
      {ted === null ? (
        <p className="mt-2 text-lg">
          Místnosti se otevírají v pátek 9.&nbsp;října ve 14:00 a zavírají v sobotu
          10.&nbsp;října ve 14:00.
        </p>
      ) : (
        <Cisla zbyva={rozloz(cil.getTime() - ted)} />
      )}
      {behemVoleb && (
        <p className="mt-3 max-w-prose text-sm">
          V noci z pátku na sobotu jsou místnosti zavřené: v pátek se volí do 22:00,
          v sobotu od 8:00.
        </p>
      )}
    </div>
  )
}

function Cisla({ zbyva }: { zbyva: Zbyva }) {
  const casti: [number, string][] = [
    [zbyva.dny, sklonuj(zbyva.dny, 'den', 'dny', 'dní')],
    [zbyva.hodiny, sklonuj(zbyva.hodiny, 'hodina', 'hodiny', 'hodin')],
    [zbyva.minuty, sklonuj(zbyva.minuty, 'minuta', 'minuty', 'minut')],
    [zbyva.sekundy, sklonuj(zbyva.sekundy, 'sekunda', 'sekundy', 'sekund')],
  ]
  const veta = casti
    .slice(0, 3)
    .map(([n, slovo]) => `${n} ${slovo}`)
    .join(', ')

  return (
    <div role="timer" aria-label={`Zbývá ${veta}`} className="mt-2">
      <ol aria-hidden="true" className="flex flex-wrap gap-x-6 gap-y-2">
        {casti.map(([n, slovo], i) => (
          <li key={i} className="flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-semibold tabular-nums sm:text-5xl">
              {String(n).padStart(2, '0')}
            </span>
            <span>{slovo}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
