import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

let resend: Resend | null = null

export function getResend(): Resend | null {
  if (!resendApiKey) return null
  if (!resend) resend = new Resend(resendApiKey)
  return resend
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Agendox <noreply@agendox.app>'
