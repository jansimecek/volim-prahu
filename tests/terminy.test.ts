import { describe, expect, it } from 'vitest'
import { lhutyUstavujichZasedani } from '../src/lib/terminy'

describe('lhůty ustavujících zasedání', () => {
  it('bez vyhlášení výsledků nic nepočítá', () => {
    expect(lhutyUstavujichZasedani(null)).toBeNull()
  })

  it('návrh soudu do 10 dnů, zasedání do dalších 15', () => {
    // Kontrolní příklad: vyhlášení v úterý 13. 10. → návrh do 23. 10. → zasedání do 7. 11.
    expect(lhutyUstavujichZasedani('2026-10-13')).toEqual({
      vyhlaseno: '2026-10-13',
      navrhSouduDo: '2026-10-23',
      zasedaniNejpozdeji: '2026-11-07',
    })
  })

  it('přechod na zimní čas datum neposune', () => {
    // 25. 10. 2026 končí letní čas; výpočet běží v UTC, takže den nepřeskočí.
    expect(lhutyUstavujichZasedani('2026-10-20')?.zasedaniNejpozdeji).toBe('2026-11-14')
  })
})
