import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

export function useResilienceWebSocket() {

  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {

    const socket = io({
      path: "/socket.io",
      transports: ["websocket"],
    });

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

    socket.on("city_health_alert", () => {

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

    /* ================= Hospital ================= */

    socket.on("hospital_update", (data: any) => {

      queryClient.invalidateQueries({
        queryKey: [api.hospital.list.path],
      });

      toast({
        title: "🏥 Hospital Capacity Update",
        description: `${data.name} bed capacity updated`,
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
    };

  }, [queryClient, toast]);

  return socketRef.current;
}