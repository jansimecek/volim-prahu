import type { Metadata } from 'next'
import { ObsahNenalezeno } from '@/components/ObsahNenalezeno'

export const metadata: Metadata = {
  title: 'Stránka nenalezena',
}

/** 404 uvnitř české sekce — hlavička, patička a navigace zůstávají. */
export default function Nenalezeno() {
  return <ObsahNenalezeno />
}
