import { rozmeryObrazku, type ObrazekZpravicky as Data } from '@/lib/zpravicky'

/**
 * Obrázek u zprávičky.
 *
 * Záměrně obyčejný <img>, ne next/image: obrázky sem chodí hotové z Vercel
 * Blobu nebo z repozitáře, optimalizátor by je jen přeposílal za peníze.
 * Rozměry jsou povinné ve schématu, takže si prohlížeč rezervuje místo
 * dopředu a stránka při načtení nepodskočí.
 *
 * Popis původu se zobrazuje vždycky. Fotka je cizí práce a web, který
 * u každého čísla uvádí zdroj, ho nemůže u fotky vynechat.
 */
export function ObrazekZpravicky({ obrazek }: { obrazek: Data }) {
  const rozmery = rozmeryObrazku(obrazek)
  if (!rozmery) return null

  return (
    <figure className="mt-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- viz komentář výše:
          obrázky jsou hotové a rozměry známé, optimalizátor by je jen přeposílal. */}
      <img
        src={rozmery.src}
        width={rozmery.sirka}
        height={rozmery.vyska}
        alt={obrazek.alt}
        loading="lazy"
        decoding="async"
        className="h-auto w-full max-w-2xl border border-linka-silna bg-papir-tmavsi"
      />
      <figcaption className="mt-2 max-w-2xl text-sm text-seda-uredni">
        {obrazek.popisek && <span className="block">{obrazek.popisek}</span>}
        <span className="popisek-uredni mt-1 block">
          Foto: {obrazek.zdrojUrl ? (
            <a href={obrazek.zdrojUrl} className="underline" rel="noopener">
              {obrazek.zdroj}
            </a>
          ) : (
            obrazek.zdroj
          )}
          {obrazek.licence && ` · ${obrazek.licence}`}
        </span>
      </figcaption>
    </figure>
  )
}
