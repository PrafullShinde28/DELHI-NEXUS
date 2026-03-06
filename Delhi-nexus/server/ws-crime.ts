import WebSocket, { WebSocketServer } from "ws";

export const wss = new WebSocketServer({ port: 8080 });

console.log("Crime WebSocket running on ws://localhost:8080");

export function broadcast(data: any) {

  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

}