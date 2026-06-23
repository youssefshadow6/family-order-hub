import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/lib/db";
import { Trash2, Database, Users, Package } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Family Orders" }] }),
  component: SettingsPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function SettingsPage() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [o, p, c] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("customers").select("*", { count: "exact", head: true }),
      ]);
      return { orders: o.count ?? 0, products: p.count ?? 0, customers: c.count ?? 0 };
    },
  });

  const clearOrders = async () => {
    if (!confirm("Delete ALL orders? This cannot be undone.")) return;
    await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Settings" />
      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Orders" value={stats?.orders ?? 0} Icon={Database} />
          <StatCard label="Products" value={stats?.products ?? 0} Icon={Package} />
          <StatCard label="Customers" value={stats?.customers ?? 0} Icon={Users} />
        </div>

        <div className="mt-6 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            About
          </div>
          <div className="mt-2 text-base text-foreground">
            Family Orders is a shared, real-time order tool. All devices see the
            same data instantly — no login needed.
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Danger zone
          </div>
          <button
            onClick={clearOrders}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-destructive text-sm font-bold text-destructive-foreground active:scale-[0.98]"
          >
            <Trash2 className="h-4 w-4" />
            Clear all orders
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}