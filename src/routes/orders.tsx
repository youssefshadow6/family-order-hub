import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, ClipboardList, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp, Check, Package, ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { supabase, type Order, type Product } from "@/lib/db";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders - Family Orders" }] }),
  component: OrdersPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function OrdersPage() {
  useRealtimeTable("orders", ["orders"]);
  const queryClient = useQueryClient();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await supabase.from("products").select("*");
      return (data ?? []) as Product[];
    },
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/orders") {
    return <Outlet />;
  }

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm("Delete this order?")) return;
    
    queryClient.setQueryData(["orders"], (old: Order[] = []) => old.filter(o => o.id !== id));
    await supabase.from("orders").delete().eq("id", id);
  };

  // التعديل هنا: ضفنا async و await عشان يكلم السيرفر إجباري
  const toggleItemCompletion = async (order: Order, itemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newItems = [...order.items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      completed: !newItems[itemIndex].completed,
    };

    const isAllCompleted = newItems.every((item) => item.completed);
    const newStatus = isAllCompleted ? "completed" : "active";

    // تحديث الشاشة فوراً
    queryClient.setQueryData(["orders"], (old: Order[] = []) =>
      old.map(o => o.id === order.id ? { ...o, items: newItems, status: newStatus } : o)
    );

    if (isAllCompleted) {
      setExpandedId(null);
    }

    // إرسال البيانات لقاعدة البيانات (await حلت المشكلة)
    await supabase.from("orders").update({ items: newItems, status: newStatus }).eq("id", order.id);
  };

  // التعديل هنا كمان: ضفنا async و await
  const toggleOrderStatus = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = order.status === "completed" ? "active" : "completed";

    const newItems = order.items.map(item => ({
      ...item,
      completed: newStatus === "completed"
    }));

    queryClient.setQueryData(["orders"], (old: Order[] = []) =>
      old.map(o => o.id === order.id ? { ...o, status: newStatus, items: newItems } : o)
    );
    
    if (newStatus === "completed") {
      setExpandedId(null);
    }

    // إرسال البيانات لقاعدة البيانات (await حلت المشكلة)
    await supabase.from("orders").update({ status: newStatus, items: newItems }).eq("id", order.id);
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title="Orders" />
      <div className="mx-auto max-w-md px-4 pt-4">
        {isLoadingOrders ? (
          <div className="py-20 text-center text-muted-foreground">Loading...</div>
        ) : sortedOrders.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedOrders.map((o) => {
              const isExpanded = expandedId === o.id;
              const isCompleted = o.status === "completed";

              return (
                <li
                  key={o.id}
                  onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  className={`cursor-pointer overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] transition-all duration-300 ${
                    isCompleted ? "opacity-60 grayscale" : ""
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className={`text-lg font-bold ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {o.customer_name}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(o.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => remove(o.id, e)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground active:bg-muted hover:text-destructive transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                    </div>

                    {!isExpanded && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {o.items.map((it, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                              it.completed
                                ? "bg-primary/20 text-primary line-through"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {it.product_name}
                            <span className={`font-bold ${it.completed ? "" : "text-primary"}`}> x{it.quantity}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 p-4">
                      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Order Items Details
                      </div>
                      <ul className="flex flex-col gap-3">
                        {o.items.map((it, i) => {
                          const productDetails = products.find(p => p.id === it.product_id);
                          
                          return (
                            <li
                              key={i}
                              onClick={(e) => toggleItemCompletion(o, i, e)}
                              className={`relative flex overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-colors active:scale-[0.98] ${
                                it.completed ? "opacity-60" : ""
                              }`}
                            >
                              <div 
                                className="aspect-square w-24 shrink-0 bg-muted border-r border-border cursor-pointer relative"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (productDetails?.image_url) {
                                    setFullscreenImage(productDetails.image_url);
                                  }
                                }}
                              >
                                {productDetails?.image_url ? (
                                  <img 
                                    src={productDetails.image_url} 
                                    alt={it.product_name} 
                                    className="h-full w-full object-cover transition-opacity hover:opacity-80" 
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <Package className="h-8 w-8" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-1 flex-col p-3 justify-center">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {it.completed ? (
                                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                                    ) : (
                                      <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                                    )}
                                    <span className={`text-base font-bold line-clamp-2 ${it.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                      {it.product_name}
                                    </span>
                                  </div>
                                  <span className="rounded-full bg-secondary px-3 py-1 font-bold text-primary shrink-0">
                                    x{it.quantity}
                                  </span>
                                </div>
                                {productDetails?.description && (
                                  <div className="mt-1.5 text-xs text-muted-foreground line-clamp-2 pl-7">
                                    {productDetails.description}
                                  </div>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="mt-5">
                        <button
                          onClick={(e) => toggleOrderStatus(o, e)}
                          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white shadow-sm transition-all active:scale-[0.98] ${
                            isCompleted
                              ? "bg-slate-500 hover:bg-slate-600"
                              : "bg-primary hover:bg-primary/90"
                          }`}
                        >
                          {isCompleted ? (
                            <>Undo Completion</>
                          ) : (
                            <>
                              <Check className="h-5 w-5" /> Mark Order as Completed
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-md p-4">
          <Link
            to="/orders/new"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-lg font-bold text-primary-foreground shadow-[var(--shadow-soft)] active:scale-[0.98]"
          >
            <Plus className="h-6 w-6" />
            Add Order
          </Link>
        </div>
      </div>

      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm transition-all duration-300">
          <div className="flex items-center p-4 pt-6">
            <button
              onClick={() => setFullscreenImage(null)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <span className="ml-4 text-xl font-bold text-white">رجوع</span>
          </div>
          
          <div className="flex flex-1 items-center justify-center p-4 pb-12">
            <img
              src={fullscreenImage}
              alt="Fullscreen product"
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center text-center text-muted-foreground">
      <ClipboardList className="h-12 w-12 opacity-50" />
      <div className="mt-3 text-base font-medium">No orders yet</div>
      <div className="mt-1 text-sm">Tap "Add Order" to create one</div>
    </div>
  );
}

function formatDate(s: string) {
  const d = new Date(s);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
