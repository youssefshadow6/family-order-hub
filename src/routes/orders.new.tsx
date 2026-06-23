import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Minus, Plus, Search, X, Package } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { NumPad } from "@/components/NumPad";
import { supabase, type Customer, type Product, type OrderItem } from "@/lib/db";

export const Route = createFileRoute("/orders/new")({
  head: () => ({ meta: [{ title: "New Order — Family Orders" }] }),
  component: NewOrderPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

type Step = "customer" | "products" | "review";

function NewOrderPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("customer");
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [padForProduct, setPadForProduct] = useState<Product | null>(null);
  
  // حالة جديدة عشان نتحكم في فتح وقفل شاشة إضافة منتج جديد
  const [creatingProduct, setCreatingProduct] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async (): Promise<Customer[]> => {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .order("order_count", { ascending: false })
        .order("name");
      return (data ?? []) as Customer[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });
      return (data ?? []) as Product[];
    },
  });

  const addItem = (p: Product, qty: number) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: qty };
        return next;
      }
      return [...prev, { product_id: p.id, product_name: p.name, quantity: qty }];
    });
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.product_id !== id));

  const save = () => {
    const name = customer.trim();
    if (!name || items.length === 0) return;

    nav({ to: "/orders" });

    (async () => {
      await supabase.from("orders").insert({ customer_name: name, items });

      const existing = customers.find(
        (c) => c.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) {
        await supabase
          .from("customers")
          .update({ order_count: existing.order_count + 1 })
          .eq("id", existing.id);
      } else {
        await supabase.from("customers").insert({ name, order_count: 1 });
      }

      await Promise.all(
        items.map(async (it) => {
          const p = products.find((pp) => pp.id === it.product_id);
          if (!p) return;
          await supabase
            .from("products")
            .update({ order_count: p.order_count + 1 })
            .eq("id", it.product_id);
        }),
      );
    })();
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader
        title={
          step === "customer"
            ? "Customer"
            : step === "products"
              ? "Products"
              : "Review"
        }
        back="/orders"
      />
      <div className="mx-auto max-w-md px-4 pt-4">
        {step === "customer" && (
          <CustomerStep
            value={customer}
            onChange={setCustomer}
            customers={customers}
          />
        )}
        {step === "products" && (
          <ProductsStep
            products={products}
            items={items}
            onPick={(p) => setPadForProduct(p)}
            onRemove={removeItem}
            onAddNew={() => setCreatingProduct(true)}
          />
        )}
        {step === "review" && (
          <ReviewStep customer={customer} items={items} />
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-md p-4">
          {step === "customer" && (
            <button
              disabled={!customer.trim()}
              onClick={() => setStep("products")}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-lg font-bold text-primary-foreground shadow-[var(--shadow-soft)] active:scale-[0.98] disabled:opacity-40"
            >
              Next <ArrowRight className="h-5 w-5" />
            </button>
          )}
          {step === "products" && (
            <div className="flex gap-2">
              <button
                onClick={() => setStep("customer")}
                className="h-14 flex-1 rounded-2xl bg-muted font-semibold text-foreground active:scale-[0.98]"
              >
                Back
              </button>
              <button
                disabled={items.length === 0}
                onClick={() => setStep("review")}
                className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-lg font-bold text-primary-foreground shadow-[var(--shadow-soft)] active:scale-[0.98] disabled:opacity-40"
              >
                Review ({items.length})
              </button>
            </div>
          )}
          {step === "review" && (
            <div className="flex gap-2">
              <button
                onClick={() => setStep("products")}
                className="h-14 flex-1 rounded-2xl bg-muted font-semibold text-foreground active:scale-[0.98]"
              >
                Back
              </button>
              <button
                onClick={save}
                className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-lg font-bold text-primary-foreground shadow-[var(--shadow-soft)] active:scale-[0.98]"
              >
                <Check className="h-5 w-5" />
                Save Order
              </button>
            </div>
          )}
        </div>
      </div>

      {padForProduct && (
        <NumPad
          title={padForProduct.name}
          subtitle="How many?"
          initial={String(
            items.find((i) => i.product_id === padForProduct.id)?.quantity ?? "",
          )}
          onCancel={() => setPadForProduct(null)}
          onConfirm={(n) => {
            addItem(padForProduct, n);
            setPadForProduct(null);
          }}
        />
      )}

      {/* شاشة إضافة منتج جديد لحظية زي الموجودة في صفحة المنتجات */}
      {creatingProduct && (
        <ProductSheet
          initial={null}
          onClose={() => setCreatingProduct(false)}
        />
      )}
    </div>
  );
}

function CustomerStep({
  value,
  onChange,
  customers,
}: {
  value: string;
  onChange: (s: string) => void;
  customers: Customer[];
}) {
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [value, customers]);

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">
        Customer name
      </label>
      <div className="relative mt-2">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a name…"
          className="h-14 w-full rounded-2xl border border-input bg-card pl-11 pr-4 text-lg text-foreground shadow-[var(--shadow-card)] outline-none focus:border-primary"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suggestions
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((c) => (
              <button
                key={c.id}
                onClick={() => onChange(c.name)}
                className="rounded-full bg-card px-4 py-2.5 text-base font-medium text-foreground shadow-[var(--shadow-card)] active:scale-95"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsStep({
  products,
  items,
  onPick,
  onRemove,
  onAddNew,
}: {
  products: Product[];
  items: OrderItem[];
  onPick: (p: Product) => void;
  onRemove: (id: string) => void;
  onAddNew: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery))
    );
  }, [products, searchQuery]);

  const qtyFor = (id: string) =>
    items.find((i) => i.product_id === id)?.quantity ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-base text-foreground shadow-[var(--shadow-card)] outline-none focus:border-primary"
        />
      </div>

      {filteredProducts.length === 0 && products.length > 0 ? (
        <div className="mt-8 text-center text-muted-foreground">
          <div className="text-base font-medium">No products match your search</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* كارت جديد دايماً موجود في أول القائمة لإضافة منتج جديد بسرعة */}
          <button
            onClick={onAddNew}
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground transition active:scale-[0.97] hover:border-primary hover:text-primary min-h-[180px]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/10 mb-3">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold">Add New Product</span>
          </button>

          {filteredProducts.map((p) => {
            const qty = qtyFor(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onPick(p)}
                className={`relative flex flex-col overflow-hidden rounded-2xl bg-card text-left shadow-[var(--shadow-card)] transition active:scale-[0.97] ${
                  qty > 0 ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="aspect-square w-full overflow-hidden bg-muted">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Package className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="line-clamp-1 text-sm font-bold text-foreground">
                    {p.name}
                  </div>
                  {p.description && (
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {p.description}
                    </div>
                  )}
                </div>
                {qty > 0 && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow">
                    × {qty}
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(p.id);
                      }}
                      className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  customer,
  items,
}: {
  customer: string;
  items: OrderItem[];
}) {
  return (
    <div>
      <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Customer
        </div>
        <div className="mt-1 text-2xl font-bold text-foreground">{customer}</div>
      </div>
      <div className="mt-4 rounded-2xl bg-card p-2 shadow-[var(--shadow-card)]">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-border/60 px-3 py-3 last:border-0"
          >
            <div className="text-base font-medium text-foreground">
              {it.product_name}
            </div>
            <div className="rounded-full bg-secondary px-3 py-1 text-base font-bold text-primary">
              × {it.quantity}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// مكون إضافة المنتج اللي جبناه من صفحة المنتجات
function ProductSheet({
  initial,
  onClose,
}: {
  initial: Product | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");

  const save = () => {
    if (!name.trim()) return;
    
    const fakeId = initial?.id || Math.random().toString();
    const optimisticProduct = {
      id: fakeId,
      name: name.trim(),
      description,
      image_url: imageUrl,
      order_count: initial?.order_count || 0,
      created_at: initial?.created_at || new Date().toISOString(),
    };

    queryClient.setQueryData(["products"], (old: Product[] = []) => {
      let newData = [];
      if (initial) {
        newData = old.map(p => p.id === initial.id ? optimisticProduct : p);
      } else {
        newData = [optimisticProduct, ...old];
      }
      return newData.sort((a, b) => a.name.localeCompare(b.name));
    });

    onClose();

    (async () => {
      if (initial) {
        await supabase
          .from("products")
          .update({ name: name.trim(), description, image_url: imageUrl })
          .eq("id", initial.id);
      } else {
        await supabase
          .from("products")
          .insert({ name: name.trim(), description, image_url: imageUrl });
      }
    })();
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl bg-background p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {initial ? "Edit Product" : "New Product"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex aspect-square w-32 cursor-pointer items-center justify-center self-center overflow-hidden rounded-2xl bg-muted">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground">
                <Package className="mx-auto h-8 w-8" />
                <div className="mt-1 text-xs">Add photo</div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>

          <input
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary"
          />
          <input
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-12 rounded-xl border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary"
          />

          <button
            disabled={!name.trim()}
            onClick={save}
            className="mt-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-lg font-bold text-primary-foreground shadow-[var(--shadow-soft)] active:scale-[0.98] disabled:opacity-40"
          >
            <Check className="h-5 w-5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

void Minus;
void Plus;  
