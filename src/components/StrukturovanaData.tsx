/**
 * JSON-LD pro vyhledávače a jazykové modely. Vkládá se jen tam, kde má
 * stránka jednoznačný typ (web, článek, drobečky, osoba, událost) —
 * strukturovaná data, která by tvrdila víc než stránka sama, by byla lež
 * strojům místo lidem.
 *
 * `<` se escapuje, aby text z obsahu nemohl ukončit script.
 */
export function StrukturovanaData({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
