export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Auth guard — verificar role = 'superadmin'
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="w-64 border-r min-h-screen p-4 hidden md:block">
          <h2 className="font-bold text-lg mb-6">Panel Dev</h2>
          <nav className="space-y-2 text-sm">
            <p className="text-muted-foreground">Dashboard Global</p>
            <p className="text-muted-foreground">Negocios</p>
            <p className="text-muted-foreground">Nuevo Negocio</p>
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
