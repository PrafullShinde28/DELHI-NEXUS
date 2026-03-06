import cron from "node-cron";
import { storage } from "./storage";
import axios from "axios";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

// IMPORTANT: Docker service hostname
const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

/* ---------------- TRAFFIC DATA ---------------- */

async function fetchTrafficData() {
  const locations = [
    "Connaught Place",
    "Indira Gandhi Airport",
    "India Gate",
    "Hauz Khas",
    "Chandni Chowk"
  ];

  const newTrafficData = [];

  for (const loc of locations) {
    const density = Math.floor(Math.random() * 100);
    const congestion = (density / 100) * 10;

    const traffic = await storage.createTrafficData({
      locationId: loc,
      vehicleDensity: density,
      congestionIndex: congestion,
      timestamp: new Date()
    });

    newTrafficData.push(traffic);

    // ---- AI Anomaly Detection ----
    try {
      const anomalyRes = await axios.post(`${AI_URL}/detect/anomaly`, {
        value: density,
        metric_type: "traffic"
      });

      if (anomalyRes.data?.is_anomaly) {
        const alert = await storage.createAlert({
          type: "traffic_congestion",
          severity: anomalyRes.data.severity,
          message: `High traffic detected at ${loc}`,
          locationId: loc,
          isActive: 1
        });

        io?.emit("alert_new", alert);
      }
    } catch (err: any) {
      console.error("AI Service Error (Traffic):", err?.message);
    }
  }

  io?.emit("data_update", { type: "traffic", data: newTrafficData });
}

/* ---------------- POLLUTION DATA ---------------- */

async function fetchPollutionData() {
  const locations = [
    "Connaught Place",
    "Indira Gandhi Airport",
    "India Gate",
    "Hauz Khas",
    "Chandni Chowk"
  ];

  const newPollutionData = [];

  for (const loc of locations) {
    const aqi = Math.floor(Math.random() * 400) + 50;
    const pm25 = aqi * 0.6;
    const pm10 = aqi * 1.2;
    const no2 = Math.random() * 50;

    const pollution = await storage.createPollutionData({
      locationId: loc,
      aqi,
      pm25,
      pm10,
      no2,
      timestamp: new Date()
    });

    newPollutionData.push(pollution);

    // ---- AI Anomaly Detection ----
    try {
      const anomalyRes = await axios.post(`${AI_URL}/detect/anomaly`, {
        value: aqi,
        metric_type: "aqi"
      });

      if (anomalyRes.data?.is_anomaly) {
        const alert = await storage.createAlert({
          type: "high_pollution",
          severity: anomalyRes.data.severity,
          message: `Hazardous air quality at ${loc} (AQI: ${aqi})`,
          locationId: loc,
          isActive: 1
        });

        io?.emit("alert_new", alert);
      }
    } catch (err: any) {
      console.error("AI Service Error (Pollution):", err?.message);
    }
  }

  io?.emit("data_update", { type: "pollution", data: newPollutionData });
}

/* ---------------- WEATHER DATA ---------------- */

async function fetchWeatherData() {
  const temp = 25 + Math.random() * 15;
  const humidity = 30 + Math.random() * 40;
  const wind = Math.random() * 20;

  const weather = await storage.createWeatherData({
    locationId: "Delhi",
    temperature: temp,
    humidity: Math.floor(humidity),
    windSpeed: wind,
    timestamp: new Date()
  });

  io?.emit("data_update", { type: "weather", data: weather });
}

/* ---------------- CRON STARTER ---------------- */

export function startCronJobs(socketIO: SocketIOServer) {
  io = socketIO;

  console.log("Starting Cron Jobs...");
  console.log("AI Service URL:", AI_URL);

  // every minute
  cron.schedule("*/1 * * * *", async () => {
    console.log("Fetching external data...");
    await Promise.all([
      fetchTrafficData(),
      fetchPollutionData(),
      fetchWeatherData()
    ]);
  });

  // Run immediately
  fetchTrafficData();
  fetchPollutionData();
  fetchWeatherData();
}
