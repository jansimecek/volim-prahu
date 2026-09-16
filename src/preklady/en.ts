/**
 * Anglická verze. Zároveň je to referenční struktura — typ `Preklad` se
 * odvozuje z tohohle objektu, takže ukrajinská verze nemůže žádný klíč
 * vynechat, aniž by spadl `tsc`. Parita délky seznamů se hlídá testem.
 *
 * Právní tvrzení tady musí sedět se zákonem, ne s tím, co se obvykle píše
 * v příručkách pro cizince: většina z nich je psaná před volební reformou
 * a mluví o „dodatku stálého seznamu voličů", který od 1. 1. 2026
 * neexistuje. Odkazy na paragrafy jsou proto součástí obsahu, ne poznámka
 * pod čarou.
 */
export const en = {
  htmlLang: 'en',
  smerCteni: 'ltr',
  /** Locale pro Intl — formát data a čísel ve výsledcích vyhledávače. */
  formatLocale: 'en-GB',

  meta: {
    nazevWebu: 'Volím Prahu',
    podtitul: 'Prague elections 2026',
    popisSekce:
      'Who can vote in Prague’s municipal elections on 9–10 October 2026, where and how to vote, and what the city and district assemblies actually decide.',
  },

  chrome: {
    preskocit: 'Skip to content',
    hlavniNavigace: 'Main navigation',
    patickaNavigace: 'Footer',
    prepinacJazyka: 'Language',
    zpetDoCestiny: 'Celý web česky',
    zpetDoCestinyPopis: 'Candidates, programmes and evaluations are in Czech only.',
    navigace: {
      index: 'Start here',
      'can-i-vote': 'Can I vote?',
      'where-do-i-vote': 'Where do I vote?',
      'how-to-vote': 'How to vote',
      'what-is-decided': 'What you elect',
      'who-is-running': 'Who is running',
    },
    rozsahPrekladu:
      'Only this section is in English. The rest of the site — candidate profiles, party programmes and our assessments of them — is in Czech.',
    patickaPopis:
      'An independent guide to the municipal and Senate elections in Prague, 9–10 October 2026. It does not recommend or discourage voting for anyone; it describes what each tier of local government is able to deliver.',
    pravniZaklad: 'Legal basis',
    aktualizovano: 'Last checked',
    kontakt: 'Found a mistake? Write to',
  },

  spolecne: {
    terminVoleb: 'Friday 9 October 2026, 14:00–22:00 · Saturday 10 October 2026, 08:00–14:00',
    zakonObce: 'Act No. 491/2001 Coll., on elections to municipal assemblies',
    zakonSprava: 'Act No. 88/2024 Coll., on election administration',
    zakonSenat: 'Act No. 247/1995 Coll., on elections to the Parliament of the Czech Republic',
    otevritVCestine: 'Open the Czech page',
    vice: 'Read more',
  },

  index: {
    nadpisek: 'Municipal and Senate elections · 9–10 October 2026',
    h1: 'Can you vote in Prague this October?',
    perex:
      'Tens of thousands of people who live in Prague hold a foreign passport, and some of them have the right to vote here without knowing it. Czech authorities publish election information almost entirely in Czech. This page is the short answer; the rest of this section is the detail.',
    odpovediNadpis: 'The short answer depends on your citizenship',
    odpovedi: [
      {
        stav: 'ano',
        obcanstvi: 'Czech citizenship',
        zaver: 'Yes — you vote on every ballot you are given.',
        detail:
          'You elect the Prague city assembly and the assembly of your city district. In three of Prague’s Senate constituencies you also receive a Senate ballot this year.',
      },
      {
        stav: 'ano',
        obcanstvi: 'Citizenship of another EU member state',
        zaver: 'Yes — you vote in the municipal elections.',
        detail:
          'If you are registered for residence in a Prague city district, you elect the Prague city assembly and that district’s assembly, on exactly the same terms as a Czech citizen. You do not vote in the Senate election — that one is for Czech citizens only.',
      },
      {
        stav: 'ne',
        obcanstvi: 'Citizenship of a non-EU country',
        zaver: 'No — not in these elections.',
        detail:
          'Czech law extends the municipal vote to foreign nationals only where an international treaty grants it, and the only treaty that does covers citizens of EU member states. This holds however long you have lived here and whatever residence permit you hold. If you have since acquired Czech citizenship, you vote as a Czech citizen.',
      },
    ],
    overitVyzva: 'Check your own case step by step',
    faktaNadpis: 'The three things people ask first',
    fakta: [
      {
        popisek: 'When',
        text: 'Friday 9 October, 14:00–22:00. Saturday 10 October, 08:00–14:00.',
      },
      {
        popisek: 'What you elect',
        text: 'The Prague city assembly and your district assembly — two separate bodies with different powers. In three constituencies, also a senator.',
      },
      {
        popisek: 'Where',
        text: 'At the polling station assigned to your registered address. You cannot vote anywhere else, and there is no absentee voter card for municipal elections.',
      },
    ],
    rozcestnikNadpis: 'The detail',
    rozcestnik: [
      {
        cil: 'can-i-vote',
        nadpis: 'Can I vote?',
        popis:
          'The three conditions the law sets, why you almost certainly do not need to register, and what to do if you are missing from the list on election day.',
      },
      {
        cil: 'where-do-i-vote',
        nadpis: 'Where do I vote?',
        popis:
          'Type your registered address and get your precinct number and polling station. Nothing leaves your browser.',
      },
      {
        cil: 'how-to-vote',
        nadpis: 'How to vote',
        popis:
          'Opening hours, the identity document you must bring, and how to mark a Czech municipal ballot — which works differently from most voting systems.',
      },
      {
        cil: 'what-is-decided',
        nadpis: 'What you elect',
        popis:
          'Prague has two tiers of self-government and the line between them is not intuitive. What the city hall decides, what your district decides, and why that changes how you read a campaign promise.',
      },
      {
        cil: 'who-is-running',
        nadpis: 'Who is running',
        popis:
          'The parties standing for the Prague city assembly, their drawn ballot numbers and their lead candidates.',
      },
    ],
    oWebuNadpis: 'About this guide',
    oWebu:
      'Volím Prahu is an independent election guide run by one person. It is not connected to any party, movement or group of independent candidates, and it has no outside funding. It does not tell anyone how to vote — it sets out who is standing, what they promise, and whether the tier of government they are standing for can actually deliver it.',
  },

  canIVote: {
    h1: 'Can I vote?',
    perex:
      'The right to vote in Czech municipal elections turns on three things: your citizenship, where your residence is registered, and your age. The check below walks through them. The legal basis for every answer is set out underneath.',

    testNadpis: 'Check your case',
    testUvod: 'Three questions. Nothing is sent anywhere — the check runs in your browser.',
    testZnovu: 'Start again',
    testOtazky: {
      obcanstvi: {
        otazka: 'What citizenship do you hold?',
        napoveda: 'If you hold more than one, answer for the one that helps you most — Czech first, then EU.',
        moznosti: [
          { klic: 'cz', popisek: 'Czech Republic' },
          { klic: 'eu', popisek: 'Another EU member state' },
          { klic: 'mimo', popisek: 'A country outside the EU' },
        ],
      },
      pobyt: {
        otazka: 'Is your residence registered at an address in Prague?',
        napoveda:
          'This means the address the authorities have on file — permanent residence (trvalý pobyt), or, for EU citizens, registered temporary residence (přechodný pobyt). Not simply where you sleep.',
        moznosti: [
          { klic: 'ano', popisek: 'Yes, in Prague' },
          { klic: 'jinde', popisek: 'Yes, but elsewhere in the Czech Republic' },
          { klic: 'ne', popisek: 'No, or I am not sure' },
        ],
      },
      vek: {
        otazka: 'Will you be 18 or older on Saturday 10 October 2026?',
        napoveda: 'The second day of voting is the day that counts — turning 18 on that Saturday is enough.',
        moznosti: [
          { klic: 'ano', popisek: 'Yes' },
          { klic: 'ne', popisek: 'No' },
        ],
      },
    },
    testVysledky: {
      czPlny: {
        stav: 'ano',
        nadpis: 'Yes. You vote on both municipal ballots.',
        text: 'You elect the Prague city assembly and the assembly of your city district. If your district falls in one of the three Senate constituencies being contested this year, you also receive a Senate ballot. You do not need to register for any of this.',
      },
      euPlny: {
        stav: 'ano',
        nadpis: 'Yes. You vote on both municipal ballots.',
        text: 'As a citizen of another EU member state with residence registered in a Prague city district, you elect the Prague city assembly and that district’s assembly on the same terms as a Czech citizen. You do not vote in the Senate election. You do not need to apply to be added to the voter list — since 1 January 2026 there is a single central list and you are in it.',
      },
      jinaObec: {
        stav: 'jinde',
        nadpis: 'Yes — but not in Prague.',
        text: 'Municipal voting rights follow the address where your residence is registered. You vote for the assembly of the municipality where you are registered, at the polling station assigned to that address. This guide only covers Prague.',
      },
      bezPobytu: {
        stav: 'ne',
        nadpis: 'Not in the municipal elections.',
        text: 'Registered residence in the municipality is a condition of the municipal vote, and there is no way to vote in these elections from outside it — there is no absentee voter card and no postal ballot for municipal elections. If your residence is registered somewhere and you are not sure where, any municipal office can tell you.',
      },
      mimoEu: {
        stav: 'ne',
        nadpis: 'No, not in these elections.',
        text: 'Czech law gives the municipal vote to a foreign national only where an international treaty grants it, and the only such treaty covers citizens of EU member states. Length of residence and type of permit make no difference. If you have acquired Czech citizenship, run the check again as a Czech citizen.',
      },
      mlady: {
        stav: 'ne',
        nadpis: 'Not this time.',
        text: 'The minimum age is 18 on the second day of voting. The next regular municipal elections in Prague fall in 2030.',
      },
    },

    zakonNadpis: 'What the law says',
    zakonUvod:
      'Section 4(1) of the Act on elections to municipal assemblies sets out two groups of voters. Read closely, it is the second one that matters here.',
    podminky: [
      {
        nadpis: 'Czech citizens',
        text: 'Aged at least 18 on the second day of voting and registered for permanent residence in the municipality — in Prague, in the city district whose assembly they are electing.',
      },
      {
        nadpis: 'Citizens of another state',
        text: 'Aged at least 18 on the second day of voting, holding either a permanent residence permit or a registration certificate for temporary residence, registered for residence in the municipality, and — the decisive condition — granted the right to vote by an international treaty that binds the Czech Republic and has been published in the Collection of Laws.',
      },
    ],
    smlouvaNadpis: 'Which treaty, and why it means EU citizens',
    smlouvaText:
      'The only instrument that grants that right is European Union law: Council Directive 94/80/EC gives every EU citizen the right to vote in municipal elections in the member state where they reside, and it entered Czech law through the Treaty of Accession. No comparable treaty exists for any non-EU country. That is why a Ukrainian, Vietnamese, American, Russian or — since Brexit — British citizen cannot vote in Czech municipal elections, no matter how long they have lived here.',
    smlouvaPoznamka:
      'The wording of the Act points the same way: the residence document it names for foreign voters is the registration certificate (osvědčení o registraci), which is the document issued specifically to EU citizens.',

    registraceNadpis: 'You do not need to register',
    registraceText:
      'This is the single most common piece of out-of-date advice, and it is repeated by guides that were written before the election reform. Until the end of 2025, an EU citizen had to apply to be entered in an addendum to the permanent voter roll kept by their municipal office, and had to do it before a deadline. That addendum no longer exists.',
    registraceText2:
      'Since 1 January 2026 the Act on election administration has replaced roughly 6,500 local rolls with one central voter list, maintained by the Ministry of the Interior and populated from the basic population registers and the foreign nationals information system. If your residence is registered in Prague and you hold the citizenship and the residence status the Act requires, you are already on it. There is no form to file and no deadline to miss.',
    overeniNadpis: 'How to check that you are on the list',
    overeniKroky: [
      'Ask at any municipal office in the country — it does not have to be the one for your district.',
      'Or check online through the public administration portal, or the election information system, using an electronic identity at assurance level “substantial” or higher.',
    ],
    overeniPoznamka:
      'You are entitled to see what the list records about you, and if something is demonstrably wrong the municipal office has to verify it and correct it.',

    chybiNadpis: 'If you are missing from the list on election day',
    chybiText:
      'Say so at the polling station. Where a voter objects that they are not in the polling station’s extract although they ought to be, the commission adds them once the municipal office has confirmed their right to vote in that precinct. Bring your residence document — it makes that confirmation faster.',

    prekazkyNadpis: 'What takes the right away',
    prekazky: [
      'Serving a custodial sentence or being held in preventive detention.',
      'Serving abroad as a professional soldier or a soldier in the reserve.',
      'Being deprived of personal liberty in order to protect public health.',
      'Having legal capacity restricted specifically as to the right to vote — note that capacity to exercise the right to vote cannot be restricted, so in practice this bars only the right to stand as a candidate.',
    ],

    senatNadpis: 'The Senate election is different',
    senatText:
      'Three of Prague’s Senate constituencies are contested in 2026. Only Czech citizens aged 18 and over vote in the Senate election — EU citizenship does not extend to it, because the treaty that grants the municipal vote covers municipal elections only. If you are an EU citizen you will simply be handed two ballots instead of three.',

    zdrojeNadpis: 'Sources',
    zdroje: [
      {
        popis: 'Section 4(1) — who may vote in municipal elections',
        zakon: 'Act No. 491/2001 Coll.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2001-491#p4',
      },
      {
        popis: 'Section 4(2) — barriers to exercising the right to vote',
        zakon: 'Act No. 491/2001 Coll.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2001-491#p4',
      },
      {
        popis: 'Sections 22–24 — the election information system and the central voter list',
        zakon: 'Act No. 88/2024 Coll.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p23',
      },
      {
        popis: 'Section 82(4) — registered temporary residence counts as permanent residence for foreign voters',
        zakon: 'Act No. 88/2024 Coll.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p82',
      },
      {
        popis: 'Section 56 — proving identity, and being added to the extract at the polling station',
        zakon: 'Act No. 88/2024 Coll.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p56',
      },
    ],
  },

  howToVote: {
    h1: 'How to vote',
    perex:
      'Where you vote is decided for you, the identity check is strict, and the ballot itself works differently from most systems — you have as many votes as there are seats, and you can split them across parties. This page covers all three.',

    kdyNadpis: 'When',
    kdyRadky: [
      'Friday 9 October 2026 — polling stations open 14:00 and close 22:00.',
      'Saturday 10 October 2026 — open 08:00, close 14:00.',
    ],
    kdyPoznamka:
      'Either day is fine; you vote once. Polling stations close at 14:00 on Saturday and nothing is published about results before then.',

    kdeNadpis: 'Where',
    kdeText:
      'At the polling station for the precinct covering the address where your residence is registered. This is not a choice. For municipal elections there is no absentee voter card, no postal voting and no way to vote at another station — so if you are away from Prague that weekend, you cannot vote in the municipal elections at all.',
    kdeNastroj: 'Find your precinct and polling station by address',
    kdeNastrojPopis:
      'You only need your street and house number; the result is your precinct, the polling station address and a map. Nothing is sent anywhere.',
    kdeOznameni:
      'The binding notice is the “Oznámení o době a místě konání voleb”, which every city district must publish on its official board at least 15 days before the election — by 24 September 2026.',

    dokladNadpis: 'What to bring',
    dokladUvod:
      'An identity document. The commission will not let you vote without one, and it must be an original — a photo or a photocopy is not accepted.',
    dokladSkupiny: [
      {
        kdo: 'Czech citizens',
        doklady:
          'A Czech identity card, or a Czech travel, diplomatic or service passport, or a travel document. A digital identity card in the eDoklady app is also accepted.',
      },
      {
        kdo: 'Citizens of another EU member state',
        doklady:
          'A permanent residence card (průkaz o povolení k trvalému pobytu), a confirmation of temporary residence (potvrzení o přechodném pobytu), a registration certificate (osvědčení o registraci), or an identity document issued by your own state — a national ID card or passport.',
      },
    ],
    dokladEdoklad:
      'If you plan to use eDoklady, open the app well before you set out — at the earliest 48 hours beforehand — so that the document refreshes. Prague 17 gives this advice in its own election notice.',

    listkyNadpis: 'The ballots you receive',
    listkyText:
      'In Prague you vote for two assemblies at once, so you get two municipal ballot papers: one for the Prague city assembly and one for your city district’s assembly. Both go into the same official envelope. In the three constituencies holding a Senate election, Czech citizens also get a Senate ballot, which goes into a separate envelope of a different colour.',
    listkyDodani:
      'Ballot papers should reach you by Tuesday 6 October 2026. If they do not arrive, or you leave them at home, you can ask for a fresh set at the polling station.',

    znackyNadpis: 'How to mark a municipal ballot',
    znackyUvod:
      'Each ballot lists every party in its own column, with its candidates numbered underneath. You have as many votes as there are seats on that assembly — {magistrat} for the Prague city assembly, and between {mcOd} and {mcDo} for a district assembly, depending on its size. There are three ways to use them.',
    zpusoby: [
      {
        nazev: 'Vote for one party',
        text: 'Put a cross in the box at the head of one party’s column. Every candidate in that column receives a vote, in the printed order, up to the number of seats being filled.',
      },
      {
        nazev: 'Vote for individual candidates',
        text: 'Put a cross in the box in front of each candidate you want, in any column you like. You may cross as many candidates as there are seats, and you may mix candidates from different parties freely.',
      },
      {
        nazev: 'Combine the two',
        text: 'Cross one party at the head of its column, and also cross individual candidates in other parties’ columns. The individually marked candidates are counted first; the remaining votes go to the crossed party’s candidates from the top of its list down.',
      },
    ],
    znackyStejnaStrana:
      'Crossing a party at the head of its column and then also crossing individual candidates inside that same column achieves nothing: the individual marks are disregarded and it counts as a plain party vote.',

    neplatneNadpis: 'What makes a ballot invalid',
    neplatne: [
      'Marking neither a party nor any candidate.',
      'Crossing more than one party at the head of a column.',
      'Crossing more individual candidates than there are seats to fill — this invalidates the whole ballot, so count before you cross.',
    ],
    neplatnePoznamka:
      'Withdrawn candidates still count towards that limit, even though the votes cast for them are not counted.',

    senatNadpis: 'The Senate ballot',
    senatText:
      'The Senate ballot is different in kind: one candidate, one cross, single-member constituency, two rounds. If no candidate passes 50 % in the first round, the top two meet again a week later, on 16–17 October 2026. Only Czech citizens receive this ballot. A Senate voter card does exist, but it is valid only within the constituency where you are on the roll — it does not let you vote anywhere in the country.',

    pomocNadpis: 'If you cannot get to the polling station',
    pomocText:
      'You can ask your district office, or the polling station commission during voting hours, to send the mobile ballot box to you for serious — mainly health — reasons. It travels only within the precinct. A voter who cannot mark the ballot themselves may bring another person to assist, except a member of that commission.',

    zdrojeNadpis: 'Sources',
    zdroje: [
      {
        popis: 'Sections 34, 40 and 41 — how votes are cast, counted and judged valid',
        zakon: 'Act No. 491/2001 Coll.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2001-491#p34',
      },
      {
        popis: 'Section 2(2) — days and hours of voting',
        zakon: 'Act No. 88/2024 Coll.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p2',
      },
      {
        popis: 'Section 5(1) — the notice of the time and place of the election',
        zakon: 'Act No. 88/2024 Coll.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p5',
      },
      {
        popis: 'Section 56(1) — identity documents accepted from foreign voters',
        zakon: 'Act No. 88/2024 Coll.',
        odkaz: 'https://www.zakonyprolidi.cz/cs/2024-88#p56',
      },
    ],
  },

  whatIsDecided: {
    h1: 'What you are actually electing',
    perex:
      'Prague is both a city and a region, and it is split into 57 city districts that are separate self-governing units with their own assemblies. You elect two of these bodies at once, and the boundary between what they decide is not intuitive — which is the reason this site exists.',

    urovneNadpis: 'Two assemblies, two ballots',
    urovne: [
      {
        nazev: 'The Prague city assembly',
        mandaty: 'seats',
        popis:
          'The city-wide tier. It approves the city budget, the metropolitan plan, city-wide transport policy and fares, the disposal of city-owned property, and it elects the city council and the mayor of Prague. Most of the money and most of the decisions that shape the city as a whole sit here.',
      },
      {
        nazev: 'Your city district assembly',
        mandaty: 'seats, depending on the district',
        popis:
          'The local tier, from Prague 1 to Prague-Nedvězí. Districts run their own smaller budgets, the flats and buildings entrusted to them, nursery and primary schools, local parks and cleaning, and they give opinions on building projects in their area. What exactly a district may do is set by the Statute of the City of Prague and differs between them.',
      },
    ],

    procNadpis: 'Why the split matters when you read a promise',
    procText:
      'A promise that is routine business at city hall is often entirely outside a district’s powers — and the other way round. Party programmes rarely mention the line, so a voter cannot see it from the leaflet. A district candidate promising to build a metro line, or to change the zoning plan, is promising something their assembly cannot decide.',
    procOdkaz: 'Which tier decides what — agency by agency, with the statutory provision for each',

    hodnoceniNadpis: 'How this site assesses promises',
    hodnoceniText:
      'The Czech pages assess whether a promise is deliverable — not whether it is true and not whether it is a good idea. Four independent axes: does this tier have the power, is there money for it, can it be done in four years, and what does the record of earlier commitments show. The hardest obstacle decides: a promise outside the tier’s powers stays outside them however well funded it is.',
    hodnoceniOdkaz: 'The full method',

    senatNadpis: 'The Senate',
    senatText:
      'The Senate is the upper house of the national parliament, not a Prague body. Three of Prague’s constituencies are contested in 2026, so some Prague voters get a third ballot and some do not. Senators vote on national legislation and constitutional changes; they do not decide anything about the city.',
    senatOdkaz: 'The three Prague constituencies',

    rozpocetNadpis: 'The money',
    rozpocetText:
      'Rough orders of magnitude matter more than exact figures when you are judging a promise. The Czech page sets out the city’s budget and the districts’ budgets from the approved budget documents, so you can tell whether a proposal is a rounding error or a structural commitment.',
    rozpocetOdkaz: 'How much money Prague has',
  },

  whoIsRunning: {
    h1: 'Who is running',
    perex:
      'These are the parties, movements and coalitions standing for the Prague city assembly. Numbers are the ballot numbers drawn by lot — they are what you will see at the head of each column on the ballot paper. Every profile below is in Czech.',
    sloupce: {
      cislo: 'No.',
      strana: 'Party',
      lidr: 'Lead candidate',
      kandidatu: 'Candidates',
    },
    bezCisla: '—',
    bezLidra: 'not listed',
    profilOdkaz: 'Czech profile',
    programOdkaz: 'Programme and assessment',
    mcNadpis: 'Your city district',
    mcText:
      'Each of the 57 city districts has its own ballot with its own set of parties — usually a mix of the national parties and purely local groups. The Czech page for each district lists who is standing there, how many seats are being filled and who currently runs the town hall.',
    mcOdkaz: 'All 57 city districts',
    senatNadpis: 'Senate candidates',
    senatText:
      'Three Prague constituencies elect a senator in 2026. Only Czech citizens vote in this election.',
    senatOdkaz: 'Senate constituencies and candidates',
    dataPoznamka:
      'Candidate lists come from the Czech Statistical Office open data set kv2026, without manual edits.',
    pruzkumyPoznamka:
      'This page deliberately shows no opinion polling. Polls are shown only on the Czech pages, with their methodology, and not at all from 6 October until voting closes — a legal moratorium the site enforces technically.',
  },

  /**
   * Vyhledávač adresa → okrsek. Je to jediný nástroj webu, který cizinci
   * odpoví na otázku „kam mám v sobotu jít", takže musí fungovat v jeho
   * jazyce celý — včetně stavů, kdy nic nenajde. Hlášku „ulici jsme
   * nenašli" v češtině nepřečte ten, kdo česky neumí, a odejde
   * s dojmem, že je nástroj rozbitý.
   */
  /**
   * Texty pro sdílení. Oddělené od textů na stránce schválně: úvodní
   * odstavec je psaný pro čtenáře, který už na stránce je, a jako popisek
   * v odkazu se utne v půlce věty. Sociální sítě ukazují kolem 150 znaků,
   * vyhledávače podobně — `popis` se do toho musí vejít celý.
   *
   * `titulek` je to, co stojí na kartě velkým. Rozhoduje, jestli na odkaz
   * ve facebookové skupině někdo klikne, takže je to otázka čtenáře, ne
   * název rubriky.
   */
  sdileni: {
    alt: 'Volím Prahu — a guide to the 2026 Prague elections in English',
    index: {
      titulek: 'Can you vote in Prague this October?',
      podtitul: 'Tens of thousands of residents can — and most of them do not know it.',
      popis:
        'Who can vote in Prague’s municipal elections on 9–10 October 2026, where and how to vote — in English. Czech and EU citizens are eligible.',
    },
    'can-i-vote': {
      titulek: 'Can I vote?',
      podtitul: 'Czech and EU citizens vote in the municipal elections. Check your own case.',
      popis:
        'Three questions to check whether you can vote in Prague’s 2026 municipal elections, with the law behind every answer.',
    },
    'where-do-i-vote': {
      titulek: 'Where do I vote?',
      podtitul: 'Type your address, get your precinct and your polling station.',
      popis:
        'Find your Prague electoral precinct and polling station by address. Nothing you type leaves your browser.',
    },
    'how-to-vote': {
      titulek: 'How to vote in Prague',
      podtitul: 'Opening hours, the ID you need, and how a Czech ballot actually works.',
      popis:
        'Opening hours, which identity document to bring, and how to mark a Czech municipal ballot — you have as many votes as there are seats.',
    },
    'what-is-decided': {
      titulek: 'What are you electing?',
      podtitul: 'Prague has two tiers of government. They decide different things.',
      popis:
        'Prague elects a city assembly and 57 district assemblies. What each one decides, and why that changes how you read a campaign promise.',
    },
    'who-is-running': {
      titulek: 'Who is running in Prague',
      podtitul: 'Parties standing for the city assembly, with their drawn ballot numbers.',
      popis:
        'The parties standing for the Prague city assembly in 2026, their drawn ballot numbers and their lead candidates.',
    },
  },

  vyhledavac: {
    ulice: 'Street',
    ulicePlaceholder: 'for example Partyzánská',
    cisloDomu: 'Number',
    cisloPlaceholder: '18/23',
    odeslat: 'Find my precinct',
    napovedaCisla:
      'Either number from the plaque on the building works — the descriptive one or the orientation one. Accents do not matter.',
    navrhyUlic: 'Street suggestions',
    vicekrat: '{pocet}× in Prague',

    indexChyba: 'The street list could not be loaded. Try reloading the page.',
    hleda: 'Searching…',
    chyba: 'The data could not be loaded. Please try again.',
    uliceNenalezena:
      'We could not find the street {ulice} in Prague. Try picking it from the suggestions — the name has to match in full. For addresses without a street name (Hradčany, Malá Strana), enter the name of the cadastral area.',
    cisloNenalezeno:
      'The street {ulice} is in {casti}, but the address register does not know number {cislo} there. Try the other number from the plaque — buildings in Prague carry both a descriptive and an orientation number.',
    viceAdres: 'Your entry matches {pocet} addresses — pick yours by the full number.',

    volebniOkrsek: 'Electoral precinct',
    bezbarierova: 'step-free access',
    zdroj: 'source',
    mistnostNeznamaUvod:
      'We do not know the polling station for this precinct yet. It will be published by ',
    uredniDeska: 'the official board of {mc}',
    mistnostNeznamaLhuta: ' no later than 24 September 2026.',

    naAdrese: 'The polling station is at your own address.',
    vzdusnouCarou: 'About {vzdalenost} from your address as the crow flies.',
    jednotkaM: 'm',
    jednotkaKm: 'km',

    kdoKandiduje: 'Who is standing in {mc}',
    registrAdres: 'ČÚZK address register as of {datum}',

    zdrojeMistnosti: {
      'oznameni-2026':
        'From the city district’s own 2026 election notice — precinct seat taken from the official board',
      'drivejsi-volby': 'From an earlier election — may still change before 24 September 2026',
      ruian: 'A city district note in the RÚIAN register — not a notice for 2026',
    },

    mapa: {
      popisek: 'Map of electoral precinct {okrsek}',
      chyba: 'The map could not be loaded. The link below opens your address instead.',
      nacita: 'Loading the map… · ',
      legenda:
        'The red outline is precinct {okrsek} per RÚIAN, the white dot is your address',
      legendaMistnost: ', the red square is the polling station',
      osm: 'open in OpenStreetMap',
      autori: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },

  whereDoIVote: {
    h1: 'Where do I vote?',
    perex:
      'Your polling station is decided by the address where your residence is registered — you cannot choose it and you cannot vote anywhere else. Enter that address and this will tell you your precinct number and, where the city district has already published it, the polling station itself.',
    nastrojNadpis: 'Find your precinct and polling station',
    nastrojPopis:
      'Precinct numbers come from the ČÚZK address register, which the city districts keep up to date; polling station addresses come from the notices published on their official boards. What you type stays in your browser — nothing is sent anywhere.',
    pokryti:
      'We know the polling station for {sMistnosti} of {celkem} precincts{podle2026}.',
    pokryti2026: ', {pocet} of them from 2026 election documents',
    oficialniNastroj: 'Official tool: Kudy k volbám (IPR Praha)',
    lhutaNadpis: 'If your precinct has no polling station yet',
    lhutaText:
      'Every city district must publish its notice of the time and place of the election on its official board at least 15 days beforehand — by 24 September 2026. Until then, some precincts show the address from an earlier election, clearly marked as such, and a few show none at all.',
    dalsiNadpis: 'Before you go',
    dalsi: [
      { cil: 'can-i-vote', text: 'Check whether you are entitled to vote at all' },
      { cil: 'how-to-vote', text: 'What to bring, and how to mark the ballot' },
    ],
  },

  citace: {
    prelozeno: 'Translated',
    zobrazitOriginal: 'Show the Czech original',
    poznamka:
      'The Czech text is the quote of record; the translation is ours and is not a verified quotation.',
  },
} satisfies PrekladTvar

/**
 * Minimální tvar, který si vynucuje jen to, co se používá strukturálně
 * (kódy stavů, klíče podstránek). Zbytek kontroluje odvozený typ `Preklad`.
 */
type Podstranka = 'can-i-vote' | 'where-do-i-vote' | 'how-to-vote' | 'what-is-decided' | 'who-is-running'

type PrekladTvar = {
  htmlLang: string
  smerCteni: 'ltr' | 'rtl'
  formatLocale: string
  whereDoIVote: {
    dalsi: readonly { cil: Podstranka; text: string }[]
    [k: string]: unknown
  }
  index: {
    odpovedi: readonly { stav: 'ano' | 'ne'; obcanstvi: string; zaver: string; detail: string }[]
    rozcestnik: readonly { cil: Podstranka; nadpis: string; popis: string }[]
    [k: string]: unknown
  }
  canIVote: {
    testVysledky: Record<string, { stav: 'ano' | 'ne' | 'jinde'; nadpis: string; text: string }>
    [k: string]: unknown
  }
  [k: string]: unknown
}
