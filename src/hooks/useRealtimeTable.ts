import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/db";

export function useRealtimeTable(table: string, queryKey: string[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-updates-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: table },
        () => {
          // أول ما يحصل أي تغيير (إضافة، تعديل، أو حذف) هنحدث الشاشة فوراً
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    // الميزة دي بتخلي التليفون يعمل مزامنة لوحده أول ما تفتح التطبيق تاني
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey });
      }
    };
    
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", () => queryClient.invalidateQueries({ queryKey }));

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", () => queryClient.invalidateQueries({ queryKey }));
    };
  }, [queryClient, table, queryKey]);
}
