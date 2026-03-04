'use client'

import { useEffect, useState } from 'react'
import { BusinessBuilder } from '@/components/dev/business-builder'

export default function DevEditBusiness({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/businesses/${params.id}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Cargando negocio...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive">No se encontró el negocio</p>
      </div>
    )
  }

  return <BusinessBuilder mode="edit" initialData={data} />
}
