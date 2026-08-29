import * as runtime from 'react/jsx-runtime'
import { slugify } from '@/lib/slug'

/**
 * Renderer zkompilovaného MDX z Velite. Kód se vyhodnocuje při renderu na serveru,
 * do prohlížeče se posílá jen výsledné HTML.
 *
 * Nadpisy dostávají identifikátor odvozený z textu, aby se na sekce dlouhých
 * referenčních stránek dalo odkázat. Počítá se stejnou funkcí jako obsah
 * stránky v `src/lib/nadpisy.ts` — jinak by kotvy a odkazy neseděly.
 */

function textUzlu(deti: React.ReactNode): string {
  if (typeof deti === 'string' || typeof deti === 'number') return String(deti)
  if (Array.isArray(deti)) return deti.map(textUzlu).join('')
  if (deti && typeof deti === 'object' && 'props' in deti) {
    return textUzlu((deti as { props: { children?: React.ReactNode } }).props.children)
  }
  return ''
}

type VlastnostiNadpisu = React.ComponentPropsWithoutRef<'h2'>

function nadpisSId(Znacka: 'h2' | 'h3') {
  const Komponenta = ({ children, id, ...zbytek }: VlastnostiNadpisu) => (
    <Znacka id={id ?? slugify(textUzlu(children))} className="scroll-mt-20" {...zbytek}>
      {children}
    </Znacka>
  )
  Komponenta.displayName = `Nadpis${Znacka}`
  return Komponenta
}

const KOMPONENTY = { h2: nadpisSId('h2'), h3: nadpisSId('h3') }

export function MDXContent({ code }: { code: string }) {
  const Component = new Function(code)({ ...runtime }).default as React.ComponentType<{
    components?: Record<string, React.ComponentType<VlastnostiNadpisu>>
  }>
  return <Component components={KOMPONENTY} />
}
