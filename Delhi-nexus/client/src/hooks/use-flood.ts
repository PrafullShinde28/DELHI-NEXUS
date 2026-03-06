import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Utility to coerce string numbers from Drizzle numeric types
export const parseFloodData = (data: any[]) => data.map(item => ({
  ...item,
  latitude: Number(item.latitude),
  longitude: Number(item.longitude),
  rainfallIntensity: Number(item.rainfallIntensity),
  waterLevel: Number(item.waterLevel),
  drainageCapacity: Number(item.drainageCapacity),
  soilSaturation: Number(item.soilSaturation),
  floodProbability: Number(item.floodProbability),
}));

export function useCurrentFloodData() {
  return useQuery({
    queryKey: [api.flood.current.path],
    queryFn: async () => {
      const res = await fetch(api.flood.current.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch current flood data");
      const data = await res.json();
      return parseFloodData(data);
    },
  });
}

export function useFloodHistory() {
  return useQuery({
    queryKey: [api.flood.history.path],
    queryFn: async () => {
      const res = await fetch(api.flood.history.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch flood history");
      const data = await res.json();
      return parseFloodData(data);
    },
  });
}

export function useTriggerMockFlood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.flood.mock.path, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to trigger mock flood");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.flood.current.path] });
      queryClient.invalidateQueries({ queryKey: [api.flood.history.path] });
    }
  });
}
