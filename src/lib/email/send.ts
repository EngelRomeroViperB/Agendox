import { getResend, FROM_EMAIL } from './resend'
import {
  bookingConfirmationHtml,
  bookingConfirmationSubject,
  cancellationHtml,
  cancellationSubject,
} from './templates'

interface AppointmentNotificationData {
  businessName: string
  businessSlug: string
  businessPhone?: string
  clientName: string
  clientEmail: string
  serviceName: string
  staffName: string
  scheduledAt: string
  confirmationCode: string
  price: number
  duration: number
}

export async function sendBookingConfirmation(data: AppointmentNotificationData) {
  const resend = getResend()
  if (!resend) {
    console.log('[Email] Resend not configured, skipping booking confirmation email')
    return null
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.clientEmail,
      subject: bookingConfirmationSubject(data.businessName),
      html: bookingConfirmationHtml(data),
    })
    console.log('[Email] Booking confirmation sent to', data.clientEmail)
    return result
  } catch (err) {
    console.error('[Email] Failed to send booking confirmation:', err)
    return null
  }
}

export async function sendCancellationNotification(data: AppointmentNotificationData) {
  const resend = getResend()
  if (!resend) {
    console.log('[Email] Resend not configured, skipping cancellation email')
    return null
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.clientEmail,
      subject: cancellationSubject(data.businessName),
      html: cancellationHtml(data),
    })
    console.log('[Email] Cancellation email sent to', data.clientEmail)
    return result
  } catch (err) {
    console.error('[Email] Failed to send cancellation email:', err)
    return null
  }
}
