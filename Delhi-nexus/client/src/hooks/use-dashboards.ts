import { useQuery } from "@tanstack/react-query";

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000 // refresh every 30 sec
  });
}