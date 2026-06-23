import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function useRealtimeTable(table: string, queryKey: unknown[]) {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`rt-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          qc.invalidateQueries({ queryKey });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
}