import { create } from "zustand";

/* ============================= */
/* TYPES */
/* ============================= */

export type HospitalEvent = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  zone: string;

  totalBeds: number;
  occupiedBeds: number;

  icuTotal: number;
  icuOccupied: number;

  oxygenStatus: "ok" | "low" | "critical";
};

type Store = {
  hospitals: HospitalEvent[];
  setHospitals: (hospitals: HospitalEvent[]) => void;
};

/* ============================= */
/* STORE */
/* ============================= */

export const useResilienceStore = create<Store>(
  (set: (fn: Partial<Store>) => void) => ({
    hospitals: [],
    setHospitals: (hospitals: HospitalEvent[]) => set({ hospitals }),
  }),
);
