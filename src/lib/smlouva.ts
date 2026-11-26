import { smlouva } from '#content'

type Smlouva = typeof smlouva
export type Kapitola = Smlouva['kapitoly'][number]
export type Oddil = Kapitola['oddily'][number]
export type Zavazek = Oddil['zavazky'][number]

export type ZavazekVKontextu = Zavazek & { kapitola: Kapitola; oddil: Oddil }

export function vsechnyZavazky(): ZavazekVKontextu[] {
  return smlouva.kapitoly.flatMap((kapitola) =>
    kapitola.oddily.flatMap((oddil) => oddil.zavazky.map((z) => ({ ...z, kapitola, oddil }))),
  )
}

/*
 * Strojové rozpoznání vlastností textu. Je hrubé záměrně: počítá, co v textu
 * stojí, ne co závazek znamená. Ruční rozbor patří do `analyza`.
 */

/** Číslice v textu — počet bytů, korun, míst, letopočet. Nezahrnuje „Metro D“ ani „A1–A9“ bez čísla. */
export const maCislo = (text: string) => /\d/.test(text)

/** Letopočet 2026–2039: termín, do kdy se má něco stát. */
export const maLetopocet = (text: string) => /\b20[23]\d\b/.test(text)

/**
 * Závazek něco teprve prověřit, analyzovat nebo připravit studii. Takový slib
 * se splní vydáním podkladu, ne stavbou ani změnou pravidla — pro čtenáře je
 * to podstatný rozdíl, proto ho počítáme zvlášť.
 */
export const jeProverovaci = (text: string) =>
  // Jen slib v první osobě („prověříme“) nebo studie. Trpné „budou prověřeny
  // analýzou“ stojí u závazků, které slibují stavět, a ty sem nepatří.
  /(?<!\p{L})(prověříme|prověřit|zanalyzujeme|vyhodnotíme|vyhodnotit|studi\p{L}*)/iu.test(text)

/** Závazek s výslovnou podmínkou mimo moc koalice (zákon, stát, shoda partnerů). */
export const jePodmineny = (text: string) =>
  /(umožní-li|v případě shody|budeme usilovat o (finanční )?podporu státu|od státu budeme požadovat)/iu.test(text)

export type MereniSmlouvy = {
  celkem: number
  /** Bez téměř doslovných opakování (`opakuje`). */
  jedinecnych: number
  sCislem: number
  sLetopoctem: number
  proverovacich: number
  podminenych: number
  analyzovanych: number
}

export function mereniSmlouvy(zavazky: readonly Zavazek[] = vsechnyZavazky()): MereniSmlouvy {
  const jedinecne = zavazky.filter((z) => !z.opakuje)
  const pocet = (f: (t: string) => boolean) => jedinecne.filter((z) => f(z.zneni)).length
  return {
    celkem: zavazky.length,
    jedinecnych: jedinecne.length,
    sCislem: pocet(maCislo),
    sLetopoctem: pocet(maLetopocet),
    proverovacich: pocet(jeProverovaci),
    podminenych: pocet(jePodmineny),
    analyzovanych: zavazky.filter((z) => z.analyza).length,
  }
}

/** Oddíly smlouvy, za které podle gescí odpovídá daný radní. */
export function oddilyRadniho(jmeno: string): { kapitola: Kapitola; oddil: Oddil }[] {
  return smlouva.kapitoly.flatMap((kapitola) =>
    kapitola.oddily.filter((o) => o.radni.includes(jmeno)).map((oddil) => ({ kapitola, oddil })),
  )
}

export function zavazekPodleId(id: string): ZavazekVKontextu | undefined {
  return vsechnyZavazky().find((z) => z.id === id)
}

export { smlouva }
