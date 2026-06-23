import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Trash2, X, Check, Search } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { supabase, type Product } from "@/lib/db";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Products — Family Orders" }] }),
  component: ProductsPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function ProductsPage() {
  useRealtimeTable("products", ["products"]);
  const queryClient = useQueryClient();

  // حالة لحفظ نص البحث
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await supabase
        .from("products")
        .select("*")
        // التعديل الأول: ترتيب المنتجات أبجدياً حسب الاسم
        .order("name", { ascending: true });
      return (data ?? []) as Product[];
    },
  });

  // التعديل الثاني: فلترة المنتجات بناءً على البحث
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery))
    );
  }, [products, searchQuery]);

  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    
    queryClient.setQueryData(["products"], (old: Product[] = []) => old.filter(p => p.id !== id));
    await supabase.from("products").delete().eq("id", id);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title="Products" />
      <div className="mx-auto max-w-md px-4 pt-4">
        
        {/* شريط البحث */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-base text-foreground shadow-[var(--shadow-card)] outline-none focus:border-primary"
          />
        </div>

        {products.length === 0 ? (
          <div className="mt-16 text-center text-muted-foreground">
            <Package className="mx-auto h-12 w-12 opacity-50" />
            <div className="mt-3 text-base font-medium">No products yet</div>
            <div className="mt-1 text-sm">Add some products below</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-8 text-center text-muted-foreground">
            <div className="text-base font-medium">No products match your search</div>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {filteredProducts.map((p) => (
              <li
                key={p.id}
                className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] flex flex-col"
              >
                <div className="aspect-square w-full overflow-hidden bg-muted shrink-0">
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
                <div className="p-2.5 flex flex-col flex-1">
                  <div className="line-clamp-1 text-sm font-bold text-foreground">
                    {p.name}
                  </div>
                  {p.description && (
                    <div className="line-clamp-1 text-xs text-muted-foreground mt-0.5">
                      {p.description}
                    </div>
                  )}
                  <div className="mt-auto pt-2 flex gap-2">
                    <button
                      onClick={() => setEditing(p)}
                      className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-secondary text-xs font-semibold text-secondary-foreground active:scale-95"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground active:scale-95"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-md p-4">
          <button
            onClick={() => setCreating(true)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-lg font-bold text-primary-foreground shadow-[var(--shadow-soft)] active:scale-[0.98]"
          >
            <Plus className="h-6 w-6" />
            Add Product
          </button>
        </div>
      </div>

      {(editing || creating) && (
        <ProductSheet
          initial={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

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
      // إعادة ترتيب المنتجات بعد الإضافة أو التعديل
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