import { Server } from "socket.io";
import { storage } from "../storage";

/* ============================================
   ALERT TYPE
============================================ */

type Alert = {
  id?: number | string;
  type: string;
  severity: string;
  message: string;
  locationId: string;
  timestamp?: string;
  isActive: number;
};
/* ============================================
   IN-MEMORY CACHE
============================================ */

let alerts: Alert[] = [];

/* ============================================
   CREATE ALERT
============================================ */

const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

export async function generateAlert(io: any, alertData: any) {

  // fetch active alerts
  const activeAlerts = await storage.getActiveAlerts();

  const existing = activeAlerts.find(a =>
    a.type === alertData.type &&
    a.locationId === alertData.locationId
  );

  if (existing) {

    const lastTime = new Date(existing.timestamp).getTime();
    const now = Date.now();

    if (now - lastTime < ALERT_COOLDOWN) {
      return; // skip duplicate alert
    }

  }

  const alert = await storage.createAlert({
    type: alertData.type,
    severity: alertData.severity,
    message: alertData.message,
    locationId: alertData.locationId,
    isActive: 1
  });

  io.emit("alert_new", alert);

  return alert;
}

/* ============================================
   GET ALERTS (MEMORY CACHE)
============================================ */

export function getAlerts() {
  return alerts;
}

/* ============================================
   BROADCAST EXISTING ALERTS
============================================ */

export function broadcastAlerts(io: Server) {
  io.emit("alert_new", alerts);
}