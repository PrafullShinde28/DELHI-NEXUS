import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboardOverview() {
  return useQuery({
    queryKey: [api.dashboard.overview.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.overview.path);
      if (!res.ok) throw new Error("Failed to fetch dashboard overview");
      return api.dashboard.overview.responses[200].parse(await res.json());
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}

export function useTrafficHistory() {
  return useQuery({
    queryKey: [api.traffic.history.path],
    queryFn: async () => {
      const res = await fetch(api.traffic.history.path);
      if (!res.ok) throw new Error("Failed to fetch traffic history");
      return api.traffic.history.responses[200].parse(await res.json());
    },
  });
}

export function usePollutionHistory() {
  return useQuery({
    queryKey: [api.pollution.history.path],
    queryFn: async () => {
      const res = await fetch(api.pollution.history.path);
      if (!res.ok) throw new Error("Failed to fetch pollution history");
      return api.pollution.history.responses[200].parse(await res.json());
    },
  });
}

export function usePredictions(type?: 'traffic' | 'pollution') {
  return useQuery({
    queryKey: [api.predictions.list.path, type],
    queryFn: async () => {
      const url = new URL(api.predictions.list.path, window.location.origin);
      if (type) url.searchParams.append("type", type);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch predictions");
      return api.predictions.list.responses[200].parse(await res.json());
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: [api.alerts.list.path],
    queryFn: async () => {
      const res = await fetch(api.alerts.list.path);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return api.alerts.list.responses[200].parse(await res.json());
    },
    refetchInterval: 15000,
  });
}
