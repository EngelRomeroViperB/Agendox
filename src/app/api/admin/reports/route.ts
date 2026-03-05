import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

async function getBusinessId(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('business_users')
    .select('business_id')
    .eq('id', userId)
    .single()
  return data?.business_id
}

// GET: Generate reports for the business
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const businessId = await getBusinessId(user.id)
  if (!businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 })

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'summary'
  const months = parseInt(searchParams.get('months') || '6')

  const now = new Date()

  if (type === 'summary') {
    // Monthly summary for last N months
    const summaries = []
    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(now, i)
      const from = format(startOfMonth(monthDate), "yyyy-MM-dd'T'HH:mm:ss")
      const to = format(endOfMonth(monthDate), "yyyy-MM-dd'T'23:59:59")

      const { data: appts } = await admin
        .from('appointments')
        .select('id, status, services(price)')
        .eq('business_id', businessId)
        .gte('scheduled_at', from)
        .lte('scheduled_at', to)

      const total = appts?.length || 0
      const completed = appts?.filter((a: any) => a.status === 'completed').length || 0
      const cancelled = appts?.filter((a: any) => a.status === 'cancelled').length || 0
      const revenue = appts
        ?.filter((a: any) => a.status === 'completed')
        .reduce((sum: number, a: any) => sum + (Number(a.services?.price) || 0), 0) || 0

      summaries.push({
        month: format(monthDate, 'yyyy-MM'),
        label: format(monthDate, 'MMM yyyy'),
        total,
        completed,
        cancelled,
        pending: total - completed - cancelled,
        revenue,
      })
    }

    return NextResponse.json({ summaries: summaries.reverse() })
  }

  if (type === 'staff') {
    // Staff performance
    const from = searchParams.get('from') || format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss")
    const to = searchParams.get('to') || format(endOfMonth(now), "yyyy-MM-dd'T'23:59:59")

    const { data: appts } = await admin
      .from('appointments')
      .select('id, status, staff_id, staff(name), services(price)')
      .eq('business_id', businessId)
      .gte('scheduled_at', from)
      .lte('scheduled_at', to)

    // Group by staff
    const staffMap: Record<string, { name: string; total: number; completed: number; revenue: number }> = {}
    appts?.forEach((a: any) => {
      if (!staffMap[a.staff_id]) {
        staffMap[a.staff_id] = { name: a.staff?.name || 'Sin asignar', total: 0, completed: 0, revenue: 0 }
      }
      staffMap[a.staff_id].total++
      if (a.status === 'completed') {
        staffMap[a.staff_id].completed++
        staffMap[a.staff_id].revenue += Number(a.services?.price) || 0
      }
    })

    return NextResponse.json({
      staff: Object.entries(staffMap).map(([id, data]) => ({ id, ...data })),
    })
  }

  if (type === 'services') {
    // Service popularity
    const from = searchParams.get('from') || format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss")
    const to = searchParams.get('to') || format(endOfMonth(now), "yyyy-MM-dd'T'23:59:59")

    const { data: appts } = await admin
      .from('appointments')
      .select('id, status, service_id, services(name, price)')
      .eq('business_id', businessId)
      .gte('scheduled_at', from)
      .lte('scheduled_at', to)

    const serviceMap: Record<string, { name: string; total: number; completed: number; revenue: number }> = {}
    appts?.forEach((a: any) => {
      if (!serviceMap[a.service_id]) {
        serviceMap[a.service_id] = { name: a.services?.name || '—', total: 0, completed: 0, revenue: 0 }
      }
      serviceMap[a.service_id].total++
      if (a.status === 'completed') {
        serviceMap[a.service_id].completed++
        serviceMap[a.service_id].revenue += Number(a.services?.price) || 0
      }
    })

    return NextResponse.json({
      services: Object.entries(serviceMap)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.total - a.total),
    })
  }

  if (type === 'csv') {
    const from = searchParams.get('from') || format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss")
    const to = searchParams.get('to') || format(endOfMonth(now), "yyyy-MM-dd'T'23:59:59")

    const { data: appts } = await admin
      .from('appointments')
      .select('*, staff(name), services(name, price, duration_minutes)')
      .eq('business_id', businessId)
      .gte('scheduled_at', from)
      .lte('scheduled_at', to)
      .order('scheduled_at', { ascending: true })

    const header = 'Fecha,Hora,Cliente,Telefono,Email,Servicio,Profesional,Duracion,Precio,Estado,Codigo\n'
    const rows = (appts || []).map((a: any) => {
      const d = new Date(a.scheduled_at)
      return [
        format(d, 'yyyy-MM-dd'),
        format(d, 'HH:mm'),
        `"${a.client_name}"`,
        a.client_phone,
        a.client_email,
        `"${a.services?.name || ''}"`,
        `"${a.staff?.name || ''}"`,
        a.services?.duration_minutes || '',
        a.services?.price || 0,
        a.status,
        a.confirmation_code,
      ].join(',')
    }).join('\n')

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reporte-citas-${format(now, 'yyyy-MM-dd')}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 })
}
