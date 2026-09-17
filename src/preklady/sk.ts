import type { Preklad } from './typy'

/**
 * Slovenská verzia.
 *
 * Slováci jsou největší skupina občanů EU s pobytem v Praze, takže tohle
 * je ze všech jazykových verzí ta, za kterou je nejvíc lidí, kteří
 * skutečně volit smějí. Že většina z nich česky rozumí, není důvod verzi
 * nemít: informace o právu, které člověk netuší, že má, se čte jinak
 * v mateřštině než v cizím jazyce, kterému „jen rozumí".
 *
 * Právní termíny zůstávají v závorkách česky tam, kde je člověk musí
 * poznat na dokladu nebo na úřední desce. Slovenština je češtině blízká,
 * takže je pokušení je nechat plavat — ale „osvedčenie o registrácii" na
 * české úřední desce nestojí.
 */
const ZDROJE_MISTNOSTI = {
  'oznameni-2026':
    'Podľa dokumentu mestskej časti k voľbám 2026 — sídlo okrsku z úradnej tabule',
  'drivejsi-volby': 'Údaj z predchádzajúcich volieb — do 24. 9. 2026 sa môže zmeniť',
  ruian: 'Poznámka mestskej časti v registri RÚIAN — nie je to oznámenie pre rok 2026',
}

export const sk: Preklad = {
  htmlLang: 'sk',
  smerCteni: 'ltr',
  formatLocale: 'sk-SK',

  meta: {
    nazevWebu: 'Volím Prahu',
    podtitul: 'Voľby v Prahe 2026',
    popisSekce:
      'Kto môže voliť v komunálnych voľbách v Prahe 9.–10. októbra 2026, kde a ako voliť a o čom v skutočnosti rozhoduje magistrát a o čom mestská časť.',
  },

  chrome: {
    preskocit: 'Preskočiť na obsah',
    menuTlacitko: 'Menu',
    hlavniNavigace: 'Hlavná navigácia',
    patickaNavigace: 'Pätička',
    prepinacJazyka: 'Jazyk',
    zpetDoCestiny: 'Celý web česky',
    zpetDoCestinyPopis: 'Kandidáti, programy a ich hodnotenia sú len po česky.',
    navigace: {
      index: 'Začnite tu',
      'can-i-vote': 'Môžem voliť?',
      'where-do-i-vote': 'Kde volím?',
      'how-to-vote': 'Ako voliť',
      'what-is-decided': 'Čo volíte',
      'who-is-running': 'Kto kandiduje',
    },
    rozsahPrekladu:
      'Po slovensky je len táto sekcia. Zvyšok webu — profily kandidátov, programy strán a naše hodnotenia — je po česky.',
    patickaPopis:
      'Nezávislý sprievodca komunálnymi a senátnymi voľbami v Prahe 9.–10. októbra 2026. Nikoho neodporúča ani neodrádza od voľby; popisuje, čo ktorá úroveň samosprávy dokáže splniť.',
    pravniZaklad: 'Právny základ',
    aktualizovano: 'Overené',
    kontakt: 'Našli ste chybu? Napíšte na',
  },

  spolecne: {
    terminVoleb: 'Piatok 9. októbra 2026, 14:00–22:00 · Sobota 10. októbra 2026, 08:00–14:00',
    zakonObce: 'Zákon č. 491/2001 Zb. o voľbách do zastupiteľstiev obcí',
    zakonSprava: 'Zákon č. 88/2024 Zb. o správe volieb',
    zakonSenat: 'Zákon č. 247/1995 Zb. o voľbách do Parlamentu Českej republiky',
    otevritVCestine: 'Otvoriť českú stránku',
    vice: 'Viac',
  },

  index: {
    nadpisek: 'Komunálne a senátne voľby · 9.–10. októbra 2026',
    h1: 'Môžete v Prahe tento október voliť?',
    perex:
      'V Prahe žijú desaťtisíce ľudí s cudzím pasom a časť z nich má volebné právo, hoci o tom nevie. České úrady vydávajú informácie o voľbách takmer výhradne po česky. Táto stránka je krátka odpoveď; zvyšok sekcie sú podrobnosti.',
    odpovediNadpis: 'Krátka odpoveď závisí od vášho občianstva',
    odpovedi: [
      {
        stav: 'ano',
        obcanstvi: 'Občianstvo Slovenskej republiky (alebo inej krajiny EÚ)',
        zaver: 'Áno — volíte v komunálnych voľbách.',
        detail:
          'Ak máte v niektorej pražskej mestskej časti prihlásený pobyt, volíte zastupiteľstvo hlavného mesta aj zastupiteľstvo tejto mestskej časti, za rovnakých podmienok ako český občan. Vo voľbách do Senátu nevolíte — tie sú len pre občanov ČR.',
      },
      {
        stav: 'ano',
        obcanstvi: 'Občianstvo Českej republiky',
        zaver: 'Áno — volíte na každom lístku, ktorý dostanete.',
        detail:
          'Volíte zastupiteľstvo hlavného mesta a zastupiteľstvo svojej mestskej časti. V troch pražských senátnych obvodoch dostanete tento rok aj senátny lístok.',
      },
      {
        stav: 'ne',
        obcanstvi: 'Občianstvo krajiny mimo EÚ',
        zaver: 'Nie — v týchto voľbách nie.',
        detail:
          'České právo priznáva cudzincovi volebné právo v obci len tam, kde to umožňuje medzinárodná zmluva, a jediná taká sa týka občanov krajín EÚ. Nezáleží na tom, ako dlho tu žijete ani aký pobyt máte. Ak ste získali české občianstvo, volíte ako občan ČR.',
      },
    ],
    overitVyzva: 'Overiť si svoj prípad krok za krokom',
    faktaNadpis: 'Tri otázky, ktoré prídu ako prvé',
    fakta: [
      {
        popisek: 'Kedy',
        text: 'Piatok 9. októbra, 14:00–22:00. Sobota 10. októbra, 08:00–14:00.',
      },
      {
        popisek: 'Čo volíte',
        text: 'Zastupiteľstvo hlavného mesta a zastupiteľstvo svojej mestskej časti — dva samostatné orgány s rôznymi právomocami. V troch obvodoch aj senátora.',
      },
      {
        popisek: 'Kde',
        text: 'Vo volebnej miestnosti podľa adresy svojho prihláseného pobytu. Inde voliť nemôžete a v komunálnych voľbách neexistuje voličský preukaz.',
      },
    ],
    rozcestnikNadpis: 'Podrobnosti',
    rozcestnik: [
      {
        cil: 'can-i-vote',
        nadpis: 'Môžem voliť?',
        popis:
          'Tri podmienky, ktoré stanovuje zákon, prečo sa takmer určite nemusíte nikam zapisovať, a čo robiť, ak vás v deň volieb v zozname nenájdu.',
      },
      {
        cil: 'where-do-i-vote',
        nadpis: 'Kde volím?',
        popis:
          'Zadajte adresu svojho pobytu a dozviete sa číslo okrsku aj volebnú miestnosť. Nič neopúšťa váš prehliadač.',
      },
      {
        cil: 'how-to-vote',
        nadpis: 'Ako voliť',
        popis:
          'Otváracie hodiny, doklad, ktorý musíte mať pri sebe, a ako sa označuje český komunálny lístok — funguje inak než väčšina volebných systémov.',
      },
      {
        cil: 'what-is-decided',
        nadpis: 'Čo volíte',
        popis:
          'Praha má dve úrovne samosprávy a hranica medzi nimi nie je intuitívna. Čo rozhoduje magistrát, čo mestská časť a prečo to mení čítanie predvolebného sľubu.',
      },
      {
        cil: 'who-is-running',
        nadpis: 'Kto kandiduje',
        popis:
          'Strany kandidujúce do zastupiteľstva hlavného mesta, ich vyžrebované čísla na lístku a lídri kandidátok.',
      },
    ],
    oWebuNadpis: 'O tomto sprievodcovi',
    oWebu:
      'Volím Prahu je nezávislý volebný sprievodca, ktorý robí jeden človek. Nie je spojený so žiadnou stranou, hnutím ani združením nezávislých kandidátov a nemá žiadne vonkajšie financovanie. Nikomu nehovorí, koho voliť — ukazuje, kto kandiduje, čo sľubuje a či to úroveň samosprávy, do ktorej kandiduje, vôbec dokáže splniť.',
  },

  canIVote: {
    h1: 'Môžem voliť?',
    perex:
      'Volebné právo v českých komunálnych voľbách závisí od troch vecí: od vášho občianstva, od toho, kde máte prihlásený pobyt, a od veku. Kontrola nižšie vás prevedie všetkými tromi. Právny základ každej odpovede je uvedený ďalej na stránke.',

    testNadpis: 'Overte si svoj prípad',
    testUvod: 'Tri otázky. Nikam sa nič neodosiela — kontrola prebieha vo vašom prehliadači.',
    testZnovu: 'Začať odznova',
    testOtazky: {
      obcanstvi: {
        otazka: 'Občianstvo ktorej krajiny máte?',
        napoveda:
          'Ak ich máte viac, odpovedajte podľa toho, ktoré dáva viac práv — najprv české, potom ktorékoľvek iné z EÚ.',
        moznosti: [
          { klic: 'cz', popisek: 'Českej republiky' },
          { klic: 'eu', popisek: 'Slovenska alebo inej krajiny EÚ' },
          { klic: 'mimo', popisek: 'Krajiny mimo EÚ' },
        ],
      },
      pobyt: {
        otazka: 'Máte prihlásený pobyt na adrese v Prahe?',
        napoveda:
          'Ide o adresu, ktorú majú úrady v evidencii — trvalý pobyt (trvalý pobyt), a pri občanoch EÚ aj prihlásený prechodný pobyt (přechodný pobyt). Nie jednoducho miesto, kde spávate.',
        moznosti: [
          { klic: 'ano', popisek: 'Áno, v Prahe' },
          { klic: 'jinde', popisek: 'Áno, ale inde v Česku' },
          { klic: 'ne', popisek: 'Nie, alebo neviem' },
        ],
      },
      vek: {
        otazka: 'Budete mať v sobotu 10. októbra 2026 aspoň 18 rokov?',
        napoveda: 'Rozhoduje druhý deň volieb — ak 18 dovŕšite práve v tú sobotu, stačí to.',
        moznosti: [
          { klic: 'ano', popisek: 'Áno' },
          { klic: 'ne', popisek: 'Nie' },
        ],
      },
    },
    testVysledky: {
      czPlny: {
        stav: 'ano',
        nadpis: 'Áno. Volíte na oboch komunálnych lístkoch.',
        text: 'Volíte zastupiteľstvo hlavného mesta a zastupiteľstvo svojej mestskej časti. Ak vaša mestská časť patrí do jedného z troch senátnych obvodov, kde sa tento rok volí, dostanete aj senátny lístok. Nikam sa kvôli tomu zapisovať netreba.',
      },
      euPlny: {
        stav: 'ano',
        nadpis: 'Áno. Volíte na oboch komunálnych lístkoch.',
        text: 'Ako občan Slovenska alebo inej krajiny EÚ s prihláseným pobytom v pražskej mestskej časti volíte zastupiteľstvo hlavného mesta aj zastupiteľstvo tejto mestskej časti za rovnakých podmienok ako český občan. Vo voľbách do Senátu nevolíte. Žiadosť o zápis do zoznamu voličov podávať netreba — od 1. januára 2026 existuje jediný centrálny zoznam a vy v ňom už ste.',
      },
      jinaObec: {
        stav: 'jinde',
        nadpis: 'Áno — ale nie v Prahe.',
        text: 'Volebné právo v komunálnych voľbách sa viaže na adresu, kde máte prihlásený pobyt. Volíte zastupiteľstvo obce, kde ste prihlásený, vo volebnej miestnosti pre túto adresu. Tento sprievodca sa týka len Prahy.',
      },
      bezPobytu: {
        stav: 'ne',
        nadpis: 'V komunálnych voľbách nie.',
        text: 'Prihlásený pobyt v obci je podmienkou volebného práva a voliť zvonku sa nedá: v komunálnych voľbách neexistuje voličský preukaz ani hlasovanie poštou. Ak neviete, kde máte pobyt prihlásený, povie vám to ktorýkoľvek obecný úrad (obecní úřad).',
      },
      mimoEu: {
        stav: 'ne',
        nadpis: 'Nie, v týchto voľbách nie.',
        text: 'České právo priznáva cudzincovi volebné právo v obci len tam, kde to umožňuje medzinárodná zmluva, a jediná taká sa týka občanov krajín EÚ. Dĺžka pobytu ani druh povolenia na tom nič nemenia. Ak ste získali české občianstvo, prejdite kontrolu znovu ako občan ČR.',
      },
      mlady: {
        stav: 'ne',
        nadpis: 'Tentoraz nie.',
        text: 'Minimálny vek je 18 rokov v druhý deň volieb. Najbližšie riadne komunálne voľby v Prahe pripadnú na rok 2030.',
      },
    },

    zakonNadpis: 'Čo hovorí zákon',
    zakonUvod:
      '§ 4 ods. 1 zákona o voľbách do zastupiteľstiev obcí vymedzuje dve skupiny voličov. Pri pozornom čítaní je tu rozhodujúca tá druhá.',
    podminky: [
      {
        nadpis: 'Občania Českej republiky',
        text: 'Vek aspoň 18 rokov v druhý deň volieb a prihlásený trvalý pobyt v obci — v Prahe v tej mestskej časti, ktorej zastupiteľstvo volia.',
      },
      {
        nadpis: 'Občania iného štátu',
        text: 'Vek aspoň 18 rokov v druhý deň volieb, povolenie na trvalý pobyt alebo osvedčenie o registrácii na prechodný pobyt, prihlásený pobyt v obci — a, čo je rozhodujúce, volebné právo priznané medzinárodnou zmluvou, ktorou je Česká republika viazaná a ktorá bola vyhlásená v Zbierke zákonov.',
      },
    ],
    smlouvaNadpis: 'Ktorá zmluva a prečo to znamená občanov EÚ',
    smlouvaText:
      'Jediným predpisom, ktorý toto právo priznáva, je právo Európskej únie: smernica Rady 94/80/ES dáva každému občanovi EÚ právo voliť v komunálnych voľbách v členskom štáte, kde má pobyt, a do českého práva vstúpila prístupovou zmluvou. Pre žiadnu krajinu mimo EÚ obdobná zmluva neexistuje. Preto občan Ukrajiny, Vietnamu, USA, Ruska ani — po brexite — Veľkej Británie v českých komunálnych voľbách voliť nemôže, nech tu žije akokoľvek dlho.',
    smlouvaPoznamka:
      'Na to isté ukazuje aj znenie zákona: dokladom o pobyte, ktorý pre voličov-cudzincov menuje, je osvedčenie o registrácii (osvědčení o registraci) — doklad vydávaný práve občanom EÚ.',

    registraceNadpis: 'Nikam sa zapisovať netreba',
    registraceText:
      'Toto je najčastejšia zastaraná rada a opakujú ju príručky napísané pred volebnou reformou. Do konca roka 2025 musel občan EÚ požiadať o zápis do dodatku stáleho zoznamu voličov na svojom úrade, a musel to stihnúť v lehote. Tento dodatok už neexistuje.',
    registraceText2:
      'Od 1. januára 2026 nahradil zákon o správe volieb približne 6 500 miestnych zoznamov jediným centrálnym zoznamom voličov, ktorý vedie ministerstvo vnútra a napĺňa ho zo základných registrov obyvateľov a z informačného systému cudzincov. Ak máte v Prahe prihlásený pobyt a spĺňate občianstvo aj pobytový status, ktorý zákon vyžaduje, ste v ňom už teraz. Niet čo podávať a niet čo zmeškať.',
    overeniNadpis: 'Ako si overiť, že v zozname ste',
    overeniKroky: [
      'Opýtať sa na ktoromkoľvek obecnom úrade (obecní úřad) v krajine — nemusí to byť úrad vašej mestskej časti.',
      'Alebo si to overiť online cez portál verejnej správy či informačný systém volieb pomocou elektronickej identity na úrovni záruky „značná" alebo vyššej.',
    ],
    overeniPoznamka:
      'Máte právo vedieť, aké údaje o vás zoznam vedie, a ak je niečo preukázateľne zle, obecný úrad to musí overiť a opraviť.',

    chybiNadpis: 'Ak vás v deň volieb v zozname nenájdu',
    chybiText:
      'Povedzte to vo volebnej miestnosti. Ak volič namieta, že nie je vo výpise voličov, hoci tam byť má, komisia ho doplní po tom, čo obecný úrad overí jeho právo voliť v tomto okrsku. Vezmite si doklad o pobyte — overenie s ním prebehne rýchlejšie.',

    prekazkyNadpis: 'Čo volebné právo odníma',
    prekazky: [
      'Výkon trestu odňatia slobody alebo výkon zabezpečovacej detencie.',
      'Výkon služby vojaka z povolania alebo vojaka v zálohe v zahraničí.',
      'Obmedzenie osobnej slobody z dôvodu ochrany zdravia ľudí.',
      'Obmedzenie svojprávnosti práve vo vzťahu k volebnému právu — svojprávnosť na výkon práva voliť pritom obmedziť nemožno, takže v praxi ide len o právo byť volený.',
    ],

    senatNadpis: 'Voľby do Senátu sú iná vec',
    senatText:
      'V roku 2026 sa volí v troch pražských senátnych obvodoch. Vo voľbách do Senátu hlasujú len občania Českej republiky od 18 rokov — občianstvo EÚ sa na ne nevzťahuje, pretože zmluva, ktorá priznáva volebné právo v obci, sa týka len komunálnych volieb. Ak ste občan Slovenska, dostanete jednoducho dva lístky namiesto troch.',

    zdrojeNadpis: 'Zdroje',
    zdroje: [
      {
        popis: '§ 4 ods. 1 — kto môže voliť v komunálnych voľbách',
        zakon: 'Zákon č. 491/2001 Zb.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2001-491#p4',
      },
      {
        popis: '§ 4 ods. 2 — prekážky vo výkone volebného práva',
        zakon: 'Zákon č. 491/2001 Zb.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2001-491#p4',
      },
      {
        popis: '§ 22–24 — informačný systém volieb a centrálny zoznam voličov',
        zakon: 'Zákon č. 88/2024 Zb.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p23',
      },
      {
        popis: '§ 82 ods. 4 — prihlásený prechodný pobyt sa berie ako trvalý',
        zakon: 'Zákon č. 88/2024 Zb.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p82',
      },
      {
        popis: '§ 56 — preukázanie totožnosti a doplnenie do výpisu priamo v miestnosti',
        zakon: 'Zákon č. 88/2024 Zb.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p56',
      },
    ],
  },

  howToVote: {
    h1: 'Ako voliť',
    perex:
      'Kde volíte, je určené za vás, kontrola totožnosti je prísna a samotný lístok funguje inak než vo väčšine systémov: máte toľko hlasov, koľko je mandátov, a môžete ich rozdeliť medzi strany. Táto stránka je o všetkých troch veciach.',

    kdyNadpis: 'Kedy',
    kdyRadky: [
      'Piatok 9. októbra 2026 — miestnosti sa otvárajú o 14:00 a zatvárajú o 22:00.',
      'Sobota 10. októbra 2026 — otvárajú sa o 08:00, zatvárajú o 14:00.',
    ],
    kdyPoznamka:
      'Prísť môžete ktorýkoľvek z oboch dní; volíte raz. V sobotu o 14:00 sa miestnosti zatvárajú a dovtedy sa o výsledkoch nezverejňuje nič.',

    kdeNadpis: 'Kde',
    kdeText:
      'Vo volebnej miestnosti okrsku, do ktorého patrí adresa vášho prihláseného pobytu. Voľba tu nie je. Pre komunálne voľby neexistuje voličský preukaz, hlasovanie poštou ani možnosť voliť v inej miestnosti — takže ak budete cez ten víkend mimo Prahy, komunálnych volieb sa zúčastniť nemôžete.',
    kdeNastroj: 'Nájsť svoj okrsok a volebnú miestnosť podľa adresy',
    kdeNastrojPopis:
      'Stačí ulica a číslo domu; výsledkom je číslo okrsku, adresa volebnej miestnosti a mapa. Nikam sa nič neodosiela.',
    kdeOznameni:
      'Záväzným dokumentom je „Oznámení o době a místě konání voleb“ (oznámenie o čase a mieste konania volieb), ktoré každá mestská časť zverejňuje na svojej úradnej tabuli najneskôr 15 dní pred voľbami — teda do 24. septembra 2026.',

    dokladNadpis: 'Čo si vziať so sebou',
    dokladUvod:
      'Doklad totožnosti. Bez neho komisia voliť nedovolí a musí to byť originál — fotografia ani kópia sa neprijímajú.',
    dokladSkupiny: [
      {
        kdo: 'Občania Českej republiky',
        doklady:
          'Český občiansky preukaz, český cestovný, diplomatický alebo služobný pas, prípadne cestovný preukaz. Prijíma sa aj digitálny doklad v aplikácii eDoklady.',
      },
      {
        kdo: 'Občania Slovenska a ďalších krajín EÚ',
        doklady:
          'Preukaz o povolení na trvalý pobyt (průkaz o povolení k trvalému pobytu), potvrdenie o prechodnom pobyte (potvrzení o přechodném pobytu), osvedčenie o registrácii (osvědčení o registraci) alebo doklad totožnosti vydaný vaším štátom — slovenský občiansky preukaz či pas.',
      },
    ],
    dokladEdoklad:
      'Ak plánujete použiť eDoklady, otvorte si aplikáciu s predstihom — najskôr však 48 hodín pred cestou do miestnosti —, aby sa doklad aktualizoval. Radí to vo svojom oznámení napríklad Praha 17.',

    listkyNadpis: 'Lístky, ktoré dostanete',
    listkyText:
      'V Prahe volíte dva orgány naraz, takže dostanete dva komunálne hlasovacie lístky: jeden do zastupiteľstva hlavného mesta a druhý do zastupiteľstva svojej mestskej časti. Oba idú do tej istej úradnej obálky. V troch obvodoch, kde sa volí do Senátu, dostanú občania ČR aj senátny lístok — ten ide do samostatnej obálky inej farby.',
    listkyDodani:
      'Hlasovacie lístky vám majú prísť do utorka 6. októbra 2026. Ak neprídu alebo ich zabudnete doma, novú sadu dostanete vo volebnej miestnosti.',

    znackyNadpis: 'Ako sa označuje komunálny lístok',
    znackyUvod:
      'Na lístku má každá strana vlastný stĺpec a pod ňou očíslovaných kandidátov. Máte toľko hlasov, koľko je v tomto zastupiteľstve mandátov: {magistrat} v zastupiteľstve hlavného mesta a {mcOd} až {mcDo} v zastupiteľstve mestskej časti, podľa jej veľkosti. Použiť ich môžete tromi spôsobmi.',
    zpusoby: [
      {
        nazev: 'Hlas pre jednu stranu',
        text: 'Dajte krížik do štvorčeka v záhlaví stĺpca jednej strany. Hlas dostane každý kandidát v tomto stĺpci, v poradí podľa lístka a najviac toľko kandidátov, koľko je mandátov.',
      },
      {
        nazev: 'Hlasy pre jednotlivých kandidátov',
        text: 'Dajte krížik do rámčeka pred menom každého kandidáta, ktorého chcete podporiť, v ktoromkoľvek stĺpci. Označiť môžete toľko kandidátov, koľko je mandátov, a voľne miešať kandidátov rôznych strán.',
      },
      {
        nazev: 'Kombinácia oboch spôsobov',
        text: 'Označte jednu stranu v záhlaví jej stĺpca a zároveň jednotlivých kandidátov v stĺpcoch ostatných strán. Najprv sa započítajú jednotlivo označení kandidáti; zvyšok hlasov pripadne kandidátom označenej strany zhora jej listiny nadol.',
      },
    ],
    znackyStejnaStrana:
      'Označiť stranu v záhlaví stĺpca a zároveň jednotlivých kandidátov v tom istom stĺpci nedáva nič: na označenie kandidátov sa neprihliada a počíta sa to ako obyčajný hlas pre stranu.',

    neplatneNadpis: 'Čím sa lístok stáva neplatným',
    neplatne: [
      'Neoznačíte ani stranu, ani žiadneho kandidáta.',
      'Označíte krížikom viac než jednu stranu v záhlaví stĺpca.',
      'Označíte viac jednotlivých kandidátov, než je mandátov — to zneplatní celý lístok, takže si pred krížikovaním spočítajte, koľko ich je.',
    ],
    neplatnePoznamka:
      'Do tohto limitu sa rátajú aj kandidáti, ktorí sa kandidatúry vzdali, hoci hlasy pre nich sa nezapočítavajú.',

    senatNadpis: 'Senátny lístok',
    senatText:
      'Senátny lístok je principiálne iný: jeden kandidát, jeden krížik, jednomandátový obvod, dve kolá. Ak v prvom kole nikto neprekročí 50 %, dvaja najlepší sa o týždeň stretnú znovu, 16.–17. októbra 2026. Tento lístok dostanú len občania ČR. Senátny voličský preukaz existuje, ale platí len v rámci obvodu, kde je volič zapísaný — neumožňuje voliť kdekoľvek v krajine.',

    pomocNadpis: 'Ak sa do volebnej miestnosti nedostanete',
    pomocText:
      'Môžete požiadať úrad svojej mestskej časti, a v dňoch volieb aj samotnú okrskovú komisiu, aby za vami prišli s prenosnou volebnou schránkou — zo závažných, predovšetkým zdravotných dôvodov. Cestuje len v rámci svojho okrsku. Volič, ktorý si lístok nedokáže upraviť sám, si môže priviesť pomocníka — okrem člena tejto komisie.',

    zdrojeNadpis: 'Zdroje',
    zdroje: [
      {
        popis: '§ 34, 40 a 41 — ako sa hlasy odovzdávajú, sčítavajú a posudzujú',
        zakon: 'Zákon č. 491/2001 Zb.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2001-491#p34',
      },
      {
        popis: '§ 2 ods. 2 — dni a hodiny hlasovania',
        zakon: 'Zákon č. 88/2024 Zb.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p2',
      },
      {
        popis: '§ 5 ods. 1 — oznámenie o čase a mieste konania volieb',
        zakon: 'Zákon č. 88/2024 Zb.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p5',
      },
      {
        popis: '§ 56 ods. 1 — doklady prijímané od voličov-cudzincov',
        zakon: 'Zákon č. 88/2024 Zb.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p56',
      },
    ],
  },

  whatIsDecided: {
    h1: 'Čo v skutočnosti volíte',
    perex:
      'Praha je zároveň mestom aj krajom a delí sa na 57 mestských častí, ktoré sú samostatnými samosprávnymi jednotkami s vlastnými zastupiteľstvami. Volíte dva takéto orgány naraz a hranica medzi tým, o čom rozhodujú, nie je intuitívna — presne preto tento web existuje.',

    urovneNadpis: 'Dve zastupiteľstvá, dva lístky',
    urovne: [
      {
        nazev: 'Zastupiteľstvo hlavného mesta Prahy',
        mandaty: 'mandátov',
        popis:
          'Celomestská úroveň. Schvaľuje rozpočet mesta, metropolitný plán, celomestskú dopravnú politiku a tarify, nakladanie s mestským majetkom a volí radu mesta aj primátora Prahy. Väčšina peňazí a väčšina rozhodnutí, ktoré formujú mesto ako celok, je tu.',
      },
      {
        nazev: 'Zastupiteľstvo vašej mestskej časti',
        mandaty: 'mandátov, podľa mestskej časti',
        popis:
          'Miestna úroveň, od Prahy 1 po Prahu-Nedvězí. Mestské časti vedú vlastné menšie rozpočty, spravujú byty a budovy, ktoré im boli zverené, materské a základné školy, miestne parky a upratovanie, a vyjadrujú sa k stavebným zámerom na svojom území. Čo presne mestská časť môže, určuje Štatút hlavného mesta Prahy a u každej je to trochu inak.',
      },
    ],

    procNadpis: 'Prečo je tá hranica dôležitá pri čítaní sľubu',
    procText:
      'Sľub, ktorý je na magistráte bežnou agendou, býva pre mestskú časť celkom mimo právomoc — a naopak. Programy stránu väčšinou nespomínajú, takže z letáka ju volič nespozná. Kandidát do zastupiteľstva mestskej časti, ktorý sľubuje postaviť linku metra alebo zmeniť územný plán, sľubuje niečo, o čom jeho zastupiteľstvo rozhodnúť nemôže.',
    procOdkaz: 'Ktorá úroveň o čom rozhoduje — po agendách, s odkazom na konkrétne ustanovenie zákona',

    hodnoceniNadpis: 'Ako tento web hodnotí sľuby',
    hodnoceniText:
      'České stránky hodnotia, či je sľub splniteľný — nie či je pravdivý a nie či je dobrý nápad. Štyri nezávislé osi: má na to táto úroveň právomoc, sú na to peniaze, stihne sa to za štyri roky a čo ukazuje plnenie skorších záväzkov. Rozhoduje najtvrdšia prekážka: sľub mimo právomoci danej úrovne zostáva mimo nej bez ohľadu na to, ako dobre je rozpočtovo pripravený.',
    hodnoceniOdkaz: 'Celá metodika',

    senatNadpis: 'Senát',
    senatText:
      'Senát je horná komora celoštátneho parlamentu, nie pražský orgán. V roku 2026 sa volí v troch pražských obvodoch, takže časť pražských voličov dostane tretí lístok a časť nie. Senátori hlasujú o celoštátnych zákonoch a ústavných zmenách; o meste nerozhodujú nič.',
    senatOdkaz: 'Tri pražské senátne obvody',

    rozpocetNadpis: 'Peniaze',
    rozpocetText:
      'Pri posudzovaní sľubu je rádová veľkosť dôležitejšia než presné čísla. Česká stránka uvádza rozpočet mesta aj rozpočty mestských častí zo schválených rozpočtových dokumentov, aby bolo vidieť, či je návrh chybou zaokrúhlenia, alebo štrukturálnym záväzkom.',
    rozpocetOdkaz: 'Koľko má Praha peňazí',
  },

  whoIsRunning: {
    h1: 'Kto kandiduje',
    perex:
      'Toto sú strany, hnutia a koalície kandidujúce do zastupiteľstva hlavného mesta Prahy. Čísla sú vyžrebované čísla na hlasovacom lístku — práve tie uvidíte v záhlaví každého stĺpca. Všetky profily nižšie sú po česky.',
    sloupce: {
      cislo: 'Č.',
      strana: 'Strana',
      lidr: 'Líder kandidátky',
      kandidatu: 'Kandidátov',
    },
    bezCisla: '—',
    bezLidra: 'neuvedený',
    profilOdkaz: 'Profil po česky',
    programOdkaz: 'Program a hodnotenie',
    mcNadpis: 'Vaša mestská časť',
    mcText:
      'Každá z 57 mestských častí má vlastný lístok s vlastnou zostavou strán — zvyčajne mix celoštátnych strán a čisto miestnych združení. Česká stránka každej mestskej časti ukazuje, kto tam kandiduje, koľko mandátov sa rozdeľuje a kto radnicu vedie teraz.',
    mcOdkaz: 'Všetkých 57 mestských častí',
    senatNadpis: 'Kandidáti do Senátu',
    senatText:
      'V roku 2026 volia senátora tri pražské obvody. V týchto voľbách hlasujú len občania Českej republiky.',
    senatOdkaz: 'Senátne obvody a kandidáti',
    dataPoznamka:
      'Kandidátne listiny pochádzajú z otvorených dát Českého štatistického úradu (sada kv2026), bez ručných úprav.',
    pruzkumyPoznamka:
      'Na tejto stránke zámerne nie sú žiadne prieskumy. Prieskumy sa zobrazujú len na českých stránkach a len s doloženou metodikou, a od 6. októbra do zatvorenia miestností vôbec — je to zákonné moratórium, ktoré web vynucuje technicky.',
  },

  sdileni: {
    alt: 'Volím Prahu — sprievodca pražskými voľbami 2026 po slovensky',
    index: {
      titulek: 'Môžete v Prahe tento október voliť?',
      podtitul: 'Slováci s pobytom v Prahe áno — a väčšina z nich o tom nevie.',
      popis:
        'Kto môže voliť v komunálnych voľbách v Prahe 9.–10. októbra 2026, kde a ako — po slovensky. Občania SR a ďalších krajín EÚ volebné právo majú.',
    },
    'can-i-vote': {
      titulek: 'Môžem voliť?',
      podtitul: 'V komunálnych voľbách volia občania ČR aj EÚ. Overte si svoj prípad.',
      popis:
        'Tri otázky, ktoré overia, či môžete voliť v komunálnych voľbách v Prahe 2026, so zákonom za každou odpoveďou.',
    },
    'where-do-i-vote': {
      titulek: 'Kde volím?',
      podtitul: 'Zadajte adresu — dostanete okrsok aj volebnú miestnosť.',
      popis:
        'Nájdite svoj pražský volebný okrsok a volebnú miestnosť podľa adresy. Zadané údaje neopúšťajú váš prehliadač.',
    },
    'how-to-vote': {
      titulek: 'Ako voliť v Prahe',
      podtitul: 'Hodiny, doklady a to, ako český hlasovací lístok naozaj funguje.',
      popis:
        'Otváracie hodiny, ktorý doklad si vziať a ako označiť český komunálny lístok — hlasov máte toľko, koľko je mandátov.',
    },
    'what-is-decided': {
      titulek: 'Čo vlastne volíte?',
      podtitul: 'Praha má dve úrovne samosprávy. Rozhodujú o rôznych veciach.',
      popis:
        'Praha volí zastupiteľstvo mesta a 57 zastupiteľstiev mestských častí. O čom rozhoduje ktoré a prečo to mení čítanie sľubu.',
    },
    'who-is-running': {
      titulek: 'Kto kandiduje v Prahe',
      podtitul: 'Strany kandidujúce do zastupiteľstva mesta s vyžrebovanými číslami.',
      popis:
        'Strany kandidujúce do zastupiteľstva hlavného mesta Prahy v roku 2026, ich vyžrebované čísla a lídri kandidátok.',
    },
  },

  vyhledavac: {
    ulice: 'Ulica',
    ulicePlaceholder: 'napríklad Partyzánská',
    cisloDomu: 'Číslo',
    cisloPlaceholder: '18/23',
    odeslat: 'Nájsť okrsok',
    napovedaCisla:
      'Stačí ktorékoľvek číslo z tabuľky na dome — súpisné (popisné) aj orientačné. Na diakritike nezáleží.',
    navrhyUlic: 'Návrhy ulíc',
    vicekrat: '{pocet}× v Prahe',

    indexChyba: 'Zoznam ulíc sa nepodarilo načítať. Skúste stránku obnoviť.',
    hleda: 'Hľadám…',
    chyba: 'Dáta sa nepodarilo načítať. Skúste to znovu.',
    uliceNenalezena:
      'Ulicu {ulice} sme v Prahe nenašli. Skúste ju vybrať z ponuky — názov musí sedieť celý. Pri adresách bez ulice (Hradčany, Malá Strana) zadajte názov časti obce.',
    cisloNenalezeno:
      'Ulica {ulice} leží v časti {casti}, ale číslo {cislo} na nej register adries nepozná. Skúste druhé číslo z domovej tabuľky — býva na nej súpisné aj orientačné.',
    viceAdres: 'Zadaniu zodpovedá {pocet} adries — vyberte tú svoju podľa celého čísla.',

    volebniOkrsek: 'Volebný okrsok',
    bezbarierova: 'bezbariérová',
    zdroj: 'zdroj',
    mistnostNeznamaUvod: 'Adresu volebnej miestnosti pre tento okrsok zatiaľ nepoznáme. Zverejní ju ',
    uredniDeska: 'úradná tabuľa {mc}',
    mistnostNeznamaLhuta: ' najneskôr 24. septembra 2026.',

    naAdrese: 'Volebná miestnosť je priamo na vašej adrese.',
    vzdusnouCarou: 'Vzdušnou čiarou asi {vzdalenost} od vašej adresy.',
    jednotkaM: 'm',
    jednotkaKm: 'km',

    kdoKandiduje: 'Kto kandiduje v časti {mc}',
    registrAdres: 'register adries ČÚZK k {datum}',

    zdrojeMistnosti: ZDROJE_MISTNOSTI,

    mapa: {
      popisek: 'Mapa volebného okrsku {okrsek}',
      chyba: 'Mapu sa nepodarilo načítať. Polohu adresy otvorí odkaz pod mapou.',
      nacita: 'Načítavam mapu… · ',
      legenda: 'Červeno hranice okrsku {okrsek} podľa RÚIAN, biely bod je vaša adresa',
      legendaMistnost: ', červený štvorec volebná miestnosť',
      osm: 'otvoriť v OpenStreetMap',
      autori: '&copy; prispievatelia <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },

  mojeVolby: {
    tlacitko: 'Zistiť podľa mojej polohy',
    neboAdresa: 'Alebo zadať adresu',
    hledani: {
      povoleni: 'Čakám na povolenie polohy…',
      okrsek: 'Určujem okrsok…',
      hranice: 'Hľadám v hraniciach okrskov…',
    },

    odmitnuto:
      'Bez povolenia polohy to nejde, a odmietnuť je úplne v poriadku — vyhľadanie podľa adresy dá tú istú odpoveď.',
    odmitnutoOdkaz: 'Nájsť okrsok podľa adresy',
    nepodporovano: 'Prehliadač polohu neposkytne. Skúste vyhľadanie podľa adresy.',
    chyba: 'Polohu sa nepodarilo určiť. Skúste to znovu alebo zadajte adresu.',
    mimoPrahu:
      'Táto poloha neleží v žiadnom pražskom okrsku. Ak ste práve mimo Prahy, zadajte adresu svojho prihláseného pobytu.',
    mimoPrahuOdkaz: 'Vyhľadanie podľa adresy',

    polohaLeziV: 'Vaša poloha leží v časti',
    okrsekVeta:
      'Volebný okrsok {okrsek}. Volí sa tu len podľa prihláseného pobytu — ak bývate inde, platí vaša adresa, nie toto miesto.',
    kandidatkyMC: 'Kandidátky do zastupiteľstva vašej mestskej časti',
    pocetStran: '({pocet})',
    kandidatkyMagistrat: 'Kandidátky do zastupiteľstva mesta (volí celá Praha)',

    senatNadpis: 'Senát',
    senatNevoliHlavni: 'Vo vašej mestskej časti sa tento rok senátor nevolí.',
    senatNevoliDoplnek: 'Senátny lístok nedostanete.',
    senatVoli: 'Volíte aj senátora v obvode č. {cislo} ({nazev}).',
    senatCastecne: 'Časť územia volí senátora v obvode č. {cislo} ({nazev}): {popis}.',
    kandidatiSenatu: 'Kandidáti do Senátu',

    mistnostOkrsku: 'Volebná miestnosť okrsku {okrsek}',
    odVasiPolohy: '{vzdalenost} od miesta, kde ste',
    mistnostNeznama:
      'Adresu miestnosti pre tento okrsok zatiaľ nepoznáme. Zverejní ju úradná tabuľa najneskôr 24. septembra 2026.',
    mapaAHledani: 'Mapa okrsku a hľadanie podľa adresy',
    znovu: 'Zistiť znovu',

    jednotkaM: 'm',
    jednotkaKm: 'km',
    zdrojeMistnosti: ZDROJE_MISTNOSTI,
  },

  whereDoIVote: {
    h1: 'Kde volím?',
    perex:
      'Vašu volebnú miestnosť určuje adresa, kde máte prihlásený pobyt — vybrať si ju nemôžete a voliť inde tiež nie. Zadajte túto adresu a dozviete sa číslo okrsku, a tam, kde to mestská časť už zverejnila, aj samotnú volebnú miestnosť.',
    nastrojNadpis: 'Nájdite svoj okrsok a volebnú miestnosť',
    nastrojPopis:
      'Čísla okrskov berieme z registra adries ČÚZK, ktorý mestské časti priebežne aktualizujú; adresy volebných miestností z oznámení na ich úradných tabuliach. To, čo zadáte, zostáva vo vašom prehliadači a nikam sa neodosiela.',
    pokryti: 'Volebnú miestnosť poznáme pre {sMistnosti} z {celkem} okrskov{podle2026}.',
    pokryti2026: ', z toho {pocet} podľa dokumentov k voľbám 2026',
    oficialniNastroj: 'Oficiálny nástroj: Kudy k volbám (IPR Praha)',
    polohaNadpis: 'Alebo použite polohu telefónu',
    polohaPopis:
      'Rýchlejšie, ak práve stojíte na adrese svojho pobytu. Poloha sa číta až po stlačení tlačidla, zostáva vo vašom prehliadači a nikam sa neodosiela — sťahujú sa hranice okrskov, nie vaša poloha niekam.',
    lhutaNadpis: 'Ak váš okrsok ešte miestnosť nemá',
    lhutaText:
      'Každá mestská časť musí zverejniť oznámenie o čase a mieste konania volieb na svojej úradnej tabuli najneskôr 15 dní vopred — do 24. septembra 2026. Dovtedy sa pri časti okrskov ukazuje adresa z predchádzajúcich volieb, zreteľne označená, a pri niekoľkých zatiaľ žiadna.',
    dalsiNadpis: 'Než pôjdete',
    dalsi: [
      { cil: 'can-i-vote', text: 'Overte si, či vôbec máte volebné právo' },
      { cil: 'how-to-vote', text: 'Čo si vziať so sebou a ako označiť lístok' },
    ],
  },

  citace: {
    prelozeno: 'Preklad',
    zobrazitOriginal: 'Zobraziť český originál',
    poznamka:
      'Citáciou je český text; preklad je náš a nie je overenou citáciou.',
  },
}
