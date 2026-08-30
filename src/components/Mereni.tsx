'use client'

import { Analytics } from '@vercel/analytics/next'

/**
 * Měření návštěvnosti (Vercel Web Analytics).
 *
 * Nástroj sám nepoužívá cookies a návštěvníka identifikuje otiskem
 * odvozeným z požadavku, který se po 24 hodinách zahazuje. I tak platí,
 * že web, který jinde slibuje neukládat nic, čím by šlo čtenáře rozpoznat,
 * nemůže signál „nesledujte mě" ignorovat.
 *
 * Respektujeme proto Global Privacy Control i Do Not Track. Když je
 * prohlížeč posílá, událost se nikam neodešle — `beforeSend` vrátí null.
 * Není to zákonná povinnost, je to důsledek toho, co web tvrdí o sobě.
 */
function odmitaSledovani(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  const okno = typeof window !== 'undefined' ? (window as Window & { doNotTrack?: string }) : undefined
  return (
    nav.globalPrivacyControl === true ||
    nav.doNotTrack === '1' ||
    nav.msDoNotTrack === '1' ||
    okno?.doNotTrack === '1'
  )
}

export function Mereni() {
  return <Analytics beforeSend={(udalost) => (odmitaSledovani() ? null : udalost)} />
}
