import { useEffect } from "react";
import { io } from "socket.io-client";

export function useLiveAQI(setPollution: any) {

  useEffect(() => {

    const socket = io("http://localhost:5000", {
      path: "/socket.io"
    });

    socket.on("aqi_update", (data) => {
      setPollution(data);
    });

    return () => {
      socket.disconnect();
    };

  }, []);

}