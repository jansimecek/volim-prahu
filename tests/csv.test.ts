import { describe, expect, it } from 'vitest'
import { parseCsv, parseCsvObjects } from '../src/lib/csv'

describe('parseCsv', () => {
  it('čte prostý řádek', () => {
    expect(parseCsv('a,b,c')).toEqual([['a', 'b', 'c']])
  })

  it('zachová čárku uvnitř uvozovek', () => {
    expect(parseCsv('1,"radní Prahy 7, ekolog",43')).toEqual([
      ['1', 'radní Prahy 7, ekolog', '43'],
    ])
  })

  it('zvládne zdvojené uvozovky a CRLF', () => {
    expect(parseCsv('a,"řekl ""ne""" \r\nb,c'.replace(' \r\n', '\r\n'))).toEqual([
      ['a', 'řekl "ne"'],
      ['b', 'c'],
    ])
  })

  it('odstraní BOM', () => {
    expect(parseCsv('﻿a,b')).toEqual([['a', 'b']])
  })

  it('mapuje na objekty podle hlavičky', () => {
    const radky = parseCsvObjects('JMENO,PRIJMENI,VEK\n"Ondřej","Mirovský",43\n')
    expect(radky).toEqual([{ JMENO: 'Ondřej', PRIJMENI: 'Mirovský', VEK: '43' }])
  })
})
