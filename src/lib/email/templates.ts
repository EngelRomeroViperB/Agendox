import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AppointmentEmailData {
  businessName: string
  clientName: string
  serviceName: string
  staffName: string
  scheduledAt: string
  confirmationCode: string
  price: number
  duration: number
  businessSlug: string
  businessPhone?: string
}

export function bookingConfirmationHtml(data: AppointmentEmailData): string {
  const date = new Date(data.scheduledAt)
  const formattedDate = format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })
  const formattedTime = format(date, 'HH:mm')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#18181b;color:#fff;padding:24px 32px;text-align:center;">
        <h1 style="margin:0;font-size:20px;">${data.businessName}</h1>
        <p style="margin:4px 0 0;font-size:14px;opacity:0.8;">Confirmación de cita</p>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;">Hola <strong>${data.clientName}</strong>,</p>
        <p style="margin:0 0 24px;color:#71717a;font-size:14px;">Tu cita ha sido agendada exitosamente. Aquí están los detalles:</p>
        
        <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#71717a;font-size:13px;">Servicio</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;">${data.serviceName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#71717a;font-size:13px;">Profesional</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;">${data.staffName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#71717a;font-size:13px;">Fecha</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#71717a;font-size:13px;">Hora</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#71717a;font-size:13px;">Duración</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;">${data.duration} min</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;">
              <td style="padding:10px 0 0;font-weight:700;font-size:14px;">Total</td>
              <td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:16px;">$${Number(data.price).toLocaleString('es-CO')}</td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 4px;color:#71717a;font-size:12px;">Tu código de confirmación</p>
          <div style="background:#18181b;color:#fff;display:inline-block;padding:10px 24px;border-radius:8px;font-family:monospace;font-size:20px;letter-spacing:2px;font-weight:700;">
            ${data.confirmationCode}
          </div>
        </div>

        <p style="margin:0;color:#71717a;font-size:12px;text-align:center;">
          Guarda este código para consultar o cancelar tu cita.
        </p>
      </div>
      <div style="padding:16px 32px;background:#fafafa;border-top:1px solid #f0f0f0;text-align:center;">
        <p style="margin:0;color:#a1a1aa;font-size:11px;">
          ${data.businessName} · Powered by Agendox
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function cancellationHtml(data: AppointmentEmailData): string {
  const date = new Date(data.scheduledAt)
  const formattedDate = format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })
  const formattedTime = format(date, 'HH:mm')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#dc2626;color:#fff;padding:24px 32px;text-align:center;">
        <h1 style="margin:0;font-size:20px;">${data.businessName}</h1>
        <p style="margin:4px 0 0;font-size:14px;opacity:0.8;">Cita cancelada</p>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;">Hola <strong>${data.clientName}</strong>,</p>
        <p style="margin:0 0 24px;color:#71717a;font-size:14px;">Tu cita ha sido cancelada. Estos eran los detalles:</p>
        
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#71717a;font-size:13px;">Servicio</td>
              <td style="padding:6px 0;text-align:right;font-size:14px;text-decoration:line-through;color:#a1a1aa;">${data.serviceName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#71717a;font-size:13px;">Fecha</td>
              <td style="padding:6px 0;text-align:right;font-size:14px;text-decoration:line-through;color:#a1a1aa;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#71717a;font-size:13px;">Hora</td>
              <td style="padding:6px 0;text-align:right;font-size:14px;text-decoration:line-through;color:#a1a1aa;">${formattedTime}</td>
            </tr>
          </table>
        </div>

        <p style="margin:0;color:#71717a;font-size:13px;text-align:center;">
          Si deseas agendar una nueva cita, visita nuestro portal.
        </p>
      </div>
      <div style="padding:16px 32px;background:#fafafa;border-top:1px solid #f0f0f0;text-align:center;">
        <p style="margin:0;color:#a1a1aa;font-size:11px;">
          ${data.businessName} · Powered by Agendox
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function bookingConfirmationSubject(businessName: string): string {
  return `Cita confirmada — ${businessName}`
}

export function cancellationSubject(businessName: string): string {
  return `Cita cancelada — ${businessName}`
}
