import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const konfigurace = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', '.velite/**', 'node_modules/**', 'data/**', 'public/**'],
  },
]

export default konfigurace
