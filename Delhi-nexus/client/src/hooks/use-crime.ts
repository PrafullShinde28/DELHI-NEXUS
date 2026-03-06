import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertCrime } from "@shared/schema";
import { api } from "@shared/routes";

export function useCrimeData() {
  return useQuery({
    queryKey: [api.crime.list.path],
    queryFn: async () => {
      const res = await fetch(api.crime.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch crime data");
      return api.crime.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCrime) => {
      const validated = api.crime.create.input.parse(data);
      const res = await fetch(api.crime.create.path, {
        method: api.crime.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to log crime incident");
      }
      return api.crime.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.crime.list.path] });
    },
  });
}
