export default function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { businessSlug: string };
}) {
  // TODO: Fetch business data by slug, load theme, provide BusinessContext
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
