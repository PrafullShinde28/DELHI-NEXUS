import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { useResilienceStore } from "@/store/resilienceStore";
import type { HospitalEvent } from "@/store/resilienceStore";

export function useResilienceWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    /* ✅ FIXED CONNECTION */
    const socket = io("http://localhost:5000", {
      path: "/socket.io",
      transports: ["websocket"],
    });

    console.log("[WS] Connecting to Smart City Engine...");

    const setHospitals = useResilienceStore.getState().setHospitals;

    /* ================= CONNECT ================= */

    socket.on("connect", () => {
      console.log("[WS] Connected to Smart City Engine");
    });

    /* ================= Flood Alerts ================= */

    socket.on("flood_alert", (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [api.flood.current.path],
      });

      queryClient.invalidateQueries({
        queryKey: [api.flood.history.path],
      });

      toast({
        title: "⚠️ Flood Alert",
        description:
          data?.alerts?.length > 0
            ? `High water levels detected at ${data.alerts[0].locationName}`
            : "Flood risk detected in NCR region",
        variant: "destructive",
      });
    });

    /* ================= City Health ================= */

    socket.on("city_health_update", () => {
      queryClient.invalidateQueries({
        queryKey: [api.cityHealth.current.path],
      });

      queryClient.invalidateQueries({
        queryKey: [api.cityHealth.history.path],
      });

      toast({
        title: "🏥 City Health Update",
        description: "Composite health score updated",
      });
    });

    /* ================= Crime ================= */

    socket.on("crime_update", (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [api.crime.list.path],
      });

      toast({
        title: "🚓 Crime Incident",
        description: `${data.crimeType} reported in ${data.zone}`,
        variant: "destructive",
      });
    });

    /* ================= Hospital (FINAL) ================= */

    socket.on("hospital_update", (data: any[]) => {
      const transformed: HospitalEvent[] = data.map((h: any) => {
        const oxygenStatus: HospitalEvent["oxygenStatus"] =
          h.riskLevel === "critical"
            ? "critical"
            : Number(h.emergencyLoad) > 65
              ? "low"
              : "ok";

        return {
          id: Number(h.osmId),
          name: String(h.hospitalName),
          lat: Number(h.latitude),
          lng: Number(h.longitude),
          zone: "Delhi",

          totalBeds: 150,
          occupiedBeds: 150 - Number(h.availableBeds),

          icuTotal: 20,
          icuOccupied: 20 - Number(h.icuBeds),

          oxygenStatus,
        };
      });

      setHospitals(transformed);

      toast({
        title: "🏥 Hospital Network Update",
        description: `${transformed.length} hospitals synchronized`,
      });
    });

    /* ================= Predictions ================= */

    socket.on("prediction_update", () => {
      queryClient.invalidateQueries({
        queryKey: [api.predictions.list.path],
      });

      toast({
        title: "🧠 AI Forecast Update",
        description: "New traffic & pollution predictions generated",
      });
    });

    socket.on("disconnect", () => {
      console.log("[WS] Disconnected from Smart City Engine");
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      console.log("[WS] Connection closed");
    };
  }, [queryClient, toast]);

  return socketRef.current;
}
