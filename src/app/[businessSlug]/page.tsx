export default function BusinessLanding({
  params,
}: {
  params: { businessSlug: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Landing del Negocio</h1>
      <p className="text-muted-foreground">
        Portal público para: <strong>{params.businessSlug}</strong>
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Pantalla 1.1 — Logo, banner, servicios, staff, galería, CTA
      </p>
    </div>
  );
}
