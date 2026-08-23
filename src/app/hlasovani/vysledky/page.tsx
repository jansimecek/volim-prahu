import type { Metadata } from 'next'
import Link from 'next/link'
import { KONEC_VOLEB, vysledkyZverejnitelne } from '@/lib/hlasovani'
import { nactiUloziste } from '@/lib/uloziste'

export const metadata: Metadata = {
  title: 'Výsledky ankety',
  description: 'Souhrn ankety čtenářů, zveřejněný po zavření volebních místností.',
}

export const revalidate = 300

const formatDatumu = new Intl.DateTimeFormat('cs-CZ', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Prague',
})

export default async function StrankaVysledkuAnkety() {
  // Jediná brána. Kdyby se někdo dostal na URL dřív, data se prostě nenačtou.
  if (!vysledkyZverejnitelne()) {
    return (
      <div className="max-w-prose space-y-5">
        <h1 className="text-4xl">Výsledky ankety</h1>
        <p className="border-l-2 border-praha pl-5">
          Zatím nezveřejňujeme nic. Souhrn ankety vydáme až po zavření volebních místností,
          tedy {formatDatumu.format(KONEC_VOLEB)}.
        </p>
        <p>
          Není to opatrnost navíc: anketa, jejíž průběžné výsledky jsou vidět, začne volby
          ovlivňovat, i když to nikdo nezamýšlel. Do té doby si u nás žádné číslo nepřečtete
          ani vy, ani my.
        </p>
        <p>
          <Link href="/hlasovani" className="odkaz-akcent">
            Zpět na anketu
          </Link>
        </p>
      </div>
    )
  }

  const souhrn = await nactiUloziste().then((u) => u.souhrn())
  const celkem = souhrn.reduce((n, r) => n + r.pocet, 0)

  const podleSubjektu = new Map<string, number>()
  for (const radek of souhrn) {
    podleSubjektu.set(radek.subjekt, (podleSubjektu.get(radek.subjekt) ?? 0) + radek.pocet)
  }
  const poradi = [...podleSubjektu.entries()].sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-8">
      <header className="max-w-prose">
        <h1 className="text-4xl">Výsledky ankety</h1>
        <p className="mt-3">
          Anketa čtenářů, ne průzkum. Hlasovali lidé, kteří na web sami přišli — vzorek není
          reprezentativní a čísla neříkají, jak volby dopadly. K tomu slouží{' '}
          <a href="https://www.volby.cz" className="odkaz-akcent" rel="noopener">
            oficiální výsledky ČSÚ
          </a>
          .
        </p>
      </header>

      <p className="popisek-uredni">Celkem hlasů: {celkem}</p>

      {poradi.length === 0 ? (
        <p>Anketa nezaznamenala žádné hlasy.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-inkoust">
              <th className="popisek-uredni py-2">Subjekt</th>
              <th className="popisek-uredni py-2 text-right">Hlasů</th>
              <th className="popisek-uredni py-2 text-right">Podíl</th>
            </tr>
          </thead>
          <tbody>
            {poradi.map(([subjekt, pocet]) => (
              <tr key={subjekt} className="border-b border-linka">
                <td className="py-2">{subjekt}</td>
                <td className="py-2 text-right font-mono">{pocet}</td>
                <td className="py-2 text-right font-mono">
                  {celkem > 0 ? ((pocet / celkem) * 100).toFixed(1) : '0,0'} %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
