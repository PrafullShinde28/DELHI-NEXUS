import { useEffect, useRef } from "react";

export function useSmartCitySocket(onMessage: (data:any)=>void) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = new WebSocket("ws://localhost:8080");

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
      };
    }

    return () => {};
  }, []);
}