import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Package, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Family Orders" },
      { name: "description", content: "Shared order management for our family business." },
    ],
  }),
  component: Home,
});

const cards = [
  { to: "/orders", label: "Orders", desc: "View & add orders", Icon: ClipboardList, accent: "from-primary to-primary-glow" },
  { to: "/products", label: "Products", desc: "Manage product library", Icon: Package, accent: "from-accent to-primary-glow" },
  { to: "/settings", label: "Settings", desc: "App preferences", Icon: SettingsIcon, accent: "from-secondary to-accent" },
] as const;

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 pt-12 pb-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Family Orders</h1>
          <p className="mt-2 text-sm text-muted-foreground">Shared & live across all devices</p>
        </div>
        <div className="flex flex-col gap-4">
          {cards.map(({ to, label, desc, Icon, accent }) => (
            <Link
              key={to}
              to={to}
              className="group relative overflow-hidden rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] transition-all active:scale-[0.98] hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-5">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-primary-foreground shadow-[var(--shadow-soft)]`}>
                  <Icon className="h-8 w-8" strokeWidth={2.25} />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-foreground">{label}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
