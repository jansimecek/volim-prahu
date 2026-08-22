import * as runtime from 'react/jsx-runtime'

/**
 * Renderer zkompilovaného MDX z Velite. Kód se vyhodnocuje při renderu na serveru,
 * do prohlížeče se posílá jen výsledné HTML.
 */
export function MDXContent({ code }: { code: string }) {
  const Component = new Function(code)({ ...runtime }).default as React.ComponentType
  return <Component />
}
