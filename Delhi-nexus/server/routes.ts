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

   /* ============================================
   ALERTS
============================================ */

app.get(api.alerts.list.path, async (req, res) => {

  try {

    const alerts = await storage.getActiveAlerts();

    res.json(alerts);

  } catch (err) {

    console.error("Alerts fetch error:", err);

    res.status(500).json({
      message: "Failed to fetch alerts"
    });

  }

});
  /* ================= SOCKET ================= */

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () =>
      console.log("Client disconnected:", socket.id),
    );
  });

  startCronJobs(io);
  await initHospitals();
  startHospitalMonitoring(io);

  const broadcast = (type: string, data: any) => io.emit(type, data);

  /* ================= DASHBOARD ================= */

  app.get(api.dashboard.overview.path, async (_, res) => {
    const [traffic, pollution, weather, alerts] = await Promise.all([
      storage.getLatestTraffic(),
      storage.getLatestPollution(),
      storage.getLatestWeather(),
      storage.getActiveAlerts(),
    ]);
    res.json({ traffic, pollution, weather, alerts });
  });

  /* ================= TRAFFIC ================= */

  app.get(api.traffic.current.path, async (_, res) =>
    res.json(await storage.getLatestTraffic()),
  );

  app.get(api.traffic.history.path, async (_, res) =>
    res.json(await storage.getTrafficHistory()),
  );

  /* ================= POLLUTION ================= */

  app.get(api.pollution.current.path, async (_, res) =>
    res.json(await storage.getLatestPollution()),
  );

  app.get(api.pollution.history.path, async (_, res) =>
    res.json(await storage.getPollutionHistory()),
  );

  /* ================= RISK ================= */

  app.get(api.risk.list.path, async (_, res) =>
    res.json(await storage.getZoneRisks()),
  );

  /* ================= AI PREDICTION ================= */
  app.post("/api/predictions/train", async (req,res)=>{

  const traffic = await storage.getTrafficHistory();
  const pollution = await storage.getPollutionHistory();
  const weather = await storage.getWeatherHistory();

  const dataset = traffic.map((t,i)=>({

    traffic_density: t.vehicleDensity,

    aqi: pollution[i]?.aqi ?? 150,

    temperature: weather[i]?.temperature ?? 30,

    humidity: weather[i]?.humidity ?? 60

  }))

  const ai = await axios.post(
    "http://localhost:5001/train",
    { data: dataset }
  )

  res.json(ai.data)

})

app.post("/api/predictions/generate", async (req,res)=>{

  try{

    const traffic = await storage.getLatestTraffic();
    const pollution = await storage.getLatestPollution();
    const weather = await storage.getLatestWeather();

    const trafficDensity =
      traffic.reduce((a,b)=>a+b.vehicleDensity,0)/traffic.length;

    const avgAqi =
      pollution.reduce((a,b)=>a+b.aqi,0)/pollution.length;

    const ai = await axios.post(
      "http://localhost:5001/predict/city",
      {
        traffic_density: trafficDensity,
        aqi: avgAqi,
        temperature: weather?.temperature ?? 30,
        humidity: weather?.humidity ?? 60
      }
    );

    const forecasts = ai.data.forecasts;

    res.json(forecasts);

  }catch(err){

    console.error("Prediction error:",err);

    res.status(500).json({
      message:"Prediction generation failed"
    });

  }

});
  /* ================= CRIME ================= */

  app.get(api.crime.list.path, async (_, res) =>
    res.json(await storage.getCrimeIncidents()),
  );

  app.post(api.crime.create.path, async (req, res) => {
    try {
      const input = api.crime.create.input.parse(req.body);
      const incident = await storage.createCrimeIncident(input);
      broadcast("crime_update", incident);
      res.status(201).json(incident);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  /* ================= HOSPITAL ================= */

  app.get(api.hospital.list.path, async (_, res) =>
    res.json(await storage.getHospitals()),
  );

  app.put(api.hospital.update.path, async (req, res) => {
    const input = api.hospital.update.input.parse(req.body);
    const updated = await storage.updateHospital(Number(req.params.id), input);
    broadcast("hospital_update", [updated]);
    res.json(updated);
  });

  /* ================= FLOOD ================= */

  app.post("/api/flood/mock", async (_, res) => {
    await generateMockFloodData(io);
    res.json({ message: "Flood generated" });
  });

  /* ================= CITY HEALTH ================= */

  app.post("/api/city-health/recalculate", async (_, res) => {
    await generateMockCityHealthData(io);
    res.json({ message: "City health recalculated" });
  });

  await seedDatabase(io);

  return httpServer;
}

/* ===============================================
   FLOOD MOCK
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

      /* ✅ MUST BE STRING */
      latitude: zone.lat.toString(),
      longitude: zone.lng.toString(),

      /* ✅ REQUIRED FIELDS */
      rainfallIntensity: Number(rainfall.toFixed(2)),
      waterLevel: Number(water.toFixed(2)),
      drainageCapacity: Number(drainage.toFixed(2)),
      soilSaturation: Number(soil.toFixed(2)),

      floodProbability: Number(probability.toFixed(2)),

      riskLevel:
        probability > 80
          ? "critical"
          : probability > 60
            ? "high"
            : probability > 30
              ? "moderate"
              : "low",
    };
  });

  const inserted = await storage.insertFloodData(data);

  io.emit("flood_alert", inserted);
}

/* ===============================================
   CITY HEALTH MOCK
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

      /* ✅ REQUIRED FIELDS */
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
