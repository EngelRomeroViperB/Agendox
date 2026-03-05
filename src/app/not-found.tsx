import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        La página que buscas no existe
      </p>
      <Link href="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  )
}
