import { describe, expect, it } from 'vitest'
import {
  cisloOkrsku,
  dekodujCp1250,
  geometrieOkrsku,
  okrskyZeSpecialnihoVfr,
  oznaceniCisla,
  parseSestavuVO,
} from '../src/lib/ruian'

/** Hlavička a dva řádky ze skutečné sestavy pro Prahu 7 (7. 9. 2026). */
const HLAVICKA =
  'Kód ADM;Kód obce;Název obce;Kód MOMC;Název MOMC;Název MOP;Kód části obce;Název části obce;Název ulice;Typ SO;Číslo domovní;Číslo orientační;Znak čísla orientačního;PSČ;Souřadnice X;Souřadnice Y;Platí od;Jednořádková adresa;Číslo volebního okrsku'
const RADKY = [
  '22296361;554782;Praha;500186;Praha 7;Praha 7;490067;Holešovice;U elektrárny;č.p.;9;10,0;;17000;741272,24;1040840,65;29.06.2017;U elektrárny 9/10~Holešovice~17000 Praha 7;7001,0',
  '22312633;554782;Praha;500186;Praha 7;Praha 7;490067;Holešovice;Jankovcova;č.ev.;6;;;17000;;;01.07.2011;Jankovcova č.ev. 6~Holešovice~17000 Praha 7;',
  '21730660;554782;Praha;500054;Praha 1;Praha 1;490385;Hradčany;;č.p.;310;;;11800;742000,00;1042000,00;01.07.2011;Hradčany 310~11800 Praha 1;1001,0',
  '22000000;554782;Praha;500186;Praha 7;Praha 7;490067;Holešovice;Dělnická;č.p.;1;12,0;a;17000;741300,00;1040900,00;01.07.2011;Dělnická 1/12a~Holešovice~17000 Praha 7;7002,0',
]

describe('sestava adresních míst s okrsky', () => {
  it('čte číslo okrsku ve tvaru „7001,0"', () => {
    expect(cisloOkrsku('7001,0')).toBe(7001)
    expect(cisloOkrsku('')).toBeNull()
    expect(cisloOkrsku('x')).toBeNull()
  })

  it('dekóduje Windows-1250', () => {
    // „Řeporyje" v cp1250: Ř = 0xD8, ř… e-p-o-r-y-j-e
    const bajty = new Uint8Array([0xd8, 0x65, 0x70, 0x6f, 0x72, 0x79, 0x6a, 0x65])
    expect(dekodujCp1250(bajty)).toBe('Řeporyje')
  })

  it('parsuje řádky včetně souřadnic a chybějícího okrsku', () => {
    const adresy = parseSestavuVO([HLAVICKA, ...RADKY].join('\r\n') + '\r\n')
    expect(adresy).toHaveLength(4)

    const [elektrarna, jankovcova, hradcany, delnicka] = adresy
    expect(elektrarna).toMatchObject({
      adm: 22296361,
      kodMomc: '500186',
      ulice: 'U elektrárny',
      typ: 'č.p.',
      cisloDomovni: 9,
      cisloOrientacni: '10',
      psc: '17000',
      okrsek: 7001,
    })
    // Stejný bod, který ČÚZK vrací jako 50.1086967, 14.4384076.
    expect(elektrarna!.poloha!.lat).toBeCloseTo(50.108697, 5)
    expect(elektrarna!.poloha!.lon).toBeCloseTo(14.438408, 5)

    expect(jankovcova).toMatchObject({ typ: 'č.ev.', cisloDomovni: 6, okrsek: null, poloha: null })
    // Bez ulice se za název bere část obce — tak Pražan adresu píše.
    expect(hradcany).toMatchObject({ ulice: 'Hradčany', castObce: 'Hradčany', okrsek: 1001 })
    expect(delnicka).toMatchObject({ cisloOrientacni: '12a', okrsek: 7002 })
  })

  it('odmítne sestavu bez sloupce s okrskem', () => {
    expect(() => parseSestavuVO('Kód ADM;Kód MOMC;Název ulice\n1;2;3')).toThrow(/Číslo volebního okrsku/)
  })

  it('skládá číslo domu tak, jak se píše na obálku', () => {
    expect(oznaceniCisla({ typ: 'č.p.', cisloDomovni: 9, cisloOrientacni: '10' })).toBe('9/10')
    expect(oznaceniCisla({ typ: 'č.p.', cisloDomovni: 310, cisloOrientacni: '' })).toBe('310')
    expect(oznaceniCisla({ typ: 'č.ev.', cisloDomovni: 6, cisloOrientacni: '' })).toBe('č.ev. 6')
  })
})

const VO = (kod: number, cislo: number, momc: string, obec = '554782', navic = '') =>
  `<vf:VolebniOkrsek><vf:VO gml:id="VO.${kod}"><voi:PlatiOd>2026-02-05T00:00:00</voi:PlatiOd><voi:Geometrie><voi:DefinicniBod><gml:Point gml:id="DVO.${kod}" srsName="urn:ogc:def:crs:EPSG::5514" srsDimension="2"><gml:pos>-741272.24 -1040840.65</gml:pos></gml:Point></voi:DefinicniBod><voi:OriginalniHranice><gml:MultiSurface gml:id="HVO.1" srsName="urn:ogc:def:crs:EPSG::5514" srsDimension="2"><gml:surfaceMember><gml:Polygon gml:id="HVO.1.1"><gml:exterior><gml:LinearRing><gml:posList>-741000 -1040000 -741100 -1040000 -741100 -1040100 -741000 -1040000</gml:posList></gml:LinearRing></gml:exterior><gml:interior><gml:LinearRing><gml:posList>-741050 -1040020 -741060 -1040020 -741060 -1040030 -741050 -1040020</gml:posList></gml:LinearRing></gml:interior></gml:Polygon></gml:surfaceMember><gml:surfaceMember><gml:Polygon gml:id="HVO.1.2"><gml:exterior><gml:LinearRing><gml:posList>-742000 -1041000 -742100 -1041000 -742100 -1041100 -742000 -1041000</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon></gml:surfaceMember></gml:MultiSurface></voi:OriginalniHranice></voi:Geometrie><voi:Kod>${kod}</voi:Kod><voi:Cislo>${cislo}</voi:Cislo><voi:Obec><obi:Kod>${obec}</obi:Kod></voi:Obec><voi:Momc><mci:Kod>${momc}</mci:Kod></voi:Momc>${navic}</vf:VO></vf:VolebniOkrsek>`

describe('speciální VFR ST_UVOH', () => {
  const xml = `<vf:Data>${VO(27037, 7001, '500186')}${VO(1, 1, '', '531057')}${VO(
    27038,
    9001,
    '500216',
    '554782',
    '<voi:Poznamka>Volební místnost: SOU služeb, Novovysočanská 501/5 &amp; spol.</voi:Poznamka>',
  )}</vf:Data>`

  it('vybere jen okrsky dané obce', () => {
    const okrsky = okrskyZeSpecialnihoVfr(xml, '554782')
    expect(okrsky.map((o) => o.cislo)).toEqual([7001, 9001])
    expect(okrsky[0]).toMatchObject({ kod: 27037, kodMomc: '500186', platiOd: '2026-02-05' })
    expect(okrsky[0]!.stred).toEqual({ x: -741272.24, y: -1040840.65 })
  })

  it('čte vnější i vnitřní prstence a více polygonů', () => {
    const [okrsek] = okrskyZeSpecialnihoVfr(xml, '554782')
    expect(okrsek!.polygony).toHaveLength(2)
    expect(okrsek!.polygony[0]).toHaveLength(2)
    expect(okrsek!.polygony[0]![0]![0]).toEqual([-741000, -1040000])
    expect(okrsek!.polygony[1]).toHaveLength(1)
  })

  it('dekóduje XML entity v poznámce', () => {
    const okrsky = okrskyZeSpecialnihoVfr(xml, '554782')
    expect(okrsky[1]!.poznamka).toBe('Volební místnost: SOU služeb, Novovysočanská 501/5 & spol.')
    expect(okrsky[0]!.poznamka).toBeUndefined()
  })

  it('převádí geometrii na GeoJSON ve WGS84', () => {
    const [okrsek] = okrskyZeSpecialnihoVfr(xml, '554782')
    const geometrie = geometrieOkrsku(okrsek!.polygony)
    expect(geometrie.type).toBe('MultiPolygon')
    const jeden = geometrieOkrsku([okrsek!.polygony[0]!])
    expect(jeden.type).toBe('Polygon')
    const [lon, lat] = (jeden as { coordinates: [number, number][][] }).coordinates[0]![0]!
    expect(lon).toBeGreaterThan(14.4)
    expect(lon).toBeLessThan(14.5)
    expect(lat).toBeGreaterThan(50.1)
    expect(lat).toBeLessThan(50.2)
  })
})
