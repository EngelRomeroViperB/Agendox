export default function DevPreviewBusiness({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Vista Previa del Portal</h1>
      <p className="text-muted-foreground">
        Pantalla 3.3 — Preview completo del portal para negocio ID: <strong>{params.id}</strong>
      </p>
    </div>
  );
}
