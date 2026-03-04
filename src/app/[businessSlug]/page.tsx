'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useBusiness } from '@/lib/context/business-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Clock, DollarSign, MapPin, Phone, Mail, Instagram, MessageCircle } from 'lucide-react'

export default function BusinessLanding() {
  const { business, theme, profile, staff, services } = useBusiness()

  const workingHours = profile.working_hours as Record<string, {
    is_open: boolean; open_time: string; close_time: string
  }> | null

  const socialLinks = profile.social_links as Record<string, string> | null

  return (
    <div className="min-h-screen">
      {/* Header / Banner */}
      <header className="relative">
        {theme.banner_url ? (
          <div className="w-full h-64 md:h-80 relative">
            <Image
              src={theme.banner_url}
              alt={business.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ) : (
          <div
            className="w-full h-64 md:h-80"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          {theme.logo_url && (
            <Image
              src={theme.logo_url}
              alt={`Logo ${business.name}`}
              width={80}
              height={80}
              className="rounded-full mb-4 bg-white p-1"
            />
          )}
          <h1 className="text-3xl md:text-5xl font-bold">{business.name}</h1>
          {profile.description && (
            <p className="mt-2 text-lg max-w-lg opacity-90">{profile.description}</p>
          )}
        </div>
      </header>

      {/* CTA */}
      <div className="flex justify-center -mt-6 relative z-10">
        <Link href={`/${business.slug}/book`}>
          <Button
            size="lg"
            className="text-lg px-8 py-6 shadow-lg"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-secondary)',
            }}
          >
            Agendar mi cita
          </Button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">
        {/* Servicios */}
        {services.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--color-primary)' }}>
              Nuestros Servicios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <Card key={svc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg">{svc.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {svc.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {Number(svc.price).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Staff */}
        {staff.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--color-primary)' }}>
              Nuestro Equipo
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {staff.map((member) => (
                <div key={member.id} className="text-center">
                  {member.photo_url ? (
                    <Image
                      src={member.photo_url}
                      alt={member.name}
                      width={120}
                      height={120}
                      className="rounded-full mx-auto mb-3 object-cover w-28 h-28"
                    />
                  ) : (
                    <div
                      className="w-28 h-28 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="font-semibold">{member.name}</h3>
                  {member.role && (
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Galería */}
        {profile.gallery_urls && profile.gallery_urls.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--color-primary)' }}>
              Galería
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.gallery_urls.map((url, i) => (
                <div key={i} className="aspect-square relative rounded-lg overflow-hidden">
                  <Image src={url} alt={`Galería ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Horario + Contacto */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Horario */}
          {workingHours && Object.keys(workingHours).length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
                Horario de Atención
              </h2>
              <div className="space-y-2">
                {Object.entries(workingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="capitalize font-medium">{day}</span>
                    <span className="text-muted-foreground">
                      {hours.is_open
                        ? `${hours.open_time} — ${hours.close_time}`
                        : 'Cerrado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacto */}
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              Contacto
            </h2>
            <div className="space-y-3 text-sm">
              {profile.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.address}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
              )}
              {socialLinks?.instagram && (
                <a href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:underline">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <span>{socialLinks.instagram}</span>
                </a>
              )}
              {socialLinks?.whatsapp && (
                <a href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:underline">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{socialLinks.whatsapp}</span>
                </a>
              )}
            </div>
          </div>
        </section>

        <Separator />

        {/* Footer CTA */}
        <div className="text-center pb-8">
          <p className="text-muted-foreground mb-4">¿Listo para tu cita?</p>
          <Link href={`/${business.slug}/book`}>
            <Button
              size="lg"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-secondary)',
              }}
            >
              Agendar mi cita
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
