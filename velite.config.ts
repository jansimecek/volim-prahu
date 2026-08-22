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
  schema: s.object({
    nazev: s.string().min(1),
    zkratka: s.string().min(1),
    slug: s.slug('strana'),
    /** `magistrat` nebo slug městské části. */
    uroven: s.string().min(1),
    lidr: s.string().optional(),
    web: url.optional(),
    programUrl: url.optional(),
    /** Vyplňuje se jen u ručně ověřených shod — viz content/hlidac-mapping.yaml. */
    hlidacOsobaId: s.string().optional(),
    publikovano: s.boolean().default(false),
    content: s.mdx(),
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
    nazev: s.string().min(1),
    slug: s.slug('senat'),
    mestskeCasti: s.array(s.string()).default([]),
    publikovano: s.boolean().default(false),
    content: s.mdx(),
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
  collections: { mestskeCasti, strany, programy, stranky, senat, rozhovory },
})
