export default function BookAppointment({
  params,
}: {
  params: { businessSlug: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Agendar Cita</h1>
      <p className="text-muted-foreground">
        Flujo de agendamiento para: <strong>{params.businessSlug}</strong>
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Pantalla 1.2 — Selección de servicio → profesional → fecha/hora → datos del cliente
      </p>
    </div>
  );
}
