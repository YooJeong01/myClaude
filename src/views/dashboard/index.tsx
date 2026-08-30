const scaffoldItems = [
  "App Router route surface",
  "FSD layers under src",
  "Server-only integration layer",
  "shadcn/ui base configuration"
];

export function DashboardView() {
  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b pb-5">
          <p className="text-sm font-medium text-muted-foreground">
            Scaffold status
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Dashboard
          </h1>
        </header>
        <section className="grid gap-3 py-6 sm:grid-cols-2">
          {scaffoldItems.map((item) => (
            <div
              className="rounded-md border bg-card p-4 text-sm text-card-foreground"
              key={item}
            >
              {item}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
