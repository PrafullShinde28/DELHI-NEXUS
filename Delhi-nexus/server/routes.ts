import type { Express } from "express";
import type { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { startCronJobs } from "./cron";
import axios from "axios";
import {
  initHospitals,
  startHospitalMonitoring,
} from "./services/hospitalEngine";

/* ===============================================
   NCR ZONES
=============================================== */

const NCR_ZONES = [
  { name: "Chandni Chowk", lat: 28.6505, lng: 77.2303 },
  { name: "Connaught Place", lat: 28.6304, lng: 77.2177 },
  { name: "Rohini", lat: 28.7041, lng: 77.1025 },
  { name: "Dwarka", lat: 28.5823, lng: 77.05 },
  { name: "Saket", lat: 28.5246, lng: 77.2066 },
  { name: "Lajpat Nagar", lat: 28.5677, lng: 77.2433 },
  { name: "Karol Bagh", lat: 28.6519, lng: 77.1888 },
  { name: "Noida Sector 62", lat: 28.6208, lng: 77.3639 },
  { name: "Gurugram Cyber City", lat: 28.495, lng: 77.0895 },
];

/* ===============================================
   REGISTER ROUTES
=============================================== */

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  startCronJobs(io);
  await initHospitals();
  startHospitalMonitoring(io);

  const broadcastEvent = (type: string, data: any) => io.emit(type, data);

  /* ============================================
     DASHBOARD
  ============================================ */

  app.get(api.dashboard.overview.path, async (_, res) => {
    const [traffic, pollution, weather, alerts] = await Promise.all([
      storage.getLatestTraffic(),
      storage.getLatestPollution(),
      storage.getLatestWeather(),
      storage.getActiveAlerts(),
    ]);
    res.json({ traffic, pollution, weather, alerts });
  });

  /* ============================================
     TRAFFIC
  ============================================ */

  app.get(api.traffic.current.path, async (_, res) =>
    res.json(await storage.getLatestTraffic()),
  );

  app.get(api.traffic.history.path, async (_, res) =>
    res.json(await storage.getTrafficHistory()),
  );
  /* ============================================
   RISK ENGINE
============================================ */

  app.get(api.risk.list.path, async (_, res) => {
    const data = await storage.getZoneRisks();
    res.json(data);
  });
  /* ============================================
     POLLUTION
  ============================================ */

  app.get(api.pollution.current.path, async (_, res) =>
    res.json(await storage.getLatestPollution()),
  );

  app.get(api.pollution.history.path, async (_, res) =>
    res.json(await storage.getPollutionHistory()),
  );

  /* ============================================
     AI PREDICTIONS
  ============================================ */
app.post("/api/predictions/train", async (req,res)=>{

  app.post("/api/predictions/generate", async (_, res) => {
    try {
      const trafficRes = await axios.post(
        "http://localhost:5001/predict/traffic",
        { history: [50, 55, 60, 58, 62] },
      );

      const pollutionRes = await axios.post(
        "http://localhost:5001/predict/pollution",
        {
          aqi_history: [150, 160, 155, 170],
          traffic_density: 80,
          temperature: 30,
          humidity: 40,
        },
      );

      const trafficPred = await storage.createPrediction({
        type: "traffic",
        locationId: "Delhi-General",
        predictedValue: trafficRes.data.predicted_value,
        confidenceScore: trafficRes.data.confidence_score,
        forecastTime: new Date(Date.now() + 3600000),
        details: trafficRes.data.details,
      });

      const pollutionPred = await storage.createPrediction({
        type: "pollution",
        locationId: "Delhi-General",
        predictedValue: pollutionRes.data.predicted_value,
        confidenceScore: pollutionRes.data.confidence_score,
        forecastTime: new Date(Date.now() + 86400000),
        details: pollutionRes.data.details,
      });

      broadcastEvent("prediction_update", {
        traffic: trafficPred,
        pollution: pollutionPred,
      });

      res.json({ traffic: trafficPred, pollution: pollutionPred });
    } catch (err) {
      console.error("Prediction Generation Error:", err);
      res.status(500).json({ message: "Prediction failed" });
    }
  });

});
  /* ============================================
     FLOOD MOCK
  ============================================ */

  app.post("/api/flood/mock", async (_, res) => {
    await generateMockFloodData(io);
    res.json({ message: "Flood data generated" });
  });

  /* ============================================
     CITY HEALTH MOCK
  ============================================ */

  app.post("/api/city-health/recalculate", async (_, res) => {
    await generateMockCityHealthData(io);
    res.json({ message: "City health recalculated" });
  });

  /* ============================================
     CRIME
  ============================================ */

  app.get(api.crime.list.path, async (_, res) =>
    res.json(await storage.getCrimeIncidents()),
  );

  app.post(api.crime.create.path, async (req, res) => {
    try {
      const input = api.crime.create.input.parse(req.body);
      const incident = await storage.createCrimeIncident(input);
      broadcastEvent("crime_update", incident);
      res.status(201).json(incident);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  /* ============================================
     HOSPITAL
  ============================================ */

  app.get(api.hospital.list.path, async (_, res) =>
    res.json(await storage.getHospitals()),
  );

  app.put(api.hospital.update.path, async (req, res) => {
    const input = api.hospital.update.input.parse(req.body);
    const updated = await storage.updateHospital(Number(req.params.id), input);
    io.emit("hospital_update", [updated]);
    res.json(updated);
  });

  await seedDatabase(io);

  return httpServer;
}

/* ===============================================
   FLOOD MOCK GENERATOR
=============================================== */

async function generateMockFloodData(io: SocketIOServer) {
  const data = NCR_ZONES.map((zone) => {
    const rainfall = Math.random() * 100;
    const water = Math.random() * 100;
    const drainage = Math.random() * 100;
    const soil = Math.random() * 100;

    const probability =
      rainfall * 0.4 + water * 0.3 + soil * 0.2 + (100 - drainage) * 0.1;

    return {
      locationName: zone.name,
      latitude: zone.lat.toString(),
      longitude: zone.lng.toString(),
      rainfallIntensity: Number(rainfall.toFixed(2)),
      waterLevel: Number(water.toFixed(2)),
      drainageCapacity: Number(drainage.toFixed(2)),
      soilSaturation: Number(soil.toFixed(2)),
      floodProbability: Number(probability.toFixed(2)),
      riskLevel:
        probability > 80 ? "critical" : probability > 60 ? "high" : "moderate",
    };
  });

  const inserted = await storage.insertFloodData(data);
  io.emit("flood_alert", inserted);
}

/* ===============================================
   CITY HEALTH MOCK GENERATOR
=============================================== */

async function generateMockCityHealthData(io: SocketIOServer) {
  const data = NCR_ZONES.map((zone) => {
    const traffic = Math.random() * 100;
    const aqi = Math.random() * 100;
    const crime = Math.random() * 100;
    const flood = Math.random() * 100;
    const hospital = Math.random() * 100;

    const composite =
      traffic * 0.2 + aqi * 0.25 + crime * 0.2 + flood * 0.15 + hospital * 0.2;

    return {
      locationName: zone.name,
      trafficScore: Number(traffic.toFixed(2)),
      aqiScore: Number(aqi.toFixed(2)),
      crimeScore: Number(crime.toFixed(2)),
      floodScore: Number(flood.toFixed(2)),
      hospitalScore: Number(hospital.toFixed(2)),
      compositeScore: Number(composite.toFixed(2)),
      status:
        composite >= 80 ? "healthy" : composite >= 60 ? "moderate" : "critical",
    };
  });

  const inserted = await storage.insertCityHealthData(data);
  io.emit("city_health_update", inserted);
}

/* ===============================================
   SEED DATABASE
=============================================== */

async function seedDatabase(io: SocketIOServer) {
  const existing = await storage.getZoneRisks();
  if (existing.length > 0) return;

  for (const zone of NCR_ZONES) {
    await storage.createZoneRisk({
      zone: zone.name,
      lat: zone.lat,
      lng: zone.lng,
      compositeScore: Math.random() * 100,
      trafficScore: Math.random() * 100,
      aqiScore: Math.random() * 100,
      crimeScore: Math.random() * 100,
      hospitalScore: Math.random() * 100,
    });
  }

  await generateMockFloodData(io);
  await generateMockCityHealthData(io);
}
