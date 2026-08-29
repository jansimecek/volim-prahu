import { kompetence } from '#content'

type Uroven = (typeof kompetence.agendy)[number]['uroven']

const SKUPINY: { uroven: Uroven; nadpis: string; popis: string }[] = [
  {
    uroven: 'magistrat',
    nadpis: 'Rozhoduje magistrát',
    popis: 'Zastupitelstvo hlavního města Prahy. Městská část to může prosazovat, ale sama neprosadí.',
  },
  {
    uroven: 'mestska-cast',
    nadpis: 'Rozhoduje městská část',
    popis: 'Zastupitelstvo vaší městské části. Tady má radnice skutečně volné ruce.',
  },
  {
    uroven: 'sdilene',
    nadpis: 'Sdílené',
    popis: 'Rozhodnutí je rozdělené mezi obě úrovně — často podle toho, co komu svěřil Statut.',
  },
  {
    uroven: 'mimo-samospravu',
    nadpis: 'Mimo samosprávu',
    popis: 'Rozhoduje správní úřad, stát nebo soud. Zastupitelstvo to hlasováním nezmění.',
  },
]

export function KompetencniMatice() {
  return (
    <div className="space-y-14">
      {SKUPINY.map((skupina) => {
        const agendy = kompetence.agendy.filter((a) => a.uroven === skupina.uroven)
        if (agendy.length === 0) return null

        return (
          <section key={skupina.uroven} id={skupina.uroven}>
            <h2 className="text-2xl">{skupina.nadpis}</h2>
            <p className="mt-1 max-w-prose text-sm text-seda-uredni">{skupina.popis}</p>

            <div className="mt-5 border-t border-inkoust">
              {agendy.map((agenda) => (
                <article
                  key={agenda.id}
                  id={agenda.id}
                  className="border-b border-linka-silna py-5 scroll-mt-20"
                >
                  <h3 className="font-display text-lg font-semibold">{agenda.nazev}</h3>
                  <p className="mt-1 max-w-prose">{agenda.vysvetleni}</p>

                  {agenda.omyl && (
                    <p className="mt-3 max-w-prose border-l-2 border-okr pl-4 text-sm">
                      <span className="popisek-uredni block">Častý omyl</span>
                      {agenda.omyl}
                    </p>
                  )}

                  <ul className="mt-3">
                    {agenda.opora.map((o) => (
                      <li key={o.text} className="text-sm">
                        <a
                          href={o.url}
                          className="odkaz-akcent inline-block py-1"
                          rel="noopener"
                        >
                          {o.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
