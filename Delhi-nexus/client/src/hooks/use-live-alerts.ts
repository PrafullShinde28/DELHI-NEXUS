import { useEffect } from "react";
import { io } from "socket.io-client";

export function useLiveAlerts(setAlerts: any) {

 useEffect(() => {
  const socket = io("http://localhost:5000", {
    path: "/socket.io",
    transports: ["websocket"],
  });

  socket.on("alert_update", (alert) => {
    setAlerts((prev: any[]) => [alert, ...(prev || [])]);
  });

  return () => {
    socket.disconnect();   // ✅ proper cleanup
  };

}, []);

}