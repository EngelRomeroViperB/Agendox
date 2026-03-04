export default function DevEditBusiness({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Editar Negocio</h1>
      <p className="text-muted-foreground">
        Pantalla 3.2 — Builder de edición para negocio ID: <strong>{params.id}</strong>
      </p>
    </div>
  );
}
