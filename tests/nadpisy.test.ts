import { describe, expect, it } from 'vitest'
import { nadpisyStranky } from '../src/lib/nadpisy'
import { slugify } from '../src/lib/slug'

describe('obsah dlouhé stránky', () => {
  it('vybere nadpisy druhé úrovně a odvodí z nich kotvy', () => {
    const nadpisy = nadpisyStranky('Úvod\n\n## Kdo jsme\n\ntext\n\n## Ochrana údajů\n')
    expect(nadpisy).toEqual([
      { id: 'kdo-jsme', text: 'Kdo jsme', uroven: 2 },
      { id: 'ochrana-udaju', text: 'Ochrana údajů', uroven: 2 },
    ])
  })

  it('ignoruje nadpisy uvnitř bloku kódu', () => {
    const nadpisy = nadpisyStranky('```\n## tohle je komentář\n```\n\n## Skutečný nadpis\n')
    expect(nadpisy.map((n) => n.text)).toEqual(['Skutečný nadpis'])
  })

  it('do obsahu bere jen text, ne markdownové značky', () => {
    const nadpisy = nadpisyStranky('## Co je **důležité** a [odkaz](https://example.com)\n')
    expect(nadpisy[0]!.text).toBe('Co je důležité a odkaz')
  })

  it('nebere první úroveň ani třetí — obsah má být jednoúrovňový', () => {
    expect(nadpisyStranky('# Titulek\n### Podsekce\n')).toEqual([])
  })

  it('kotvy odpovídají identifikátorům, které vyrábí renderer MDX', () => {
    // Obsah i nadpis počítají id stejnou funkcí; kdyby se rozešly,
    // odkazy v obsahu by vedly nikam.
    const nadpisy = nadpisyStranky('## Kdo o čem rozhoduje\n')
    expect(nadpisy[0]!.id).toBe(slugify('Kdo o čem rozhoduje'))
  })
})
