import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useRiskData() {
  return useQuery({
    queryKey: [api.risk.list.path],
    queryFn: async () => {
      const res = await fetch(api.risk.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch risk data");
      return api.risk.list.responses[200].parse(await res.json());
    },
  });
}
