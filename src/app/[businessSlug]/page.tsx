'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useBusiness } from '@/lib/context/business-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Clock, MapPin, Phone, Mail, Instagram, MessageCircle, CalendarCheck, Star, ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/ui/fade-in'

export default function BusinessLanding() {
  const { business, theme, profile, staff, services } = useBusiness()

  const workingHours = profile.working_hours as Record<string, {
    is_open: boolean; open_time: string; close_time: string
  }> | null

  const socialLinks = profile.social_links as Record<string, string> | null
  const whatsappNumber = socialLinks?.whatsapp?.replace(/\D/g, '')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / Banner */}
      <header className="relative overflow-hidden">
        {theme.banner_url ? (
          <div className="w-full h-72 md:h-96 relative">
            <Image
              src={theme.banner_url}
              alt={business.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ) : (
          <div
            className="w-full h-72 md:h-96 relative"
            style={{ background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 60%, color-mix(in srgb, var(--color-primary), black 30%) 100%)` }}
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          {theme.logo_url && (
            <div className="mb-4 rounded-full bg-white/90 p-1.5 shadow-xl">
              <Image
                src={theme.logo_url}
                alt={`Logo ${business.name}`}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg">{business.name}</h1>
          {profile.description && (
            <p className="mt-3 text-base md:text-lg max-w-lg opacity-90 drop-shadow">{profile.description}</p>
          )}
          <div className="flex gap-3 mt-6">
            <Link href={`/${business.slug}/book`}>
              <Button
                size="lg"
                className="text-base px-6 py-5 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-secondary)',
                }}
              >
                <CalendarCheck className="h-5 w-5 mr-2" />
                Agendar mi cita
              </Button>
            </Link>
            <Link href={`/${business.slug}/my-appointment`}>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-6 py-5 bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20"
              >
                Consultar cita
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">
        {/* Servicios */}
        {services.length > 0 && (
          <FadeIn><section>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                Nuestros Servicios
              </h2>
              <p className="text-muted-foreground mt-1">Elige el servicio que necesitas</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <Card key={svc.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden border-0 shadow-sm">
                  {svc.image_url && (
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={svc.image_url}
                        alt={svc.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg">{svc.name}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {svc.duration_minutes} min
                        </span>
                      </div>
                      <span className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
                        ${Number(svc.price).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href={`/${business.slug}/book`}>
                <Button
                  variant="outline"
                  className="group"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                  Reservar ahora <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </section></FadeIn>
        )}

        {/* Staff */}
        {staff.length > 0 && (
          <FadeIn delay={100}><section>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                Nuestro Equipo
              </h2>
              <p className="text-muted-foreground mt-1">Profesionales a tu servicio</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {staff.map((member) => (
                <Card key={member.id} className="text-center border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <CardContent className="p-5">
                    {member.photo_url ? (
                      <Image
                        src={member.photo_url}
                        alt={member.name}
                        width={96}
                        height={96}
                        className="rounded-full mx-auto mb-3 object-cover w-24 h-24 ring-2 ring-offset-2"
                        style={{ ringColor: 'var(--color-primary)' } as React.CSSProperties}
                      />
                    ) : (
                      <div
                        className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3 className="font-semibold">{member.name}</h3>
                    {member.role && (
                      <p className="text-xs text-muted-foreground mt-0.5">{member.role}</p>
                    )}
                    {member.bio && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{member.bio}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section></FadeIn>
        )}

        {/* Galería */}
        {profile.gallery_urls && profile.gallery_urls.length > 0 && (
          <FadeIn delay={150}><section>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                Galería
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.gallery_urls.map((url: string, i: number) => (
                <div key={i} className="aspect-square relative rounded-xl overflow-hidden group">
                  <Image src={url} alt={`Galería ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </section></FadeIn>
        )}

        {/* Horario + Contacto */}
        <FadeIn delay={200}><section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {workingHours && Object.keys(workingHours).length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                  <Clock className="h-5 w-5" />
                  Horario de Atención
                </h2>
                <div className="space-y-2.5">
                  {Object.entries(workingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm py-1 border-b border-dashed last:border-0">
                      <span className="capitalize font-medium">{day}</span>
                      <span className={hours.is_open ? 'text-foreground' : 'text-muted-foreground'}>
                        {hours.is_open
                          ? `${hours.open_time} — ${hours.close_time}`
                          : 'Cerrado'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                <MapPin className="h-5 w-5" />
                Contacto
              </h2>
              <div className="space-y-3 text-sm">
                {profile.address && (
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <span>{profile.address}</span>
                  </div>
                )}
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <Phone className="h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <span>{profile.phone}</span>
                  </a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <Mail className="h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <span>{profile.email}</span>
                  </a>
                )}
                <Separator />
                <div className="flex gap-3">
                  {socialLinks?.instagram && (
                    <a href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex-1">
                      <Instagram className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                      <span className="text-xs truncate">{socialLinks.instagram}</span>
                    </a>
                  )}
                  {socialLinks?.facebook && (
                    <a href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex-1">
                      <Star className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                      <span className="text-xs truncate">Facebook</span>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section></FadeIn>

        {/* Footer CTA */}
        <FadeIn delay={250}><div className="text-center pb-8">
          <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
            <h3 className="text-2xl font-bold mb-2">¿Listo para tu cita?</h3>
            <p className="opacity-80 mb-5">Reserva en menos de 2 minutos</p>
            <Link href={`/${business.slug}/book`}>
              <Button
                size="lg"
                className="text-base px-8 py-5 bg-white hover:bg-white/90"
                style={{ color: 'var(--color-primary)' }}
              >
                <CalendarCheck className="h-5 w-5 mr-2" />
                Agendar ahora
              </Button>
            </Link>
          </div>
        </div></FadeIn>

        {/* Powered by */}
        <div className="text-center pb-4">
          <p className="text-xs text-muted-foreground">
            Agenda impulsada por <span className="font-semibold">Agendox</span>
          </p>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle className="h-7 w-7 text-white" />
        </a>
      )}
    </div>
  )
}
