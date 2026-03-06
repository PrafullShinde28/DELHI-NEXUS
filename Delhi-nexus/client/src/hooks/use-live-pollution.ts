import { useEffect } from "react";
import { io } from "socket.io-client";

export function useLivePollution(setData: any) {
  useEffect(() => {

    const socket = io("http://localhost:5000", {
      path: "/socket.io"
    });

    socket.on("pollution_update", (incoming) => {

      if (!incoming || incoming.length === 0) return;

      setData((prev: any[]) => {
        return incoming.length ? incoming : prev;
      });

    });

    return () => {
      socket.disconnect();
    };

  }, [setData]);
}