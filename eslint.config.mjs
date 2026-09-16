import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const konfigurace = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    /**
     * `.claude/**` kvůli pracovním stromům: `git worktree` je zakládá uvnitř
     * repa a v každém je vlastní `.next`. Vzor `.next/**` platí jen pro
     * kořen, takže eslint jinak lintuje výstup turbopacku ze sousedních
     * větví a `pnpm lint` lokálně spadne na stovkách chyb v cizím buildu.
     * Na CI se to neprojeví — čerstvý klon žádný pracovní strom nemá.
     */
    ignores: ['.next/**', '.velite/**', 'node_modules/**', 'data/**', 'public/**', '.claude/**'],
  },
]

export default konfigurace
