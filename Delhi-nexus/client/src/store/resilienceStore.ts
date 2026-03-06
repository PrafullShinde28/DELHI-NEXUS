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
  compositeScore?: number;
};

export type CrimeEvent = {
  id: number;
  zone: string;
  crimeType: string;
  timestamp: number;
};

export type FloodEvent = {
  locationName: string;
  floodProbability: number;
  riskLevel: string;
};

/* ============================= */
/* STORE */
/* ============================= */

type Store = {
  hospitals: HospitalEvent[];
  crimes: CrimeEvent[];
  floods: FloodEvent[];

  setHospitals: (data: HospitalEvent[]) => void;
  setCrimes: (data: CrimeEvent[]) => void;
  setFloods: (data: FloodEvent[]) => void;
};

/* ============================= */
/* ZUSTAND */
/* ============================= */

export const useResilienceStore = create<Store>((set) => ({
  hospitals: [],
  crimes: [],
  floods: [],

  setHospitals: (data) => set({ hospitals: data }),

  setCrimes: (data) => set({ crimes: data }),

  setFloods: (data) => set({ floods: data }),
}));
