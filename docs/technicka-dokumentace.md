# Technická dokumentace

Jak je [Volím Prahu](https://www.volimprahu.cz) technicky postavený: odkud se
berou data, co hlídá build a jak funguje volební noc. Co web nabízí čtenářům,
popisuje [README](../README.md).

## Spuštění

```bash
pnpm install
pnpm dev
```

Node 22+, pnpm 11+. `pnpm dev` nejdřív zkompiluje obsah přes Velite, pak spustí Next.

## Příkazy

| Příkaz | Co dělá |
|---|---|
| `pnpm dev` | Vývojový server (kompilace obsahu + Next) |
| `pnpm dev:content` | Sleduje `content/` a překompilovává při změně |
| `pnpm build` | Produkční build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest — ETL, slugy, kontrast palety |
| `pnpm test:e2e` | Playwright — klíčové trasy na mobilu i desktopu |
| `pnpm validate` | Kontrola obsahu (nedopsané pasáže, slovník verdiktu) |
| `pnpm validate --strict --odkazy` | Přísná varianta: cokoli nedopsaného shodí běh a ověří se i odkazy ve zdrojích |
| `pnpm import:csu` | Import kandidátek a číselníků z ČSÚ |
| `pnpm import:senat` | Import senátních kandidátů (sada se2026) |
| `pnpm import:desky` | Sběr oznámení z úředních desek městských částí |
| `pnpm import:okrsky` | Import volebních okrsků Prahy z ČÚZK (adresy → okrsek, hranice) |
| `pnpm nacvik` | Nácvik volební noci proti datům 2022 |
| `pnpm gen:mc` | Doplní chybějící skelety městských částí |
| `pnpm preloz --jazyk en --vzor '<glob>'` | Strojový překlad obsahu přes DeepL (vyžaduje `DEEPL_API_KEY`, `--nasucho` nic neodesílá) |

## Jak je repo rozdělené

- **`content/`** — všechno, co píše člověk (MDX s frontmatterem a YAML). Tvar
  hlídají Zod schémata v [`velite.config.ts`](../velite.config.ts); nevalidní
  obsah shodí build.
- **`data/`** — generováno skripty, **nikdy se needituje ručně**: další import
  by ruční zásah přepsal.
- **`scripts/`** — ETL a generátory, spouští se ručně a výsledek se commituje.
- **`src/`** — routy, komponenty, hodnotící logika.
- **`src/preklady/`** — ručně psaný text cizojazyčné sekce. Není to
  „řetězce v kódu": je to obsah, jen s typovou kontrolou navrch.

## Cizojazyčná sekce

Web má dvě jazykové verze pro voliče, kteří nečtou česky: `/en` a `/uk`.
Nejsou to překlady celého webu — je v nich to, co rozhoduje o účasti
(kdo smí volit, **kde**, kdy, jak se označuje lístek, co se vlastně volí)
a odkazy do české verze na zbytek.

**Proč jsou routy ve skupinách.** `src/app/` nemá vlastní `layout.tsx`;
místo něj jsou dva kořenové layouty, `(cesky)/layout.tsx`
a `(mezinarodni)/[jazyk]/layout.tsx`. Next umí víc kořenových layoutů jen
tehdy, když nad nimi žádný nestojí, a bez toho by anglická stránka nesla
`<html lang="cs">` — to je porušení WCAG 3.1.1, ne kosmetická vada.
Skupiny se v adresách neprojeví, takže české cesty zůstaly beze změny.

Důsledky, na které se přijde až při buildu:

- `opengraph-image.tsx` a `not-found.tsx` potřebuje **každá skupina
  zvlášť**; kořenový soubor v `src/app/` se na stránky uvnitř skupin
  nevztahuje.
- `src/app/not-found.tsx` (adresa mimo obě skupiny) si musí přinést
  vlastní `<html>`, `<body>` i `<title>` — metadata Next skládá jen uvnitř
  layoutu. Titulek je proto přímo v JSX, React 19 ho vytáhne do hlavičky.
- `sitemap.ts`, `robots.ts`, `icon.svg` a `api/` zůstávají mimo skupiny.

**Náhledové karty pro sdílení** kreslí `next/og` za běhu ze stejných
design tokenů jako web (`src/components/NahledovyObrazek.tsx`). Karta má
**každá stránka vlastní**, ne jedna celá sekce: odkaz se sdílí po jedné
konkrétní stránce a šest odkazů se stejnou kartou nedá příjemci důvod
kliknout zrovna na tenhle. Vede na ní název stránky, ne název webu.

- Texty jsou v `sdileni` ve slovníku jazyka, odděleně od textů na stránce.
  Úvodní odstavec je psaný pro čtenáře, který už na stránce je, a jako
  popisek odkazu se utne v půlce věty. `popis` proto drží do 160 znaků
  a hlídá to test spolu s délkou titulku a podtitulu.
- `alt` musí být v jazyce karty, a statický export by byl pro obě verze
  stejný — proto `generateImageMetadata`, které dostane `params`.
- Vlastní písmo se nenahrává. Záložní rodina `ImageResponse` vykreslí
  cyrilici i českou diakritiku ověřeně; stahovat Bricolage při buildu by
  znamenalo síťový požadavek v nasazení kvůli jednomu obrázku a cyrilici
  Bricolage stejně nemá.
- E2e hlídá, že karta doopravdy vrátí PNG a že je adresa absolutní —
  robot sociální sítě čte značku mimo kontext stránky a relativní cestu
  si nedoplní. Rozbitá karta se jinak pozná až tím, že odkaz ve skupině
  vypadá jako prázdný rámeček.

`og:locale` nese jazyk stránky a `og:locale:alternate` obě zbylé verze,
aby jazykové mutace nevypadaly jako tři samostatné weby.

**Vyhledávač okrsku je sdílená komponenta.** `VyhledavacOkrsku`
a `MapaOkrsku` obsluhují českou i obě cizojazyčné stránky; texty berou
prop `texty` a formát čísel a data prop `locale`. Čeština není výchozí
zadrátovaný text, ale `src/preklady/vyhledavacCesky.ts` ve stejném tvaru
jako překlady (`Preklad['vyhledavac']`), takže přidaný řetězec
v angličtině shodí `tsc`, dokud ho nemá i čeština.

Přeložit se musely i stavy, kdy vyhledávač nic nenajde — právě ty
rozhodují. Hláška „ulici jsme nenašli" v češtině čtenáři, který česky
neumí, neřekne, jestli udělal překlep, nebo je nástroj rozbitý.
Nepřekládají se naopak názvy ulic, městských částí a volebních místností:
jsou to jména míst, která musí člověk poznat na ceduli.

`dosad()` kvůli tomu sedí v `src/lib/sablony.ts` bez závislostí. Ve
`mandatyPrehled.ts`, kde vzniklo, by do klientského balíku přitáhlo
`node:fs` — ten soubor čte číselník ze souborového systému.

**Přepínač jazyků** vede z české stránky na její doslovný protějšek tam,
kde existuje (`/kde-volim` → `/en/where-do-i-vote`), jinak na rozcestník
jazyka. Dvojice jsou v `PARY` v `src/lib/jazyky.ts` a ze stejného zdroje
se odvozuje i hreflang, takže se nemůžou rozejít — test to hlídá oběma
směry.

**Kde je text.** V `src/preklady/en.ts` a `uk.ts`. Typ `Preklad` se
odvozuje z anglické verze (`typeof en`), takže ukrajinská neprojde `tsc`,
dokud nemá všechny klíče. Co typ neuhlídá — délku seznamů, prázdné
řetězce a zástupné značky `{…}` — hlídá `tests/preklady.test.ts`.
Čísla (počty mandátů) se do vět dosazují z číselníku, ne opisují do
každého jazyka: ručně psaný rozsah se od číselníku rozešel hned napoprvé.

**Test volební způsobilosti** na `/[jazyk]/can-i-vote` je jediné místo na
webu, kde se z údajů o člověku skládá odpověď „smíte / nesmíte".
Vyhodnocení je oddělené od komponenty (`vyhodnot()` v
`src/components/TestZpusobilosti.tsx`), aby šlo otestovat bez vykreslování,
a pokryté testem pro všech osmnáct kombinací. Nic se neodesílá a nikam
neukládá — u dotazu na pobytový status cizince je to podmínka, ne bonus.

**Právní podklad** je § 4 odst. 1 zákona č. 491/2001 Sb.: volit smí občan
ČR s trvalým pobytem v obci a občan jiného státu, kterému to přiznává
mezinárodní smlouva. Jediná taková smlouva pokrývá občany EU, takže
občanství mimo EU volební právo v obci nezakládá bez ohledu na délku
pobytu. Zápis do seznamu voličů se od 1. 1. 2026 **nepodává**: dodatek
stálého seznamu zanikl a § 23 zákona č. 88/2024 Sb. zavedl jediný
centrální seznam plněný ze základních registrů. Příručky pro cizince,
které pořád mluví o dodatku a o lhůtě, popisují právo před reformou.

**Strojový překlad** (`pnpm preloz`) je nástroj na rozšíření sekce o další
obsah, ne na přeložení webu. Doslovné citace politiků, hodnocení
proveditelnosti a odkazy na paragrafy přeskakuje záměrně — přeložená
citace není doslovná citace a web má zásadu, že citace je ověřená proti
zdroji. Výstup nese ve frontmatteru `strojovyPreklad: true` a je určený
k redakční kontrole, ne k přímému publikování.

## Import dat z ČSÚ

```bash
pnpm import:csu
```

Skript stáhne sadu `kv2026` z `volby.gov.cz/opendata`; když není k dispozici,
upozorní a nic nepřepíše. Spouští se ručně a výsledek se commituje — nikdy
neběží při buildu, aby výpadek ČSÚ nemohl shodit nasazení.

Ze sady `kv2026` je naimportováno 8 607 kandidatur, 7 861 osob a 24 volebních
stran na magistrát. Čísla na hlasovacím lístku jsou od 4. 9. 2026 vylosovaná
a naimportovaná — všech 330 stran v 58 zastupitelstvech. Do losování za ně ČSÚ
dosazoval náhradní hodnoty od 501 výš, které import do `cislo` nepouští; ta
pojistka v kódu zůstává pro příští ročník.

Registr kandidátů nese u každého kandidáta i údaj `PLATNOST` (A = platný,
N = „neplatný, odvolaný“). Import u hodnoty N zapíše `neplatny: true`: kandidát
zůstává na svém místě v listině, web ho označí jako neplatnou kandidaturu, do
počtů kandidátů ho nepočítá a lídrem kandidátky být nemůže. K 9. 9. 2026 jde
o 17 kandidatur v pěti městských částech, na magistrátu ani v senátních
obvodech o žádnou.

Nácvik pipeline a archivní ročník proti reálným datům:

```bash
pnpm import:csu --rok 2022 --vystup data/vysledky-2022/kandidatky
```

Ověřeno: 58 zastupitelstev (magistrát + 57 MČ), 8 253 kandidátů.

## Volební okrsky a místnosti

Datová vrstva pro `/kde-volim`: ke každé pražské adrese číslo okrsku, ke
každému okrsku hranice a střed, a schéma pro adresy volebních místností.

```bash
pnpm import:okrsky
```

Zdrojem je ČÚZK, ne ČSÚ ani IPR — jediný registr, který mapuje adresní místo
na okrsek pro celou Prahu a aktualizuje se prakticky denně:

- **Sestavy „Seznam adresních míst s volebními okrsky"**
  (`services.cuzk.cz/sestavy/VO/<kód MOMC>.zip`). Praha jako obec vlastní
  soubor **nemá**; existuje 57 souborů po městských částech a kód MOMC je
  totožný s kódem zastupitelstva v `data/ciselniky/zastupitelstva.json`.
  CSV se středníkem ve Windows-1250.
- **Speciální výměnný formát RÚIAN `ST_UVOH`**
  (`vdp.cuzk.cz/vymenny_format/specialni/<YYYYMMDD>_ST_UVOH.xml.zip`),
  hranice a definiční body všech okrsků v ČR. Vzniká ke 3. dni v měsíci;
  skript si poslední vydání najde sám, `--datum 20260903` ho vynutí.

Výstup v `data/okrsky/` (asi 9 MB, commituje se):

| Soubor | Co v něm je |
|---|---|
| `prehled.json` | 1 120 okrsků: číslo, městská část, střed, počet adres, poznámka z RÚIAN |
| `adresy/<mč>.json` | každé adresní místo městské části jako `[číslo domu, okrsek, kód ADM, lat, lon]`, seskupené po ulicích |
| `hranice/<mč>.geojson` | polygony okrsků ve WGS84, vlastnosti `cislo`, `kod`, `mestskaCast` |

Souřadnice převádí `src/lib/krovak.ts` (S-JTSK → WGS84, Helmert EPSG:1623)
a test je drží na dvacet centimetrů od hodnot, které pro tytéž body vrací
prohlížecí služba ČÚZK. Geometrický server hl. m. Prahy používá hrubší
tříparametrovou transformaci, která je proti tomu posunutá asi o deset
metrů — proto se s ním neporovnáváme.

Vyhledání okrsku podle adresy dělá `najdiAdresu` v `src/lib/okrsky.ts`:
ulice se porovnává celá bez diakritiky, číslo domu se zkouší jako
popisné/orientační, samotné orientační i samotné popisné, a víc shod se
vrátí všechny — rozhodnout musí čtenář, ne kód. Import ověřuje, že počet
okrsků v adresách i v hranicích sedí na číselník ČSÚ (1 120), a vypíše
adresy, které RÚIAN řadí do okrsku jiné městské části (k 7. 9. 2026 jedna:
Měchnovská 2426/6 v Praze 11 patří do okrsku 10064).

Na `/kde-volim` nad tím běží vyhledávač (`src/components/VyhledavacOkrsku.tsx`).
Data k němu servírují dvě statické routy generované při buildu:
`/api/okrsky/ulice` (index ulic → městské části, asi 215 kB) a
`/api/okrsky/<mč>` (adresy jedné části s okrsky a známými místnostmi,
6 kB až 580 kB). Klient si stáhne jen soubory částí, kde hledaná ulice
leží — celá Praha se na něj nikdy netahá.

K výsledku se kreslí mapa (`src/components/MapaOkrsku.tsx`): hranice
nalezeného okrsku z `/api/okrsky/<mč>/hranice`, ostatní okrsky části slabě,
bod adresy a červený čtverec volební místnosti, když známe její polohu.
Tu dohledává `src/lib/geokodovani.ts` při buildu z adresy místnosti
v našem registru ČÚZK (žádný cizí geokodér); v YAML jde zadat ručně
polem `poloha`, když vchod leží jinde. Leaflet i hranice se stahují až po
zobrazení výsledku. Podklad jsou dlaždice OpenStreetMap, jediný cizí server,
na který web sahá — zásady ochrany údajů to říkají výslovně a e2e test mapy
proto kontroluje jen vektorové vrstvy z našich dat, ne dlaždice.

**Adresy volebních místností** v datech ČÚZK nejsou. Píšou se ručně podle
„Oznámení o době a místě konání voleb" do `content/volebni-mistnosti/<mč>.yaml`,
jeden soubor na městskou část:

```yaml
mestskaCast: praha-7
overeno: 2026-09-25
volby: komunalni-2026        # nebo `drivejsi`, dokud oznámení 2026 nevyšlo
zdroj:
  nazev: "Oznámení o době a místě konání voleb, ÚMČ Praha 7"
  url: "https://www.praha7.cz/..."
  vyveseno: 2026-09-24
mistnosti:
  - nazev: "ZŠ Strossmayerovo náměstí"
    adresa: "Strossmayerovo nám. 990/4, Praha 7"
    okrsky: [7001, 7002]
    bezbarierova: true
```

Build spadne, když je okrsek uvedený dvakrát nebo nepatří do rozsahu dané
městské části. K 15. 9. 2026 je vyplněno 55 z 57 částí (1 107 z 1 120 okrsků),
z toho 51 podle dokumentů k volbám 2026 („Informace o počtu a sídle volebních
okrsků", případně už „Oznámení o době a místě konání voleb") a čtyři podle
voleb 2025 nebo 2024 (Dubeč, Křeslice, Petrovice, Slivenec). Chybí Praha 18
a Přední Kopanina, u kterých k tomu datu oznámení dohledané nebylo. Každý
soubor má v hlavičce komentář se zdrojem a nesrovnalostmi.

Praha 9 si adresy místností zapisuje přímo do RÚIAN jako poznámku k okrsku;
`src/lib/mistnosti.ts` je nabídne jako záložní zdroj s nálepkou, že to není
oznámení pro rok 2026. Redakční soubor má vždy přednost.

Oznámení na úředních deskách sbírá `pnpm import:desky`: stahuje desky
14 městských částí, které je publikují jako otevřená data, a hledá v nich
oznámení o době a místě konání voleb. Adresy desek zbylých 43 částí jsou
v `content/uredni-desky.yaml`.

## ISR a cena cache na Vercelu

Všechny stránky regeneruje layout po 900 s (`revalidate = 900`) kvůli
fázím voleb a moratoriu; Vercel účtuje zápis do ISR cache jen při změně
obsahu, takže deterministický výstup je zadarmo. Z toho plynou tři pravidla:
žádné `new Date()` ani náhodnost v renderu, sitemapa a `llms.txt` jsou
statické, a `connection()` (čtení času za běhu, které stránku vyřadí z cache
úplně) se volá jen v okně dvou revalidací kolem hranic moratoria —
viz `src/lib/zaBehu.ts` a test, který drží obě čísla pohromadě. Profily
kandidátů (7 860) se generují na vyžádání a po nasazení se do cache zapíší
jednou; předgenerovat je v buildu by nasazení nafouklo o stovky megabajtů.

## Vyhledávače a jazykové modely

Kanonická doména je `https://www.volimprahu.cz` (apex přesměrovává na www),
konstanta je v `src/lib/web.ts`. Web vydává `/robots.txt` (zakázáno jen
`/api/` a `/hledani`), `/sitemap.xml` se všemi stránkami včetně profilů
kandidátů, `/llms.txt` jako mapu obsahu a zásad pro jazykové modely,
RSS `/aktualne/feed.xml`, výchozí náhledový obrázek `/opengraph-image`
a favicon `/icon.svg`. Každá stránka má kanonickou adresu; strukturovaná
data (JSON-LD) nese komponenta `StrukturovanaData`: WebSite v layoutu, Event
na titulní straně, NewsArticle u aktuality, Person na profilu kandidáta a
BreadcrumbList všude, kde jsou drobečky. E2E test to hlídá.

## Anketa čtenářů

Hlasy se v produkci ukládají do Postgresu. Připojení aplikace bere
z `POSTGRES_URL` (případně `DATABASE_URL`) a tabulky `hlasy` a `odbery` si
vytvoří při prvním spuštění. Databáze musí běžet v Evropské unii — zásady
ochrany osobních údajů to o ní tvrdí (Neon, Frankfurt). Bez nastaveného
úložiště anketa v produkci úmyslně selže nahlas, aby se hlasy neztrácely do
efemérních funkcí. Lokálně žádná databáze potřeba není — mimo produkci se
zapisuje do `.data/`.

Anketa se čtenářům otevře až ve chvíli, kdy jsou v `data/kandidatky` skutečné
subjekty. Do té doby stránka vysvětluje, že není z čeho vybírat.

## Co build vynucuje sám

Tyhle věci nejsou na lidské pozornosti — spadne na nich build nebo CI
(`.github/workflows/ci.yml`: kompilace obsahu, typy, lint, `pnpm validate`,
testy, nácvik volební noci, build, e2e a audit přístupnosti):

- Hodnocení bez zdůvodnění delšího než 120 znaků nebo bez alespoň jednoho zdroje
  se **nedá publikovat**.
- Barvy použité na text musí splňovat WCAG 2.2 AA (`tests/kontrast.test.ts`).
- V hodnoceních se nesmí objevit slovník verdiktu („lež", „podvod", …) —
  web hodnotí proveditelnost, ne pravdivost (`pnpm validate`).
- Předvolební průzkumy se nezobrazují v době moratoria podle § 6 odst. 1
  zákona č. 234/2025 Sb., tedy od úterý 6. 10. 2026 do ukončení hlasování
  v sobotu 10. 10. ve 14:00. Rozhoduje jediná funkce `smiZobrazitPruzkum`
  v `src/lib/moratorium.ts`. Návrh je fail-closed: kdyby v něm chybělo datum
  `MORATORIUM_OD` nebo citace `PRAVNI_OPORA`, `BlokPruzkumu` by nepustil ven nic.
- Přístupnost hlídá axe se sadou pravidel WCAG 2.2 AA nad všemi klíčovými
  trasami včetně anglických a ukrajinských (`tests/e2e/pristupnost.spec.ts`).
  Lighthouse staví své skóre přístupnosti na témže nástroji. Zvlášť se měří,
  že `<html lang>` sedí s jazykem stránky — to axe na statické stránce
  nepozná, a přitom je to celý důvod, proč má cizojazyčná sekce vlastní
  kořenový layout.
- Obě jazykové verze musí mít shodnou strukturu, žádný prázdný řetězec
  a tytéž zástupné značky (`tests/preklady.test.ts`). Kladný závěr testu
  způsobilosti smí padnout jen tam, kde ho zákon dává — hlídá to zvlášť,
  aby překlep ve stavu nepustil ven „ano" pro občanství mimo EU.
- Kalkulačka mandátů na `/koalice` počítá podle § 45 zákona č. 491/2001 Sb.
  Drží ji `tests/mandaty.test.ts` proti oficiálnímu rozdělení mandátů z roku 2022
  ve všech 58 pražských zastupitelstvech a `pnpm nacvik` totéž proti živým datům ČSÚ.
  Vyjádření o koalicích v `content/koalice.yaml` nesmí jako parafráze nést citaci.
- Výsledky ankety nelze vydat před zavřením volebních místností. Rozhoduje
  o tom jediná funkce, kterou volá API i stránka, a test hlídá, že se okno
  hlasování a okno výsledků nikdy nepřekryjí (`tests/hlasovani.test.ts`).

## Volební noc

Pipeline je **nacvičená proti reálným datům roku 2022**:

```bash
pnpm nacvik
```

Skript projde celou cestu — stažení z ČSÚ, parsování, uložení snapshotu,
načtení zpět, chování při výpadku — a ověří známé výsledky roku 2022
(SPOLU 24,72 % a 19 mandátů, účast 43,91 %, součet mandátů 65 v každém
z 58 zastupitelstev). Nekončí nulou, když cokoli nesedí.

Jak to funguje:

- Jeden požadavek na ČSÚ vrací celou Prahu, tedy všech 58 zastupitelstev.
- Stahuje výhradně cron přes `/api/volebni-noc`, nikdy požadavek uživatele.
- Když stahování selže, poslední dobrý snapshot se **nepřepisuje** a stránka
  ukáže starší data s viditelným časem. Nad 10 minut na to upozorní červeně.
- `/vysledky` čte jen snapshot, s `revalidate = 30`.

Sčítání spouští **GitHub Actions** (`.github/workflows/volebni-noc.yml`),
ne Vercel Cron — Hobby umožňuje cron jen jednou denně, což ve volební noci
znamená, že by neproběhl ani jednou. Workflow volá stejný endpoint každé
dvě minuty v sobotu večer a každých pět minut přes noc. Zdarma a bez závislosti
na tarifu. Denní cron ve `vercel.json` zůstává jako doběh.

Nácvik nikdy nepíše do ostrého snapshotu — má vlastní cíl a nad produkčním
úložištěm odmítne běžet, aby výsledky roku 2022 nemohl vydat za průběžný
stav voleb 2026.

Web se sám přepíná mezi režimy podle času (`src/lib/rezim.ts`): před volbami,
volební dny, sčítání a od 13. 10. **archiv**. V archivním režimu je nad obsahem
pruh, který říká, že volby proběhly a nic z webu už není návod, jak volit.

## Konfigurace v produkci

| Proměnná | Kde se nastavuje | K čemu slouží |
|---|---|---|
| `POSTGRES_URL` (nebo `DATABASE_URL`) | Vercel, integrace Postgresu | úložiště ankety |
| `BLOB_READ_WRITE_TOKEN` | Vercel, Blob store | snapshot výsledků volební noci |
| `CRON_SECRET` | Vercel i secrets repozitáře | ověření volání `/api/volebni-noc` |
| `VOLEBNI_NOC_URL` | secrets repozitáře | adresa endpointu (`https://…/api/volebni-noc`) pro workflow volební noci |

Bez úložiště anketa v produkci úmyslně selže nahlas a bez `CRON_SECRET` vrací
endpoint volební noci 503 — obojí schválně, aby chybějící nastavení nešlo
přehlédnout. Bez `BLOB_READ_WRITE_TOKEN` se snapshot ukládá na disk, což na
efemérních funkcích nepřežije.
