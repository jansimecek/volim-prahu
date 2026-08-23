import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { COOKIE_HLASU, hlasovaniOtevrene, schemaHlasu } from '@/lib/hlasovani'
import { nactiUloziste } from '@/lib/uloziste'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!hlasovaniOtevrene()) {
    return NextResponse.json({ chyba: 'Anketa je uzavřená.' }, { status: 409 })
  }

  const zasobnik = await cookies()
  if (zasobnik.get(COOKIE_HLASU)) {
    return NextResponse.json({ chyba: 'Z tohoto prohlížeče už hlas odešel.' }, { status: 409 })
  }

  const vstup = schemaHlasu.safeParse(await request.json().catch(() => null))
  if (!vstup.success) {
    return NextResponse.json({ chyba: 'Neplatné údaje.' }, { status: 400 })
  }

  const uloziste = await nactiUloziste()
  await uloziste.ulozHlas(vstup.data)

  // Jediná ochrana proti opakovanému hlasování. Je slabá a říkáme to nahlas:
  // kdo smaže cookie, hlasuje znovu. Silnější obrana by znamenala ukládat
  // IP nebo otisk prohlížeče, což by anketu připravilo o anonymitu.
  zasobnik.set(COOKIE_HLASU, randomUUID(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 120,
  })

  // Odpověď záměrně neobsahuje žádné počty. Před volbami se agregát nevydává.
  return NextResponse.json({ ulozeno: true })
}
