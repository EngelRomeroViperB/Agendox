export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Auth guard — verificar sesión y business_id
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* TODO: Sidebar de navegación admin */}
        <aside className="w-64 border-r min-h-screen p-4 hidden md:block">
          <h2 className="font-bold text-lg mb-6">Panel Admin</h2>
          <nav className="space-y-2 text-sm">
            <p className="text-muted-foreground">Dashboard</p>
            <p className="text-muted-foreground">Citas</p>
            <p className="text-muted-foreground">Staff</p>
            <p className="text-muted-foreground">Servicios</p>
            <p className="text-muted-foreground">Configuración</p>
            <p className="text-muted-foreground">Clientes</p>
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
