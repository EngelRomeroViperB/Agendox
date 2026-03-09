import { NextResponse, type NextRequest } from 'next/server'

// POST: Server-side signout que limpia cookies de Supabase
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  // Limpiar TODAS las cookies de Supabase del request
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
    }
  }

  // También limpiar cookie de impersonación
  response.cookies.set('x-impersonate-business', '', { maxAge: 0, path: '/' })

  return response
}
