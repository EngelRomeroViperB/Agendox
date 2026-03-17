'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useBusiness } from '@/lib/context/business-context'
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
    <div style={{ backgroundColor: '#121212', color: '#E0E0E0', minHeight: '100vh' }}>

      {/* Hero */}
      <header
        className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-6 border-b border-white/5"
        style={
          theme.banner_url
            ? {
                backgroundImage: `linear-gradient(rgba(18,18,18,0.82), rgba(18,18,18,0.96)), url(${theme.banner_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { background: 'linear-gradient(135deg, #1a1a1a 0%, #121212 100%)' }
        }
      >
        {theme.logo_url && (
          <div className="mb-6 rounded-full bg-white/10 p-1 shadow-xl backdrop-blur-sm">
            <Image
              src={theme.logo_url}
              alt={`Logo ${business.name}`}
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          </div>
        )}
        <span className="text-xs uppercase tracking-[0.4em] mb-4 font-semibold" style={{ color: 'var(--color-primary)' }}>
          Experiencia Exclusiva
        </span>
        <h1
          className="text-5xl md:text-7xl mb-6 text-white leading-tight"
          style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
        >
          {business.name}
        </h1>
        {profile.description && (
          <p className="max-w-xl text-lg text-gray-400 mb-10 font-light leading-relaxed">
            {profile.description}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/${business.slug}/book`}>
            <button
              className="inline-flex items-center gap-2 font-bold py-4 px-10 rounded-sm transition-all uppercase tracking-widest text-sm hover:brightness-110"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
            >
              <CalendarCheck className="h-4 w-4" />
              Agendar mi cita
            </button>
          </Link>
          <Link href={`/${business.slug}/my-appointment`}>
            <button className="border border-white/20 text-white font-bold py-4 px-10 rounded-sm hover:bg-white/5 transition-all uppercase tracking-widest text-sm">
              Consultar cita
            </button>
          </Link>
        </div>
      </header>

      {/* Servicios */}
      {services.length > 0 && (
        <FadeIn>
          <section className="py-24 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2
                className="text-4xl mb-3 text-white"
                style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
              >
                Nuestros Servicios
              </h2>
              <div className="w-20 h-1 mx-auto mb-4" style={{ backgroundColor: 'var(--color-primary)' }} />
              <p className="text-gray-500">Elige el servicio que mejor se adapte a tu estilo</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="rounded-lg overflow-hidden border border-transparent transition-all duration-300"
                  style={{ backgroundColor: '#1E1E1E' }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'var(--color-primary)'
                    el.style.transform = 'translateY(-5px)'
                    el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'transparent'
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                  }}
                >
                  {svc.image_url && (
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={svc.image_url}
                        alt={svc.name}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-8 text-center">
                    <h3
                      className="text-2xl mb-2 text-white"
                      style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
                    >
                      {svc.name}
                    </h3>
                    <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-4">
                      <span className="text-xs text-gray-500 uppercase tracking-tighter flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {svc.duration_minutes} min
                      </span>
                      <span className="text-2xl font-semibold" style={{ color: 'var(--color-primary)' }}>
                        ${Number(svc.price).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href={`/${business.slug}/book`}>
                <button
                  className="border font-bold py-3 px-10 rounded-sm transition-all uppercase tracking-widest text-sm inline-flex items-center gap-2 hover:brightness-110"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                  Reservar ahora <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </section>
        </FadeIn>
      )}

      {/* Equipo */}
      {staff.length > 0 && (
        <FadeIn delay={100}>
          <section className="py-24" style={{ backgroundColor: '#0a0a0a' }}>
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2
                  className="text-4xl text-white mb-2"
                  style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
                >
                  Nuestro Equipo
                </h2>
                <p className="text-gray-500">Profesionales a tu servicio</p>
              </div>
              <div className="flex flex-wrap justify-center gap-12">
                {staff.map((member) => (
                  <div key={member.id} className="text-center group">
                    {member.photo_url ? (
                      <div
                        className="w-40 h-40 rounded-full mx-auto mb-4 overflow-hidden relative group-hover:scale-105 transition-transform"
                        style={{ outline: '2px solid var(--color-primary)', outlineOffset: '4px' }}
                      >
                        <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div
                        className="w-40 h-40 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white group-hover:scale-105 transition-transform"
                        style={{
                          background: 'linear-gradient(135deg, #333, #222)',
                          outline: '2px solid var(--color-primary)',
                          outlineOffset: '4px',
                        }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h4 className="text-xl text-white font-semibold">{member.name}</h4>
                    {member.role && (
                      <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--color-primary)' }}>
                        {member.role}
                      </p>
                    )}
                    {member.bio && (
                      <p className="text-xs text-gray-500 mt-2 max-w-[160px] mx-auto line-clamp-2">{member.bio}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>
      )}

      {/* Galería */}
      {profile.gallery_urls && profile.gallery_urls.length > 0 && (
        <FadeIn delay={150}>
          <section className="py-24 max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2
                className="text-4xl mb-3 text-white"
                style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
              >
                Galería
              </h2>
              <div className="w-20 h-1 mx-auto" style={{ backgroundColor: 'var(--color-primary)' }} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.gallery_urls.map((url: string, i: number) => (
                <div key={i} className="aspect-square relative rounded-xl overflow-hidden group">
                  <Image src={url} alt={`Galería ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Horario + Contacto */}
      <FadeIn delay={200}>
        <section className="py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
          {workingHours && Object.keys(workingHours).length > 0 && (
            <div className="p-10 rounded-xl" style={{ backgroundColor: '#1a1a1a' }}>
              <h3
                className="text-2xl text-white mb-8 flex items-center gap-3"
                style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
              >
                <Clock className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                Horario de Atención
              </h3>
              <div className="space-y-4">
                {Object.entries(workingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between border-b border-white/5 pb-3 last:border-0">
                    <span className="capitalize text-gray-400">{day}</span>
                    <span className={hours.is_open ? 'text-white font-semibold' : 'text-gray-600 italic'}>
                      {hours.is_open ? `${hours.open_time} — ${hours.close_time}` : 'Cerrado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col justify-center">
            <h3
              className="text-2xl text-white mb-8 flex items-center gap-3"
              style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
            >
              <MapPin className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
              Ubicación y Contacto
            </h3>
            <div className="space-y-5">
              {profile.address && (
                <>
                  <p className="flex items-start gap-4 text-gray-400">
                    <MapPin className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                    {profile.address}
                  </p>
                  <div className="rounded-lg overflow-hidden border border-white/10 mt-2">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(profile.address)}&z=17&output=embed&hl=es`}
                      width="100%"
                      height="300"
                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.95) contrast(1.1)' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicación del negocio"
                    />
                  </div>
                </>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors">
                  <Phone className="h-5 w-5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  {profile.phone}
                </a>
              )}
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors">
                  <Mail className="h-5 w-5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  {profile.email}
                </a>
              )}
              <div className="flex gap-4 pt-2">
                {socialLinks?.instagram && (
                  <a
                    href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {socialLinks?.facebook && (
                  <a
                    href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all"
                    aria-label="Facebook"
                  >
                    <Star className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* CTA Final */}
      <FadeIn delay={250}>
        <section className="mx-6 mb-24 rounded-2xl overflow-hidden">
          <div className="p-12 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
            <h2
              className="text-4xl mb-4 font-bold"
              style={{
                color: 'var(--color-secondary)',
                fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif',
              }}
            >
              ¿Listo para renovar tu estilo?
            </h2>
            <p className="mb-8 font-medium" style={{ color: 'var(--color-secondary)', opacity: 0.85 }}>
              Reserva en menos de 2 minutos y asegura tu espacio con los mejores.
            </p>
            <Link href={`/${business.slug}/book`}>
              <button
                className="px-12 py-4 rounded-sm uppercase tracking-widest text-sm font-bold hover:scale-105 transition-all"
                style={{ backgroundColor: '#121212', color: '#E0E0E0' }}
              >
                Reservar Ahora
              </button>
            </Link>
          </div>
        </section>
      </FadeIn>

      {/* Footer */}
      <footer className="py-10 text-center text-xs border-t border-white/5" style={{ color: '#555' }}>
        <p>Agenda impulsada por <span className="font-semibold">Agendox</span></p>
      </footer>

      {/* WhatsApp */}
      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle className="h-7 w-7 text-white" />
        </a>
      )}
    </div>
  )
}
