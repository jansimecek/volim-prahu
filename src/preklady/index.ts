import type { Jazyk } from '@/lib/jazyky'
import { en } from './en'
import { sk } from './sk'
import { uk } from './uk'
import type { Preklad } from './typy'

export type { Preklad }

const PREKLADY: Record<Jazyk, Preklad> = { en, uk, sk }

export function preklad(jazyk: Jazyk): Preklad {
  return PREKLADY[jazyk]
}

export { PREKLADY }
