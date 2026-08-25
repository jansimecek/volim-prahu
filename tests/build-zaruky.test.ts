import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Velite bez přepínače --strict chyby schématu jen vypíše a skončí s kódem 0.
 * Build pak projde i s hodnocením bez zdrojů, což je přesně to, čemu má celý
 * validační rámec zabránit. Tenhle test hlídá, aby přepínač nikdo nesmazal.
 */
const KOREN = join(__dirname, '..')
const balicek = JSON.parse(readFileSync(join(KOREN, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>
}

describe('vynucení validace obsahu při buildu', () => {
  it.each(['build', 'dev', 'content'])('skript "%s" spouští velite se --strict', (nazev) => {
    const skript = balicek.scripts[nazev]
    expect(skript, `chybí skript ${nazev}`).toBeDefined()
    expect(skript).toContain('velite')
    expect(skript).toContain('--strict')
  })

  it('CI kompiluje obsah rovněž ve strict režimu', () => {
    const ci = readFileSync(join(KOREN, '.github/workflows/ci.yml'), 'utf8')
    const radky = ci.split('\n').filter((r) => r.includes('velite'))
    expect(radky.length).toBeGreaterThan(0)
    for (const radek of radky) expect(radek).toContain('--strict')
  })

  it('produkční build na Vercelu jde přes pnpm build, ne přímo next build', () => {
    const vercel = JSON.parse(readFileSync(join(KOREN, 'vercel.json'), 'utf8')) as {
      buildCommand?: string
    }
    expect(vercel.buildCommand).toBe('pnpm build')
  })
})
