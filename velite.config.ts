import { defineConfig, defineCollection, s } from 'velite'
import {
  CAS,
  HISTORIE,
  KOMPETENCE,
  MIN_DELKA_ZDUVODNENI,
  ROZPOCET,
  ZAVER,
} from './src/lib/hodnoceni'

/**
 * Schémata obsahu. Build musí spadnout na nevalidním obsahu — u jednoho vývojáře
 * bez redakčního procesu je tohle jediná kontrola kvality, která existuje.
 */

const url = s.string().url()

/** Hodnocení jednoho slibu. Nejpřísnější schéma v projektu, a to záměrně. */
const hodnoceni = s.object({
  kompetence: s.enum(KOMPETENCE),
  rozpocet: s.enum(ROZPOCET),
  cas: s.enum(CAS),
  historie: s.enum(HISTORIE),
  zaver: s.enum(ZAVER),
  zduvodneni: s
    .string()
    .min(
      MIN_DELKA_ZDUVODNENI,
      `Zdůvodnění musí mít alespoň ${MIN_DELKA_ZDUVODNENI} znaků a odkazovat na konkrétní fakt, ne na obecné hodnocení.`,
    ),
  zdroje: s.array(url).min(1, 'Hodnocení bez alespoň jednoho zdroje se nesmí publikovat.'),
  /** Reakce subjektu podle práva na odpověď (kap. 8 zadání). */
  reakce_subjektu: s
    .object({
      text: s.string().min(1),
      datum: s.isodate(),
      odkaz: url.optional(),
    })
    .optional(),
})

const bodProgramu = s.object({
  id: s.string().min(1),
  slib: s.string().min(1),
  oblast: s.string().optional(),
  citace_zdroje: url,
  hodnoceni: hodnoceni.optional(),
})

const mestskeCasti = defineCollection({
  name: 'MestskaCast',
  pattern: 'mestske-casti/**/*.mdx',
  schema: s
    .object({
      nazev: s.string().min(1),
      slug: s.slug('mestska-cast'),
      kodZastupitelstva: s.string().regex(/^\d{6}$/),
      mandaty: s.number().int().positive(),
      okrsky: s.number().int().positive(),
      urad: url.optional(),
      /** 2–4 klíčová lokální témata; prázdné pole je povolené, dokud se nedopíše. */
      temata: s
        .array(s.object({ nadpis: s.string().min(1), text: s.string().min(1) }))
        .max(4)
        .default([]),
      koalice2022: s.string().optional(),
      /** Dokud je false, stránka existuje, ale je označená jako rozpracovaná. */
      publikovano: s.boolean().default(false),
      content: s.mdx(),
    })
    .transform((data) => ({ ...data, url: `/mestska-cast/${data.slug}` })),
})

const strany = defineCollection({
  name: 'Strana',
  pattern: 'strany/**/*.mdx',
  schema: s
    .object({
      /** Přesně tak, jak zní registrovaný název volební strany. */
      nazev: s.string().min(1),
      zkratka: s.string().min(1),
      slug: s.slug('strana'),
      /** `magistrat` nebo slug městské části. */
      uroven: s.string().min(1),
      lidr: s.string().optional(),
      /**
       * Rozlišení, které nelze obejít: „jednička kandidátky" a „kandidát na
       * primátora" nejsou totéž a u části subjektů máme doloženo jen to druhé.
       */
      lidrRole: s.enum(['lidr-kandidatky', 'kandidat-na-primatora']).optional(),
      lidrZdroj: url.optional(),
      lidrPopis: s.string().min(1).optional(),
      /** Stav programu k datu uvedenému v `programOvereno`. */
      programStav: s
        .enum(['zverejnen', 'jen-casti', 'jen-priority', 'avizovan', 'nedohledan'])
        .default('nedohledan'),
      programOvereno: s.isodate(),
      web: url.optional(),
      programUrl: url.optional(),
      /** Vyplňuje se jen u ručně ověřených shod — viz content/hlidac-mapping.yaml. */
      hlidacOsobaId: s.string().optional(),
      publikovano: s.boolean().default(false),
      content: s.mdx(),
    })
    .superRefine((data, ctx) => {
      // Jméno konkrétního člověka se nesmí objevit bez zdroje a bez role.
      if (data.lidr && !data.lidrZdroj) {
        ctx.addIssue({
          code: 'custom',
          message: `U subjektu "${data.nazev}" je uveden lídr bez zdroje (lidrZdroj).`,
        })
      }
      if (data.lidr && !data.lidrRole) {
        ctx.addIssue({
          code: 'custom',
          message: `U subjektu "${data.nazev}" chybí lidrRole — je to jednička kandidátky, nebo kandidát na primátora?`,
        })
      }
      if (data.programStav === 'zverejnen' && !data.programUrl) {
        ctx.addIssue({
          code: 'custom',
          message: `Subjekt "${data.nazev}" má program označený jako zveřejněný, ale chybí odkaz.`,
        })
      }
    }),
})

const programy = defineCollection({
  name: 'Program',
  pattern: 'programy/**/*.mdx',
  schema: s.object({
    subjekt: s.string().min(1),
    uroven: s.string().min(1),
    zdroj_programu: url.optional(),
    /**
     * Když subjekt program nezveřejnil, uvede se důvod a hodnocení se u něj
     * nezobrazuje vůbec — symetrie podle kap. 8 zadání.
     */
    program_nedohledan: s.string().optional(),
    body: s.array(bodProgramu).default([]),
    content: s.mdx(),
  }),
})

const stranky = defineCollection({
  name: 'Stranka',
  pattern: 'stranky/**/*.mdx',
  schema: s.object({
    title: s.string().min(1),
    slug: s.slug('stranka'),
    popis: s.string().min(1),
    aktualizovano: s.isodate(),
    content: s.mdx(),
  }),
})

const senat = defineCollection({
  name: 'SenatniObvod',
  pattern: 'senat/**/*.mdx',
  schema: s.object({
    cislo: s.number().int().positive(),
    /** Oficiální název obvodu, tedy jeho sídlo — např. „Praha 5". */
    nazev: s.string().min(1),
    slug: s.slug('senat'),
    /** Jméno stávajícího senátora se stejně jako u lídrů nesmí objevit bez zdroje. */
    senator: s.string().min(1),
    senatorZdroj: url,
    /** Slugy městských částí, které do obvodu spadají celé. */
    mestskeCasti: s.array(s.string().min(1)).default([]),
    /** Městské části rozdělené mezi dva obvody — u nich nelze odpovědět paušálně. */
    mestskeCastiCastecne: s
      .array(s.object({ slug: s.string().min(1), popis: s.string().min(1) }))
      .default([]),
    zdroje: s.array(s.object({ text: s.string().min(1), url: url })).min(1),
    publikovano: s.boolean().default(false),
    content: s.mdx(),
  }),
})

/**
 * Kompetenční matice — opora osy „kompetence". Jeden soubor, protože jde
 * o tabulku, kterou udržuje jeden člověk a musí jít přečíst celou najednou.
 */
const kompetence = defineCollection({
  name: 'Kompetence',
  pattern: 'kompetence.yaml',
  single: true,
  schema: s.object({
    agendy: s
      .array(
        s.object({
          id: s.string().min(1),
          nazev: s.string().min(1),
          uroven: s.enum(['magistrat', 'mestska-cast', 'sdilene', 'mimo-samospravu']),
          vysvetleni: s.string().min(1),
          /** Nejčastější omyl u téhle agendy. Nepovinný, ale je to jádro užitku. */
          omyl: s.string().min(1).optional(),
          /** Bez opory se agenda nesmí zobrazit — stejné pravidlo jako u hodnocení. */
          opora: s
            .array(s.object({ text: s.string().min(1), url: url }))
            .min(1, 'Každá agenda musí mít alespoň jednu oporu s odkazem.'),
        }),
      )
      .min(1),
  }),
})

/**
 * Rozpočtový rámec — opora osy „rozpočet". Schéma navíc kontroluje referenční
 * integritu: každá položka musí odkazovat na existující skupinu a na existující
 * zdroj. Překlep v identifikátoru shodí build, ne až čtenáře.
 */
const rozpocet = defineCollection({
  name: 'Rozpocet',
  pattern: 'rozpocet.yaml',
  single: true,
  schema: s
    .object({
      uvodniVarovani: s.string().min(1),
      skupiny: s
        .array(s.object({ id: s.string().min(1), nadpis: s.string().min(1), popis: s.string().min(1) }))
        .min(1),
      zdroje: s
        .array(s.object({ id: s.string().min(1), nazev: s.string().min(1), url: url }))
        .min(1),
      polozky: s
        .array(
          s.object({
            id: s.string().min(1),
            skupina: s.string().min(1),
            nazev: s.string().min(1),
            hodnota: s.string().min(1),
            rok: s.number().int(),
            /** Záměna schváleného rozpočtu, návrhu a skutečnosti je tady nejčastější chyba. */
            stav: s.enum(['schvaleny', 'navrh', 'skutecnost', 'vyhled']),
            zdrojTyp: s.enum(['primarni', 'sekundarni']),
            vysvetleni: s.string().min(1),
            poznamka: s.string().min(1).optional(),
            opora: s.array(s.string().min(1)).min(1, 'Každé číslo musí mít zdroj.'),
          }),
        )
        .min(1),
      mestskeCastiPriklady: s
        .array(
          s.object({
            slug: s.string().min(1),
            nazev: s.string().min(1),
            obyvatel: s.number().int().positive(),
            rozpocet: s.string().min(1),
            zMagistratu: s.string().min(1),
            investice: s.string().min(1),
            stav: s.enum(['schvaleny', 'navrh']),
            opora: s.array(s.string().min(1)).min(1),
          }),
        )
        .default([]),
    })
    .superRefine((data, ctx) => {
      const skupiny = new Set(data.skupiny.map((sk) => sk.id))
      const zdroje = new Set(data.zdroje.map((z) => z.id))
      for (const polozka of data.polozky) {
        if (!skupiny.has(polozka.skupina)) {
          ctx.addIssue({
            code: 'custom',
            message: `Položka "${polozka.id}" odkazuje na neexistující skupinu "${polozka.skupina}".`,
          })
        }
      }
      const vsechnyOpory = [
        ...data.polozky.flatMap((p) => p.opora.map((o) => [p.id, o] as const)),
        ...data.mestskeCastiPriklady.flatMap((m) => m.opora.map((o) => [m.slug, o] as const)),
      ]
      for (const [kde, zdroj] of vsechnyOpory) {
        if (!zdroje.has(zdroj)) {
          ctx.addIssue({
            code: 'custom',
            message: `"${kde}" odkazuje na neexistující zdroj "${zdroj}".`,
          })
        }
      }
    }),
})

const rozhovory = defineCollection({
  name: 'Rozhovor',
  pattern: 'rozhovory/**/*.mdx',
  schema: s.object({
    nadpis: s.string().min(1),
    slug: s.slug('rozhovor'),
    osoba: s.string().min(1),
    medium: s.string().min(1),
    datum: s.isodate(),
    /** Nikdy nepřebíráme celý text — jen odkaz a vlastní anotace (kap. 11.4). */
    odkaz: url,
    anotace: s.string().min(1).max(600),
    content: s.mdx(),
  }),
})

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: { mestskeCasti, strany, programy, stranky, senat, rozhovory, kompetence, rozpocet },
})
