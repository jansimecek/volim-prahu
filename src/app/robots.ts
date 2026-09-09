import type { MetadataRoute } from 'next'
import { ZAKLAD_WEBU } from '@/lib/web'

/**
 * Web je veřejný průvodce a chce být k nalezení — pro vyhledávače i pro
 * jazykové modely, které lidem odpovídají na otázky o volbách. Zakazuje
 * se jen API (surová data mají vlastní vstup přes /llms.txt) a vyhledávání,
 * které nemá vlastní obsah.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/hledani'] }],
    sitemap: `${ZAKLAD_WEBU}/sitemap.xml`,
    host: ZAKLAD_WEBU,
  }
}
