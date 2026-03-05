'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  folder: string // e.g. "logos", "banners", "staff-photos", "gallery", "service-images"
  businessId?: string
  className?: string
  aspectRatio?: 'square' | 'banner' | 'auto'
  placeholder?: string
}

export function ImageUpload({
  value,
  onChange,
  folder,
  businessId,
  className = '',
  aspectRatio = 'auto',
  placeholder = 'Arrastra una imagen o haz click para seleccionar',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const aspectClasses = {
    square: 'aspect-square',
    banner: 'aspect-[3/1]',
    auto: 'min-h-[120px]',
  }

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB')
      return
    }

    setUploading(true)

    const ext = file.name.split('.').pop()
    const prefix = businessId ? `${businessId}/` : ''
    const path = `${prefix}${folder}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('agendox')
      .upload(path, file, { upsert: true })

    if (error) {
      toast.error('Error al subir imagen', { description: error.message })
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('agendox')
      .getPublicUrl(path)

    onChange(urlData.publicUrl)
    setUploading(false)
    toast.success('Imagen subida')
  }, [supabase, folder, businessId, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = async () => {
    if (value) {
      // Extract path from URL
      const url = new URL(value)
      const pathParts = url.pathname.split('/storage/v1/object/public/agendox/')
      if (pathParts[1]) {
        await supabase.storage.from('agendox').remove([pathParts[1]])
      }
    }
    onChange(null)
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className={`relative rounded-lg overflow-hidden border ${aspectClasses[aspectRatio]}`}>
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors ${aspectClasses[aspectRatio]} ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Subiendo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
              {dragOver ? (
                <Upload className="h-8 w-8" />
              ) : (
                <ImageIcon className="h-8 w-8" />
              )}
              <span className="text-sm text-center">{placeholder}</span>
              <span className="text-xs">PNG, JPG o WebP — máx. 5MB</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Multi-image upload for galleries
interface MultiImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  folder: string
  businessId?: string
  maxImages?: number
}

export function MultiImageUpload({
  value,
  onChange,
  folder,
  businessId,
  maxImages = 10,
}: MultiImageUploadProps) {
  const addImage = (url: string | null) => {
    if (url && value.length < maxImages) {
      onChange([...value, url])
    }
  }

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {value.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
            <Image src={url} alt={`Imagen ${i + 1}`} fill className="object-cover" />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => removeImage(i)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {value.length < maxImages && (
          <ImageUpload
            value={null}
            onChange={addImage}
            folder={folder}
            businessId={businessId}
            aspectRatio="square"
            placeholder="Agregar imagen"
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">{value.length} / {maxImages} imágenes</p>
    </div>
  )
}
