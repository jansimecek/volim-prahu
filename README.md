# Volím Prahu — volební průvodce 2026

Web, kde pražský volič najde, kdo kandiduje do jeho zastupitelstva, co slibuje a
**co z toho daná úroveň samosprávy vůbec může splnit**. Komunální a senátní volby
9.–10. října 2026.

Implementační zadání: [`docs/zadani.md`](docs/zadani.md).

## Rychlý start

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
| `pnpm validate --strict --odkazy` | Přísná varianta před ostrým spuštěním |
| `pnpm import:csu` | Import kandidátek a číselníků z ČSÚ |
| `pnpm gen:mc` | Doplní chybějící skelety městských částí |

## Jak je repo rozdělené

- **`content/`** — všechno, co píše člověk (MDX + frontmatter). Tvar hlídají Zod
  schémata v [`velite.config.ts`](velite.config.ts); nevalidní obsah shodí build.
- **`data/`** — generováno skripty, **nikdy se needituje ručně**. Chyba
  v generovaných datech se opravuje jako override v `content/opravy/`, ne
  přepsáním JSONu — jinak ji smaže další import.
- **`scripts/`** — ETL a generátory, spouští se ručně a výsledek se commituje.
- **`src/`** — routy, komponenty, hodnotící logika.

## Import dat z ČSÚ

```bash
pnpm import:csu
```

Sada `kv2026` na `volby.gov.cz/opendata` **zatím neexistuje** — skript to pozná,
nic nepřepíše a řekne to. Kontrolovat denně; ČSÚ ji má vydat v řádu dnů po
22. 8. 2026.

Nácvik pipeline a archivní ročník proti reálným datům:

```bash
pnpm import:csu --rok 2022 --vystup data/vysledky-2022/kandidatky
```

Ověřeno: 58 zastupitelstev (magistrát + 57 MČ), 8 253 kandidátů.

## Anketa čtenářů — co je potřeba dozapnout

Anketa je hotová, ale bez úložiště v produkci úmyslně selže nahlas, aby se
hlasy neztrácely do efemérních funkcí. Zbývá jedno nastavení ve Vercelu:

1. Vercel → projekt `volim-prahu` → **Storage** → přidat Postgres z Marketplace
   (Neon má bezplatný tarif, který na tenhle objem stačí).
2. **Zvolit region v Evropské unii** (například Frankfurt). Zásady ochrany
   osobních údajů tvrdí, že data leží v EU — s jiným regionem by ta věta
   přestala platit.
3. Integrace sama nastaví `POSTGRES_URL`. Aplikace si tabulky `hlasy`
   a `odbery` vytvoří při prvním spuštění.

Lokálně žádná databáze potřeba není — mimo produkci se zapisuje do `.data/`.

Anketa se navíc čtenářům otevře až ve chvíli, kdy budou v `data/kandidatky`
skutečné subjekty. Do té doby stránka vysvětluje, že není z čeho vybírat.

## Co build vynucuje sám

Tyhle věci nejsou na lidské pozornosti — spadne na nich build nebo CI:

- Hodnocení bez zdůvodnění delšího než 120 znaků nebo bez alespoň jednoho zdroje
  se **nedá publikovat**.
- Barvy použité na text musí splňovat WCAG 2.2 AA (`tests/kontrast.test.ts`).
- V hodnoceních se nesmí objevit slovník verdiktu („lež", „podvod", …) —
  web hodnotí proveditelnost, ne pravdivost (`pnpm validate`).
- Výsledky ankety nelze vydat před zavřením volebních místností. Rozhoduje
  o tom jediná funkce, kterou volá API i stránka, a test hlídá, že se okno
  hlasování a okno výsledků nikdy nepřekryjí (`tests/hlasovani.test.ts`).

## Stav

**Hotovo:** skelet a datový model, import z ČSÚ, číselník 57 MČ, stránky všech
městských částí, metodika, `/kde-volim` fáze 1, CI, anketa čtenářů,
kompetenční matice (`/kdo-o-cem-rozhoduje`), rozpočtový rámec
(`/rozpoctovy-ramec`), profily všech 24 kandidátek do ZHMP, prvních osm
hodnocení proveditelnosti, senátní blok včetně odpovědi, ve kterých městských
částech se senátor letos vůbec nevolí, a rozbor plnění programového prohlášení
rady 2022–2026 (`/minule-obdobi`). Všechny čtyři osy hodnocení tím mají oporu.

Kandidátky ze sady `kv2026` jsou naimportované: 8 607 kandidatur, 7 861 osob,
24 volebních stran na magistrát. Čísla na hlasovacím lístku zatím vylosovaná
nebyla — ČSÚ za ně dosazuje náhradní hodnoty od 501 výš a import je do
`cislo` nepustí.

**Čeká se na:** vylosování čísel kandidátek, stanovisko ÚDHPSH k registraci
třetí osoby, souhlas IPR Praha s ArcGIS endpointem, úložiště ankety ve Vercelu.

Doložené mediální výroky lídrů jsou v `content/vyroky-lidru.yaml` a zobrazují
se na profilu kandidáta. Publikují se jen doslovné citace ověřené proti zdroji;
u 14 z 24 lídrů se nic doložitelného nenašlo a je u nich napsáno proč.

Fáze 2 `/kde-volim` běží: `pnpm import:desky` stahuje úřední desky 14 městských
částí, které je publikují jako otevřená data, a hledá v nich oznámení o době
a místě konání voleb. Adresy desek zbylých 43 částí jsou v
`content/uredni-desky.yaml`. Spouštět opakovaně od poloviny září — lhůta
pro vyvěšení je 24. 9. 2026.

## Volební noc

Pipeline je hotová a **nacvičená proti reálným datům roku 2022**:

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

**Před volbami je potřeba:**

1. Přidat Blob store ve Vercelu (nastaví `BLOB_READ_WRITE_TOKEN`). Bez něj
   se snapshot ukládá na disk, což na efemérních funkcích nepřežije.
2. Nastavit `CRON_SECRET`. Bez něj endpoint v produkci vrací 503 — je
   fail-closed schválně, aby chybějící nastavení nešlo přehlédnout.
3. Do Secrets repozitáře doplnit `CRON_SECRET` a `VOLEBNI_NOC_URL`
   (`https://…/api/volebni-noc`).

Sčítání spouští **GitHub Actions** (`.github/workflows/volebni-noc.yml`),
ne Vercel Cron — Hobby umožňuje cron jen jednou denně, což ve volební noci
znamená, že by neproběhl ani jednou. Workflow volá stejný endpoint každé
dvě minuty v sobotu večer a každých pět minut přes noc. Zdarma a bez závislosti
na tarifu. Denní cron ve `vercel.json` zůstává jako doběh.

Nácvik nikdy nepíše do ostrého snapshotu — má vlastní cíl a nad produkčním
úložištěm odmítne běžet, aby výsledky roku 2022 nemohl vydat za průběžný
stav voleb 2026.

**Další na řadě:** archivní režim po sečtení výsledků.
