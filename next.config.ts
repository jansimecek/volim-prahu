import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Obsah se kompiluje samostatným během `velite` před `next build`
  // (viz package.json scripts) — nezávisle na bundleru.
  typedRoutes: true,
  experimental: {
    optimizePackageImports: ['minisearch'],
  },
  /**
   * Rubrika se přejmenovala ze „zpráviček" na „Aktuálně". Staré adresy už
   * jsou venku — jedna je v RSS kanálu, který si mohl někdo přidat do čtečky
   * — takže musí vést dál, ne na 404. Trvalé přesměrování, protože změna
   * je trvalá.
   */
  async redirects() {
    return [
      { source: '/zpravicky', destination: '/aktualne', permanent: true },
      { source: '/zpravicky/feed.xml', destination: '/aktualne/feed.xml', permanent: true },
      { source: '/zpravicky/strana/:cislo', destination: '/aktualne/strana/:cislo', permanent: true },
      { source: '/zpravicky/:slug', destination: '/aktualne/:slug', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

export default nextConfig
