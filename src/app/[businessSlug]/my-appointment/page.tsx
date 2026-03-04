export default function MyAppointment({
  params,
}: {
  params: { businessSlug: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Consultar / Cancelar Cita</h1>
      <p className="text-muted-foreground">
        Consulta de cita para: <strong>{params.businessSlug}</strong>
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Pantalla 1.4 — Ingreso de código de reserva, detalles, cancelación
      </p>
    </div>
  );
}
