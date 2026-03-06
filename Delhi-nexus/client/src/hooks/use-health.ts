import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Utility to coerce string numbers from Drizzle numeric types
export const parseHealthData = (data: any[]) => data.map(item => ({
  ...item,
  trafficScore: Number(item.trafficScore),
  aqiScore: Number(item.aqiScore),
  crimeScore: Number(item.crimeScore),
  floodScore: Number(item.floodScore),
  hospitalScore: Number(item.hospitalScore),
  compositeScore: Number(item.compositeScore),
}));

export function useCurrentCityHealth() {
  return useQuery({
    queryKey: [api.cityHealth.current.path],
    queryFn: async () => {
      const res = await fetch(api.cityHealth.current.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch current city health");
      const data = await res.json();
      return parseHealthData(data);
    },
  });
}

export function useCityHealthHistory() {
  return useQuery({
    queryKey: [api.cityHealth.history.path],
    queryFn: async () => {
      const res = await fetch(api.cityHealth.history.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch city health history");
      const data = await res.json();
      return parseHealthData(data);
    },
  });
}

export function useRecalculateHealth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.cityHealth.recalculate.path, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to recalculate health");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cityHealth.current.path] });
      queryClient.invalidateQueries({ queryKey: [api.cityHealth.history.path] });
    }
  });
}
