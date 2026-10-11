import Link from 'next/link'

/**
 * Praktické informace ke druhému kolu senátních voleb. Každý bod je
 * z platného znění zákona — u voliče rozhodují detaily (barva lístků,
 * kdo smí volit), a ty se nesmí plést s komunálními volbami týden předtím.
 */
const ZDROJE = {
  senat: 'https://www.zakonyprolidi.cz/cs/1995-247',
  sprava: 'https://www.zakonyprolidi.cz/cs/2024-88',
}

export function DruheKoloSenatu() {
  return (
    <section aria-labelledby="jak-volit" className="border border-inkoust bg-papir p-5 sm:p-8">
      <p className="popisek-uredni">Druhé kolo · pátek 16. a sobota 17. října 2026</p>
      <h2 id="jak-volit" className="mt-1 text-2xl">
        Jak se volí ve druhém kole
      </h2>
      <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <Bod nadpis="Kdy">
          V pátek od 14 do 22 hodin a v sobotu od 8 do 14 hodin. Svou volební místnost podle
          adresy najdete na stránce <Link href="/kde-volim" className="odkaz-akcent">Kde volím</Link>;
          závazné je oznámení na úřední desce městské části.
        </Bod>
        <Bod nadpis="Kdo může volit">
          Občan ČR s trvalým pobytem v jednom ze tří obvodů, kterému bude nejpozději v sobotu
          17. října 18 let. Nezáleží na tom, jestli jste volili v prvním kole. Občané jiných zemí
          EU senátora nevolí — to je rozdíl oproti komunálním volbám.
        </Bod>
        <Bod nadpis="Hlasovací lístky">
          Domů nepřijdou. Dostanete je až ve volební místnosti a jsou na papíře jiné barvy než
          v prvním kole. Na lístku jsou jen dva kandidáti.
        </Bod>
        <Bod nadpis="Co si vzít">
          Občanský průkaz nebo cestovní pas. Kdo má voličský průkaz z prvního kola, platí mu
          i pro druhé, pokud si ho nevyžádal jen na jedno kolo.
        </Bod>
        <Bod nadpis="Kdo vyhraje">
          Kandidát s víc platnými hlasy, nadpoloviční většina už potřeba není. Při rovnosti hlasů
          nebyl zvolen nikdo a volby se opakují.
        </Bod>
        <Bod nadpis="Kde se nevolí">
          Ve druhém kole se volí jen senátor. Zastupitelstva jsou zvolená a lístky na ně se už
          nevydávají. Mimo tři obvody níže se nevolí vůbec.
        </Bod>
      </dl>
      <p className="popisek-uredni mt-5">
        Podle{' '}
        <a href={ZDROJE.senat} className="underline" rel="noopener">
          § 1 odst. 4 a § 76 zákona č. 247/1995 Sb.
        </a>{' '}
        a{' '}
        <a href={ZDROJE.sprava} className="underline" rel="noopener">
          § 49 a § 57 zákona č. 88/2024 Sb.
        </a>{' '}
        (hodiny hlasování tamtéž, § 2)
      </p>
    </section>
  )
}

function Bod({ nadpis, children }: { nadpis: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-display font-medium">{nadpis}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}
