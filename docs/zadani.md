# Zadání: Volební průvodce Praha 2026 — webová aplikace

*Verze 1.0, 22. 8. 2026. Navazuje na `claude/koncept-webu-volebni-pruvodce-praha-2026.md` a čtyři research dokumenty v projektu. Tento dokument je implementační zadání — je psaný tak, aby podle něj šlo přímo stavět (včetně práce s Claude Code).*

---

## 0. Rozhodnutí, která jsou tímto uzavřená

| Otázka z kapitoly 5.8 konceptu | Rozhodnutí |
|---|---|
| Rozsah první verze | **Všech 57 městských částí od začátku** + magistrát + 3 senátní obvody |
| Správa obsahu | **Markdown/MDX v Git repozitáři**, žádné CMS |
| Vazby kandidátů | **Linkout + cachovaný build-time fetch** z Hlídače Státu, bez vlastní databáze vazeb |
| Kdo staví a udržuje | **Jan sám s Claude Code** — z toho plyne důraz na jednoduchost, typovou bezpečnost a automatickou validaci obsahu místo lidského redakčního procesu |
| Hosting | **GitHub (zdroj pravdy) + Vercel (build a provoz)** |

Tři důsledky, které se promítají do celého zadání: obsah musí být validovatelný strojově (jeden člověk neuhlídá 57 částí ručně), rozsah editorské práce musí být škálovatelný přes šablony, a všechno, co jde vygenerovat, se generuje.

---

## 1. Co se staví a proč

Web, kde pražský volič na jednom místě najde: kdo kandiduje do jeho zastupitelstva (magistrát i jeho městská část), co slibují, **co z toho vůbec může daná úroveň samosprávy splnit**, kdo jsou konkrétní lidé na kandidátce, a kde a jak se volí.

Odlišující prvek je ten třetí bod. Programydovoleb.cz srovnává programy, Našipolitici.cz profiluje osoby, iROZHLAS píše články — nikdo nehodnotí **proveditelnost** slibu proti kompetenčnímu a rozpočtovému rámci pražské dvouúrovňové samosprávy. Tady je celá hodnota projektu; zbytek webu je infrastruktura, která tomu dělá kontext.

**Cílový uživatel:** volič v Praze, který má na rozhodování patnáct minut, ne dvě hodiny, a typicky neví, že jeho městská část nemůže vydat vlastní vyhlášku ani rozhodovat o tramvajové trati.

**Termíny, které rámují všechno:** volby 9.–10. 10. 2026. Zbývá **7 týdnů**.

---

## 2. Aktuální stav dat (ověřeno 22. 8. 2026)

Otevřená data ČSÚ na `volby.gov.cz/opendata/opendata.htm` **k dnešnímu dni sadu `kv2026` stále neobsahují** — poslední ročník komunálních voleb v rozcestníku je 2022. Rozhodnutí o registraci kandidátek má být vydáno právě dnes (22. 8. u komunálních, 20. 8. u senátních), takže zveřejnění se dá čekat řádově v následujících dnech.

Praktický důsledek pro plán: **prvních zhruba pět dnů se staví bez kandidátek.** Struktura, datový model, hodnotící rámec, stránka „Kde volím", profily městských částí a šablony stránek stran na kandidátkách nezávisí. Import z ČSÚ se píše proti struktuře `kv2022` (identická schémata, jen jiný rok v URL) a přepne se na `kv2026`, jakmile bude k dispozici.

---

## 3. Technologický stack

| Vrstva | Volba | Proč |
|---|---|---|
| Framework | **Next.js 15, App Router, React 19** | Vercel-native, statická generace pro 99 % stránek + ISR pro volební noc |
| Jazyk | **TypeScript, `strict: true`** | Jediný vývojář + generovaná data = typy jsou náhrada za code review |
| Styly | **Tailwind CSS v4** | Design tokeny přímo v CSS proměnných, žádná konfigurace navíc |
| Obsah | **MDX + frontmatter, načítané přes [Velite](https://velite.js.org/)** | Zod schémata nad frontmatterem, typovaný výstup, build spadne na nevalidním obsahu |
| Strukturovaná data | **JSON v `/data`, generovaný skripty, commitovaný do repa** | Reprodukovatelné buildy; výpadek ČSÚ neshodí deploy |
| Vyhledávání | **MiniSearch**, index generovaný při buildu, lazy-loaded | Bez backendu, bez Algolie |
| Grafy | **Ručně psané SVG komponenty** | Mandátové pruhy a procenta nepotřebují 100 kB knihovnu |
| Balíčky | **pnpm**, Node 22 | |
| Testy | **Vitest** (ETL + validace obsahu), **Playwright** (smoke test klíčových tras) | |
| CI | **GitHub Actions**: typecheck → lint → validace obsahu → build | Preview deploy z Vercelu na každý PR |

**Vercel plán:** pro volební noc je potřeba **Pro** — Hobby umožňuje cron jen jednou denně, což na průběžné výsledky nestačí. Upgradovat nejpozději začátkem října.

---

## 4. Struktura repozitáře

```
volby-praha-2026/
├── content/                      # ← všechno, co píše člověk (MDX)
│   ├── strany/                   # profil subjektu, jeden soubor na subjekt+úroveň
│   │   ├── magistrat/spolu.mdx
│   │   └── praha-7/praha-sobe.mdx
│   ├── programy/                 # body programu + hodnocení proveditelnosti
│   │   └── magistrat/spolu.mdx
│   ├── rozhovory/
│   ├── mestske-casti/            # 57 souborů: úvodní text, specifika, klíčová témata
│   │   └── praha-7.mdx
│   ├── senat/                    # 3 obvody
│   └── stranky/                  # metodika, o projektu, kde volím, zásady ochrany údajů
├── data/                         # ← generováno skripty, commitováno
│   ├── kandidatky/               # per zastupitelstvo, z ČSÚ
│   ├── vysledky-2022/            # historické, pro srovnání
│   ├── ciselniky/                # kódy MČ, okrsky, senátní obvody
│   ├── hlidac/                   # cachované odpovědi Hlídače Státu
│   └── snapshots/                # výsledky volební noci (zápis za běhu)
├── scripts/
│   ├── import-csu.ts
│   ├── import-hlidac.ts
│   ├── build-search-index.ts
│   └── validate-content.ts
├── src/
│   ├── app/                      # routy
│   ├── components/
│   ├── lib/                      # zod schémata, hodnotící logika, formátování
│   └── styles/
├── velite.config.ts
└── .github/workflows/
```

**Zásada:** `content/` edituje člověk, `data/` se nikdy needituje ručně. Pokud je v generovaných datech chyba, opravuje se v `content/opravy/` jako override, ne přepsáním JSONu — jinak se oprava ztratí při dalším importu.

---

## 5. Datový model

### 5.1 Kandidát (generováno z ČSÚ, needituje se)

```ts
{
  id: string          // `${kodZastupitelstva}-${cisloKandidatky}-${poradi}`
  slug: string        // `prijmeni-jmeno` + číselný disambiguátor při kolizi
  jmeno, prijmeni, titulPred, titulZa
  vek: number         // POZOR: ČSÚ dává věk, ne datum narození
  povolani: string
  bydliste: string    // jen obec/MČ, nic přesnějšího nepublikovat
  navrhujiciStrana: string
  politickaPrislusnost: string
  poradi: number
  zastupitelstvo: string   // slug MČ nebo "magistrat"
}
```

### 5.2 Bod programu s hodnocením (MDX frontmatter — jádro produktu)

```yaml
---
subjekt: spolu
uroven: magistrat
body:
  - id: dostupne-bydleni
    slib: "Zahájíme výstavbu 10 000 městských bytů"
    citace_zdroje: "https://…/program.pdf#page=4"
    hodnoceni:
      kompetence: v-pravomoci | castecne | mimo-pravomoc
      rozpocet: pokryto | nejiste | nepokryto
      cas: do-4-let | presahuje | nedatovano
      historie: splneno | castecne-splneno | nesplneno | bez-historie
      zaver: realny | podminecne-realny | nerealny-v-tomto-obdobi | mimo-pravomoc
      zduvodneni: >
        Text 2–4 věty. Povinný. Musí odkazovat na konkrétní fakt,
        ne na obecné hodnocení.
      zdroje: ["https://…"]
---
```

Zod schéma vynucuje: `zduvodneni` neprázdné a delší než 120 znaků, `zdroje` alespoň jeden funkční odkaz, `citace_zdroje` povinná. **Build spadne, pokud hodnocení nemá zdůvodnění se zdrojem.** To je jediná pojistka proti tomu, aby se z hodnocení stal nepodložený názor — a je důležitější než jakákoli funkce webu.

### 5.3 Subjekt, městská část, rozhovor

Standardní MDX frontmatter: název, zkratka, slug, úroveň, lídr, web, odkaz na program, případně `hlidacOsobaId` u lídrů. Městská část navíc: kód ČSÚ, počet mandátů, výsledek 2022, aktuální koalice, 2–4 klíčová lokální témata.

---

## 6. Datové pipeline

### 6.1 ČSÚ — kandidátky a výsledky

Zdroj: `volby.gov.cz/opendata/kv2026/…` (až bude), XML + CSVW. Skript `import-csu.ts`:

1. Stáhne registr kandidátů a číselník zastupitelstev
2. Vyfiltruje Prahu: obec 554782 (magistrát) + 57 kódů městských částí
3. Normalizuje, vygeneruje slugy, vyřeší kolize jmen deterministicky
4. Zapíše do `data/kandidatky/*.json` a vypíše diff proti předchozímu stavu

Spouští se ručně (`pnpm import:csu`), výsledek se commituje. Ne při každém buildu — chceme vidět v Gitu, co se změnilo.

Senátní kandidáti přijdou ze sady `se2026`, stejným postupem, 3 obvody (21, 24, 27).

### 6.2 Hlídač Státu — a jeho zásadní omezení

**ČSÚ v kandidátkách nezveřejňuje datum narození, jen věk.** Endpoint `/FindOsobaId` chce `jmeno`, `prijmeni`, `narozeni`. Bez data narození je párování jen podle jména — a u běžných českých jmen to znamená reálné riziko, že se kandidátovi přiřadí vazby, dluhy nebo insolvence úplně cizího člověka.

Z toho plyne tvrdé pravidlo, které se nesmí obejít:

- **Automatické párování se nikdy nezobrazuje jako fakt.** Buď je shoda ručně potvrzená (u lídrů kandidátek, senátních kandidátů a starostů — řádově 100–150 lidí, což je zvládnutelné), nebo se u kandidáta zobrazí jen odkaz na vyhledávání v Hlídači Státu, ne přebraná data.
- Ručně potvrzené shody se zapisují do `content/hlidac-mapping.yaml` s explicitním `overeno: true` a datem.
- Bez záznamu v mappingu profil nezobrazuje žádná převzatá data z Hlídače. Tečka.

Atribuce: viditelné „Data: Hlídač Státu" s **funkčním hypertextovým odkazem** u každého bloku převzatých dat (vyžaduje licence CC BY 3.0 CZ). Fetch se dělá při importu, ne za běhu — API má měkký limit 3 souběžná vlákna.

### 6.3 Volební místnosti

- **Fáze 1 (hned):** stránka `/kde-volim` s vysvětlením pravidla o voličských průkazech (u komunálních voleb se **nevydávají** — volí se výhradně v domovském okrsku podle trvalého pobytu) + odkaz na oficiální nástroj IPR Praha `kudykvolbam.iprpraha.cz` a celostátní `volby.mvcr.cz`.
- **Fáze 2 (po 24. 9.):** sběr „Oznámení o době a místě konání voleb" ze všech 57 úředních desek do jedné tabulky. Poloautomaticky: skript stáhne úřední desky, člověk dohledá a doplní chybějící. Sjednocení 57 roztříštěných zdrojů do jednoho místa je tady skutečná přidaná hodnota.
- **Vlastní vyhledávač adresa → okrsek** (přes ArcGIS endpoint MHMP) až tehdy, pokud přijde souhlas od IPR Praha / MHMP. **Poslat žádost tento týden** — čekání na odpověď je delší než implementace.

---

## 7. URL struktura

```
/                                     rozcestník: Praha / moje MČ / Senát
/praha                                magistrát: přehled kandidujících subjektů
/praha/strana/[slug]                  profil subjektu na celoměstské úrovni
/praha/strana/[slug]/program          program + hodnocení proveditelnosti
/mestska-cast                         seznam a vyhledávání 57 částí
/mestska-cast/[slug]                  např. /mestska-cast/praha-7
/mestska-cast/[slug]/strana/[slug]
/senat/[obvod]                        /senat/27-praha-1
/kandidat/[slug]                      profil osoby napříč úrovněmi
/kde-volim
/jak-hodnotime                        metodika — musí být triviálně dostupná odkudkoli
/o-projektu                           kdo web dělá, kdo ho platí, jak nahlásit chybu
/vysledky                             aktivní od 9. 10.
```

**Rendering:** MČ, strany a redakční stránky se prerenderují staticky (`generateStaticParams`). Profily kandidátů — jde o tisíce stránek — přes on-demand ISR (`dynamicParams: true`), aby build zůstal v minutách, ne desítkách minut.

---

## 8. Hodnocení proveditelnosti — produktová specifikace

Čtyři osy z konceptu (kompetence, rozpočet, čas, historie) se zobrazují jako jeden kompaktní blok u každého slibu. Klíčové vlastnosti:

- **Není to verdikt pravda/lež.** Formulace jsou o proveditelnosti, ne o pravdivosti. Nikde se nesmí objevit slovo „lež" ani ekvivalent.
- **Každý závěr je rozklikávací** na zdůvodnění se zdroji. Bez rozkliknutí je vidět jen barevný stav a jednořádkové shrnutí.
- **Metodika je odkazovaná z každého bloku**, ne schovaná v patičce.
- **Právo na odpověď:** u každého subjektu je viditelná možnost poslat reakci, která se po ověření publikuje přímo u hodnocení. Tohle není nice-to-have — je to obrana projektu i jeho legitimita.
- **Symetrie:** hodnotí se stejným rámcem všechny subjekty včetně těch malých. Pokud na některý subjekt nezbude kapacita, nezobrazuje se u něj hodnocení vůbec, a je to explicitně napsané — nikdy se nesmí stát, že hodnocení má jen část stran.

---

## 9. Volební noc

**Architektura:** Vercel Cron (interval 60 s, okno 9. 10. 14:00 – 11. 10. 02:00) → route handler stáhne a naparsuje XML z ČSÚ → uloží do Vercel Blob jako snapshot → stránka `/vysledky` čte snapshot s `revalidate = 30`. Nikdy nefetchovat ČSÚ přímo z requestu uživatele.

**Fallback:** pokud fetch selže, zobrazí se poslední snapshot s viditelným časem poslední úspěšné aktualizace. Nikdy prázdná stránka, nikdy neoznačená stará data.

**Nácvik povinně:** kompletní zkouška proti datům `kv2022` **nejpozději 2. 10.** Volební noc není okamžik na první ostré spuštění pipeline.

**Po volbách:** web nesmí zůstat viset v předvolebním stavu. Po sečtení se přepne do archivního režimu — výsledky, srovnání se slibovaným, a jasné označení, že jde o archiv.

---

## 10. Vizuální směr

Materiálový svět tématu není „politika" obecně, ale **úřední tiskopis**: hlasovací lístek jako široká mřížka jmen, oznámení na úřední desce, číslo okrsku. Z toho vychází celý vizuál — přesný, tichý, čitelný, bez kampaňové estetiky.

**Paleta** (5 hodnot, CSS proměnné):

| Token | Hex | Užití |
|---|---|---|
| `--papir` | `#ECEDE9` | podklad |
| `--inkoust` | `#161C24` | text, linky |
| `--seda-uredni` | `#8C9196` | sekundární text, linky tabulek |
| `--praha` | `#C8102E` | jediný akcent — interaktivní prvky a rozhodovací momenty, nic jiného |
| `--okr` | `#A8762C` | střední stavy hodnotící škály |

Barvy hodnotící škály jsou odvozené z `--praha` a `--okr`, nikdy z konvenční zeleno-červené semaforové palety — semafor implikuje verdikt, což je přesně to, co web nedělá.

**Typografie** (self-hosted přes `next/font`, všechny s plnou českou diakritikou — ř, ď, ť, ů se v mnoha display fontech lámou, testovat):

- Display: **Bricolage Grotesque** (variabilní šířka a optická velikost)
- Čtecí text: **Source Serif 4** — programy a zdůvodnění jsou dlouhé texty ke čtení
- Data a kódy: **IBM Plex Mono** — čísla okrsků, mandáty, procenta

Grotesk v nadpisech a serif v textu je záměrná inverze obvyklého páru; drží to stránku blíž tiskopisu než magazínu.

**Signature prvek:** blok hodnocení proveditelnosti řešený jako **čtyřdílné razítko** — čtyři buňky (kompetence / rozpočet / čas / historie) v pevné mřížce, monospace popisky, tenké linky. Je to jediné místo, kde se utrácí vizuální odvaha, protože je to jediná věc, kterou web umí a ostatní ne. Všechno ostatní zůstává disciplinované.

**Kvalitativní laťka** bez výjimek: WCAG 2.2 AA, viditelný focus, funkční klávesnicová navigace, respektovaný `prefers-reduced-motion`, plná použitelnost na mobilu (většina návštěv přijde z telefonu), LCP pod 2 s na 4G.

---

## 11. Právní a etický rámec

**Vyřešit hned, protože běží lhůty:**

1. **Registrovaná třetí osoba ve volební kampani** — písemně se zeptat **ÚDHPSH**, zda web s hodnocením proveditelnosti spadá pod povinnost registrace. Odpověď může trvat týdny; dotaz odeslat tento týden. Do vyjasnění formulovat obsah čistě informačně, bez výzev k volbě či nevolbě kohokoli.
2. **Zákaz zveřejňování předvolebních průzkumů** — zákon o volbách do zastupitelstev obcí zakazuje publikaci výsledků průzkumů v období těsně před volbami. **Ověřit přesné znění a počátek lhůty** a technicky ji vynutit: feature flag, který od daného okamžiku skryje veškerý obsah s průzkumy (Phoenix Research, celostátní modely) a nahradí ho vysvětlením. Nastavit dopředu, ne ručně večer před.
3. **GDPR** — kandidáti jsou veřejně kandidující osoby, ale kombinace ČSÚ dat s Hlídačem tvoří profil. Potřeba: zásady ochrany osobních údajů, kontaktní e-mail, dokumentovaný postup pro opravu a námitku, a maximálně 48hodinová reakční lhůta. Bydliště publikovat jen v rozsahu, v jakém ho zveřejňuje ČSÚ.
4. **Licence a atribuce** — ČSÚ podle jeho podmínek užití; Hlídač Státu CC BY 3.0 CZ s funkčním odkazem; převzaté rozhovory jen jako odkaz s krátkou anotací vlastními slovy, nikdy přebrané celé texty.
5. **Transparentnost projektu** — na `/o-projektu` kdo web provozuje, z čeho je financovaný, jaká je metodika a jak nahlásit chybu. Bez toho je projekt napadnutelný a nemá to obranu.

---

## 12. Harmonogram (7 týdnů)

| Týden | Cíl | Hotovo znamená |
|---|---|---|
| **22.–31. 8.** | Skelet | Repo, Vercel, CI, datový model se Zod schématy, design tokeny, 57 stránek MČ s obsahovým skeletem, `/kde-volim` fáze 1, `/jak-hodnotime`. Odeslané dotazy na ÚDHPSH a IPR Praha. |
| **1.–7. 9.** | Kandidátky | Import ČSÚ běží, `data/kandidatky` naplněná, profily kandidátů generované, vyhledávání funguje. Ruční mapping Hlídače pro ~150 klíčových osob rozjetý. |
| **8.–14. 9.** | Programy | Programy magistrátních subjektů + 10 největších MČ nasbírané, převedené do MDX, první hodnocení publikovaná. Rozeslán jednotný dotazník (5–8 otázek) kandidátům. |
| **15.–21. 9.** | Šířka | Hodnocení pro zbylé MČ tam, kde existují dohledatelné programy; explicitní označení tam, kde ne. Agregace mediálních rozhovorů. |
| **22.–28. 9.** | Volební místnosti | Fáze 2 `/kde-volim` — sběr oznámení z 57 úředních desek (zveřejnění do 24. 9.). Odpovědi z dotazníků do profilů. |
| **29. 9.–5. 10.** | Zámek a zkouška | Obsahový freeze mimo opravy, aktivace moratoria na průzkumy, **nácvik volební noci proti kv2022 do 2. 10.**, upgrade na Vercel Pro, kontrola přístupnosti a výkonu. |
| **6.–10. 10.** | Ostrý provoz | Monitoring, rychlé opravy, výsledkový režim od 9. 10. 14:00. |

Kritická cesta vede přes zveřejnění kandidátek ČSÚ (mimo naši kontrolu) a přes sběr programů (nejpracnější položka, žádný centrální zdroj neexistuje). Pokud něco padne, padá šířka pokrytí hodnocení u malých MČ — ne kvalita hodnocení u velkých.

---

## 13. Definition of done pro spuštění

- [ ] Všech 57 MČ má vlastní stránku se seznamem kandidujících subjektů a kandidátů
- [ ] Magistrát a 3 senátní obvody kompletní
- [ ] Každé publikované hodnocení má zdůvodnění se zdrojem (vynuceno buildem)
- [ ] Metodika `/jak-hodnotime` je odkazovaná z každého hodnocení
- [ ] Žádná převzatá data z Hlídače Státu bez ručně potvrzené shody
- [ ] `/kde-volim` funguje včetně vysvětlení o voličských průkazech
- [ ] Moratorium na průzkumy je technicky vynucené, ne ruční
- [ ] `/o-projektu` obsahuje financování, metodiku a kontakt pro opravy
- [ ] Lighthouse: přístupnost ≥ 95, výkon ≥ 90 na mobilu
- [ ] Výsledková pipeline úspěšně otestovaná na datech 2022
- [ ] Zásady ochrany osobních údajů publikované, kontaktní e-mail funkční

---

## 14. Co vědomě neděláme

Vlastní databázi majetkových a firemních vazeb (duplicita s Hlídačem a Našimipolitiky). Majetková přiznání (od 2020 nejsou volně přístupná — jen vysvětlit a odkázat na proces žádosti). Volební kalkulačku (existuje na Programydovoleb.cz; odkázat). Fact-checking jednotlivých výroků (to je práce Demagog.cz; my hodnotíme proveditelnost programu, ne pravdivost vět). Diskuse, komentáře, uživatelské účty. Vlastní rozhovory se stovkami kandidátů — místo toho jednotný krátký dotazník plus agregace médií.

---

## 15. Otevřené závislosti

| Věc | Na kom závisí | Kdy se to zlomí |
|---|---|---|
| Kandidátky `kv2026` | ČSÚ | Očekáváno dny po 22. 8. Kontrolovat denně. |
| Souhlas s ArcGIS endpointem | IPR Praha / MHMP | Bez odpovědi zůstává fáze 1 (odkaz na jejich nástroj) — přijatelné. |
| Stanovisko k třetí osobě | ÚDHPSH | Do vyjasnění opatrné formulace. |
| Programy subjektů | Subjekty samy | Malé MČ často program nezveřejní vůbec — počítat s tím a označit. |
| Přesná čísla Phoenix Research | Paywall | Nedopátráno; po zveřejnění kandidátek čekat novou vlnu průzkumů. |
