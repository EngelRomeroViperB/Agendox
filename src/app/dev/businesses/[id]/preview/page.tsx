'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ExternalLink, Monitor, Smartphone, Tablet } from 'lucide-react'

export default function DevPreviewBusiness({
  params,
}: {
  params: { id: string }
}) {
  const [slug, setSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    fetch(`/api/businesses/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setSlug(data?.slug || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const viewportWidths = { desktop: '100%', tablet: '768px', mobile: '375px' }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Cargando...</p></div>
  }

  if (!slug) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Negocio no encontrado</p>
        <Link href="/dev/businesses"><Button variant="outline" className="mt-4">Volver</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dev/businesses/${params.id}/edit`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Vista Previa</h1>
            <p className="text-sm text-muted-foreground">/{slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg p-0.5">
            <Button
              variant={viewport === 'desktop' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewport('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === 'tablet' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewport('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === 'mobile' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewport('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          <Link href={`/${slug}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Abrir
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0 flex justify-center bg-muted/30 min-h-[600px]">
          <iframe
            src={`/${slug}`}
            className="border-0 bg-white transition-all duration-300"
            style={{
              width: viewportWidths[viewport],
              maxWidth: '100%',
              height: '80vh',
            }}
            title="Portal Preview"
          />
        </CardContent>
      </Card>
    </div>
  )
}
