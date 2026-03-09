import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// POST: Server-side signout que limpia cookies correctamente
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  // Crear cliente Supabase que escribe cookies directamente en la response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...options } as any)
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: '', ...options, maxAge: 0 } as any)
        },
      },
    }
  )

  await supabase.auth.signOut()

  // Limpiar TODAS las cookies que contengan 'sb-' por si acaso
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  for (const cookie of allCookies) {
    if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
    }
  }

  return response
}
