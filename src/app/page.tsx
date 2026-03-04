import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl font-bold mb-4">Agendox</h1>
      <p className="text-muted-foreground text-lg mb-8 text-center max-w-md">
        Plataforma SaaS de agendamiento de citas multi-tenant
      </p>
      <div className="flex gap-4">
        <Link href="/admin/login">
          <Button variant="default">Panel Admin</Button>
        </Link>
        <Link href="/dev">
          <Button variant="outline">Panel Dev</Button>
        </Link>
      </div>
    </div>
  );
}
