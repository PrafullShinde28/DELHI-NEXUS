import "dotenv/config";

import { db } from "./db.ts";
import { floodEvents } from "../shared/schema.ts";
import { gt, lt } from "drizzle-orm";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.ts";
import { serveStatic } from "./static.ts";
import { createServer } from "http";
import { spawn } from "child_process";
import { WebSocketServer } from "ws";
import { wss } from "./ws-crime.ts";

import "./ws-crime.ts";

import { startFloodMonitoring } from "./services/floodEngine.ts";
import { startCrimeEngine } from "./services/crimeEngine.ts";
import { initHospitals, startHospitalMonitoring } from "./services/hospitalEngine.ts";

/* ---------------- START ENGINES ---------------- */

startFloodMonitoring();
startCrimeEngine();

/* ---------------- EXPRESS SETUP ---------------- */

const app = express();
const httpServer = createServer(app);


/* ---------------- FLOOD DATA CLEANUP ---------------- */

setInterval(async () => {
  try {

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await db.delete(floodEvents).where(
      lt(floodEvents.createdAt, sevenDaysAgo)
    );

    log("Old flood data cleaned (kept last 7 days)", "cleanup");

  } catch (err) {
    console.error("Cleanup job failed:", err);
  }

}, 60 * 60 * 1000);

/* ---------------- AI SERVICE START ---------------- */


/* ---------------- RAW BODY SUPPORT ---------------- */

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

/* ---------------- LOGGER ---------------- */

export function log(message: string, source = "express") {

  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);

}

/* ---------------- REQUEST LOGGER ---------------- */

app.use((req, res, next) => {

  const start = Date.now();
  const path = req.path;

  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;

  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {

    const duration = Date.now() - start;

    if (path.startsWith("/api")) {

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);

    }

  });

  next();

});

/* ---------------- FLOOD API ---------------- */

app.get("/api/flood/current", async (_req, res) => {

  const rows = await db.query.floodEvents.findMany({
    where: (flood, { gt }) =>
      gt(flood.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
  });

  res.json(rows);

});

/* ---------------- SERVER START ---------------- */
(async () => {

  await registerRoutes(httpServer, app);

  /* -------- LOAD HOSPITAL DATA -------- */

  await initHospitals();

  /* -------- START HOSPITAL MONITORING -------- */

  startHospitalMonitoring();

  /* -------- ERROR HANDLER -------- */

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });

  });

  /* -------- STATIC OR VITE -------- */

  if (process.env.NODE_ENV === "production") {

    serveStatic(app);

  } else {

    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);

  }

  /* -------- SERVER PORT -------- */

  const port = parseInt(process.env.PORT || "5000", 10);

  httpServer.listen(port, () => {
    log(`serving on port ${port}`);
  });

})();