import type { Express } from "express";
import type { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { startCronJobs } from "./cron";
import axios from "axios";

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

  /* ============================================
     SOCKET.IO
  ============================================ */

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

  const broadcastEvent = (type: string, data: any) => {
    io.emit(type, data);
  };

  /* ============================================
     DASHBOARD
  ============================================ */

  app.get(api.dashboard.overview.path, async (req, res) => {

    const [traffic, pollution, weather, alerts] =
      await Promise.all([
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

  app.get(api.traffic.current.path, async (req, res) => {
    res.json(await storage.getLatestTraffic());
  });

  app.get(api.traffic.history.path, async (req, res) => {
    res.json(await storage.getTrafficHistory());
  });

  /* ============================================
     POLLUTION
  ============================================ */

  app.get(api.pollution.current.path, async (req, res) => {
    res.json(await storage.getLatestPollution());
  });

  app.get(api.pollution.history.path, async (req, res) => {
    res.json(await storage.getPollutionHistory());
  });

  /* ============================================
     AI PREDICTIONS
  ============================================ */

  app.post("/api/predictions/generate", async (req, res) => {

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

  /* ============================================
     FLOOD ENGINE (RESILIENCE)
  ============================================ */

  app.get("/api/flood/current", async (req, res) => {
    res.json(await storage.getLatestFloodData());
  });

  app.get("/api/flood/history", async (req, res) => {
    res.json(await storage.getHistoricalFloodData());
  });

  app.post("/api/flood/mock", async (req, res) => {
    await generateMockFloodData(io);
    res.json({ message: "Flood data generated" });
  });

  /* ============================================
     CITY HEALTH ENGINE
  ============================================ */

  app.get("/api/city-health/current", async (req, res) => {
    res.json(await storage.getLatestCityHealth());
  });

  app.get("/api/city-health/history", async (req, res) => {
    res.json(await storage.getHistoricalCityHealth());
  });

  app.post("/api/city-health/recalculate", async (req, res) => {
    await generateMockCityHealthData(io);
    res.json({ message: "City health recalculated" });
  });

  /* ============================================
     CRIME
  ============================================ */

  app.get(api.crime.list.path, async (req, res) => {
    res.json(await storage.getCrimeIncidents());
  });

  app.post(api.crime.create.path, async (req, res) => {

    try {

      const input = api.crime.create.input.parse(req.body);

      const incident = await storage.createCrimeIncident(input);

      broadcastEvent("crime_update", incident);

      res.status(201).json(incident);

    } catch (err) {

      if (err instanceof z.ZodError) {

        return res.status(400).json({
          message: err.errors[0].message,
        });

      }

      res.status(500).json({ message: "Server error" });

    }

  });

  /* ============================================
     HOSPITAL
  ============================================ */

  app.get(api.hospital.list.path, async (req, res) => {
    res.json(await storage.getHospitals());
  });

  app.put(api.hospital.update.path, async (req, res) => {

    const input = api.hospital.update.input.parse(req.body);

    const updated = await storage.updateHospital(
      Number(req.params.id),
      input,
    );

    broadcastEvent("hospital_update", updated);

    res.json(updated);
  });

  /* ============================================
     DATABASE SEED
  ============================================ */

  await seedDatabase(io);

  return httpServer;
}

/* ===============================================
   FLOOD CALCULATION
=============================================== */

function calculateFloodRisk(
  rainfall: number,
  water: number,
  drainage: number,
  soil: number,
) {

  let probability =
    rainfall * 0.4 +
    water * 0.3 +
    soil * 0.2 +
    (100 - drainage) * 0.1;

  probability = Math.min(100, Math.max(0, probability));

  let risk = "low";

  if (probability > 80) risk = "critical";
  else if (probability > 60) risk = "high";
  else if (probability > 30) risk = "moderate";

  return { probability, risk };
}

/* ===============================================
   MOCK FLOOD DATA
=============================================== */
async function generateMockFloodData(io: SocketIOServer) {

  const data = NCR_ZONES.map((zone) => {

    const rainfall = Math.random() * 100;
    const water = Math.random() * 100;
    const drainage = Math.random() * 100;
    const soil = Math.random() * 100;

    const risk = calculateFloodRisk(
      rainfall,
      water,
      drainage,
      soil
    );

    return {
      locationName: zone.name,
      latitude: zone.lat.toString(),
      longitude: zone.lng.toString(),
      rainfallIntensity: rainfall.toFixed(2),
      waterLevel: water.toFixed(2),
      drainageCapacity: drainage.toFixed(2),
      soilSaturation: soil.toFixed(2),
      floodProbability: risk.probability.toFixed(2),
      riskLevel: risk.risk
    };
  });

  const inserted = await storage.insertFloodData(data);

  io.emit("flood_alert", inserted);
}

/* ===============================================
   CITY HEALTH
=============================================== */

function calculateCityHealthStatus(
  traffic: number,
  aqi: number,
  crime: number,
  flood: number,
  hospital: number
) {

  let composite =
    traffic * 0.2 +
    aqi * 0.25 +
    crime * 0.2 +
    flood * 0.15 +
    hospital * 0.2;

  composite = Math.min(100, Math.max(0, composite));

  let status = "critical";

  if (composite >= 80) {
    status = "healthy";
  } else if (composite >= 60) {
    status = "moderate";
  }

  return {
    composite,
    status,
  };
}

async function generateMockCityHealthData(io: SocketIOServer) {

  const data = NCR_ZONES.map((zone) => {

    const traffic = Math.random() * 100;
    const aqi = Math.random() * 100;
    const crime = Math.random() * 100;
    const flood = Math.random() * 100;
    const hospital = Math.random() * 100;

    const { composite, status } = calculateCityHealthStatus(
      traffic,
      aqi,
      crime,
      flood,
      hospital
    );

    return {
      locationName: zone.name,
      trafficScore: traffic.toFixed(2),
      aqiScore: aqi.toFixed(2),
      crimeScore: crime.toFixed(2),
      floodScore: flood.toFixed(2),
      hospitalScore: hospital.toFixed(2),
      compositeScore: composite.toFixed(2),
      status
    };
  });

  const inserted = await storage.insertCityHealthData(data);

  io.emit("city_health_update", inserted);
}

/* ===============================================
   DATABASE SEED
=============================================== */
async function seedDatabase(io: SocketIOServer) {

  const existing = await storage.getZoneRisks();

  if (existing.length > 0) {
    console.log("Seed skipped: zone risks already exist");
    return;
  }

  console.log("Seeding NCR data...");

  for (const zone of NCR_ZONES) {

    await storage.createHospital({
      name: `City Hospital ${zone.name}`,
      zone: zone.name,
      lat: zone.lat,
      lng: zone.lng,
      totalBeds: 500,
      occupiedBeds: Math.floor(Math.random() * 500),
      icuTotal: 50,
      icuOccupied: Math.floor(Math.random() * 50),
      oxygenStatus: "ok",
    });

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