import { useQuery } from "@tanstack/react-query";

export function useRiskData() {
  return useQuery({
    queryKey: ["risk-data"],
    queryFn: async () => {
      const res = await fetch("/api/risk");

      if (!res.ok) {
        throw new Error("Failed to fetch risk data");
      }

      return res.json();
    },
  });
}
