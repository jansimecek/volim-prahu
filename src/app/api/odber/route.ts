import { NextResponse } from 'next/server'
import { schemaOdberu } from '@/lib/hlasovani'
import { nactiUloziste } from '@/lib/uloziste'

export const runtime = 'nodejs'

/**
 * E-mail pro pozvánku k povolebnímu hodnocení. Ukládá se do vlastní tabulky
 * bez jakékoli vazby na odevzdaný hlas — spojit je nelze ani z databáze.
 */
export async function POST(request: Request) {
  const vstup = schemaOdberu.safeParse(await request.json().catch(() => null))
  if (!vstup.success) {
    return NextResponse.json({ chyba: 'Neplatná e-mailová adresa.' }, { status: 400 })
  }

  const uloziste = await nactiUloziste()
  await uloziste.ulozOdber(vstup.data.email)

  return NextResponse.json({ ulozeno: true })
}
