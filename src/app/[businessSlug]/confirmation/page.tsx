export default function Confirmation({
  params,
}: {
  params: { businessSlug: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Cita Confirmada</h1>
      <p className="text-muted-foreground">
        Confirmación de reserva para: <strong>{params.businessSlug}</strong>
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Pantalla 1.3 — Mensaje de éxito, resumen, código de reserva
      </p>
    </div>
  );
}
