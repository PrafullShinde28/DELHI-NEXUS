import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertHospital } from "@shared/schema";

export function useHospitalData() {
  return useQuery({
    queryKey: [api.hospital.list.path],
    queryFn: async () => {
      const res = await fetch(api.hospital.list.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch hospital data");
      return api.hospital.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateHospital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: number } & Partial<InsertHospital>) => {
      const validated = api.hospital.update.input.parse(updates);
      const url = buildUrl(api.hospital.update.path, { id });

      const res = await fetch(url, {
        method: api.hospital.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update hospital");
      }
      return api.hospital.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.hospital.list.path] });
    },
  });
}
