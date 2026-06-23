
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  order_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "public update products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete products" ON public.products FOR DELETE USING (true);

CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  order_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "public insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "public update customers" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete customers" ON public.customers FOR DELETE USING (true);

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "public update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete orders" ON public.orders FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.customers REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

CREATE INDEX idx_products_order_count ON public.products(order_count DESC, name ASC);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_customers_name ON public.customers(name);
