import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  order_count: number;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  order_count: number;
  created_at: string;
};

export type OrderItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  completed?: boolean; // ضفنا السطر ده عشان نعرف المنتج ده جهز ولا لسه
};

export type Order = {
  id: string;
  customer_name: string;
  items: OrderItem[];
  status: string;
  created_at: string;
};

export { supabase };