import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Server-side signout que limpia cookies correctamente
export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()

  const response = NextResponse.json({ success: true })

  // Limpiar todas las cookies de Supabase manualmente
  const cookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
  ]

  for (const name of cookieNames) {
    response.cookies.set(name, '', { maxAge: 0, path: '/' })
    response.cookies.set(`${name}.0`, '', { maxAge: 0, path: '/' })
    response.cookies.set(`${name}.1`, '', { maxAge: 0, path: '/' })
  }

  return response
}
