import { db } from "./db";
import {
  /* Core System */
  trafficData,
  pollutionData,
  weatherData,
  predictions,
  alerts,

  /* Resilience Engine */
  floodData,
  cityHealthScore,

  /* Crime / Hospital / Risk */
  crimeIncidents,
  hospitals,
  zoneRisks,

  /* Types */
  type InsertTraffic,
  type InsertPollution,
  type InsertWeather,
  type InsertPrediction,
  type InsertAlert,

  type TrafficData,
  type PollutionData,
  type WeatherData,
  type Prediction,
  type Alert,

  type InsertFloodData,
  type InsertCityHealthScore,
  type FloodData,
  type CityHealthScore,

  type CrimeIncident,
  type InsertCrime,
  type Hospital,
  type InsertHospital,
  type ZoneRisk,
  type InsertZoneRisk,
} from "@shared/schema";

import { desc, eq } from "drizzle-orm";

/* =================================================
   STORAGE INTERFACE
================================================= */

export interface IStorage {

  /* ========= TRAFFIC ========= */

  createTrafficData(data: InsertTraffic): Promise<TrafficData>;
  getLatestTraffic(): Promise<TrafficData[]>;
  getTrafficHistory(limit?: number): Promise<TrafficData[]>;

  /* ========= POLLUTION ========= */

  createPollutionData(data: InsertPollution): Promise<PollutionData>;
  getLatestPollution(): Promise<PollutionData[]>;
  getPollutionHistory(limit?: number): Promise<PollutionData[]>;

  /* ========= WEATHER ========= */

  createWeatherData(data: InsertWeather): Promise<WeatherData>;
  getLatestWeather(): Promise<WeatherData | undefined>;

  /* ========= PREDICTIONS ========= */

  createPrediction(data: InsertPrediction): Promise<Prediction>;
  getLatestPredictions(type?: string): Promise<Prediction[]>;

  /* ========= ALERTS ========= */

  createAlert(data: InsertAlert): Promise<Alert>;
  getActiveAlerts(): Promise<Alert[]>;
  resolveAlert(id: number): Promise<void>;

  /* ========= FLOOD ENGINE ========= */

  getLatestFloodData(): Promise<FloodData[]>;
  getHistoricalFloodData(): Promise<FloodData[]>;
  insertFloodData(data: InsertFloodData[]): Promise<FloodData[]>;

  /* ========= CITY HEALTH ========= */

  getLatestCityHealth(): Promise<CityHealthScore[]>;
  getHistoricalCityHealth(): Promise<CityHealthScore[]>;
  insertCityHealthData(data: InsertCityHealthScore[]): Promise<CityHealthScore[]>;

  /* ========= CRIME ========= */

  getCrimeIncidents(): Promise<CrimeIncident[]>;
  createCrimeIncident(data: InsertCrime): Promise<CrimeIncident>;

  /* ========= HOSPITAL ========= */

  getHospitals(): Promise<Hospital[]>;
  updateHospital(id: number, data: Partial<InsertHospital>): Promise<Hospital>;
  createHospital(data: InsertHospital): Promise<Hospital>;

  /* ========= ZONE RISK ========= */

  getZoneRisks(): Promise<ZoneRisk[]>;
  createZoneRisk(data: InsertZoneRisk): Promise<ZoneRisk>;
}

/* =================================================
   DATABASE STORAGE IMPLEMENTATION
================================================= */



export class DatabaseStorage implements IStorage {



  /* ================= TRAFFIC ================= */

  async createTrafficData(data: InsertTraffic): Promise<TrafficData> {
    const [result] = await db.insert(trafficData).values(data).returning();
    return result;
  }

  async getLatestTraffic(): Promise<TrafficData[]> {
    return db.select().from(trafficData).orderBy(desc(trafficData.timestamp)).limit(50);
  }

  async getTrafficHistory(limit = 100): Promise<TrafficData[]> {
    return db.select().from(trafficData).orderBy(desc(trafficData.timestamp)).limit(limit);
  }

  /* ================= POLLUTION ================= */

  async createPollutionData(data: InsertPollution): Promise<PollutionData> {
    const [result] = await db.insert(pollutionData).values(data).returning();
    return result;
  }

  async getLatestPollution(): Promise<PollutionData[]> {
    return db.select().from(pollutionData).orderBy(desc(pollutionData.timestamp)).limit(50);
  }

  async getPollutionHistory(limit = 100): Promise<PollutionData[]> {
    return db.select().from(pollutionData).orderBy(desc(pollutionData.timestamp)).limit(limit);
  }

  /* ================= WEATHER ================= */

  async createWeatherData(data: InsertWeather): Promise<WeatherData> {
    const [result] = await db.insert(weatherData).values(data).returning();
    return result;
  }

  async getLatestWeather(): Promise<WeatherData | undefined> {
    const [result] = await db
      .select()
      .from(weatherData)
      .orderBy(desc(weatherData.timestamp))
      .limit(1);

    return result;
  }

  async getWeatherHistory(limit = 200) {
  return await db
    .select()
    .from(weatherData)
    .orderBy(desc(weatherData.timestamp))
    .limit(limit);
}
  

  /* ================= PREDICTIONS ================= */

  async createPrediction(data: InsertPrediction): Promise<Prediction> {
    const [result] = await db.insert(predictions).values(data).returning();
    return result;
  }

  async getLatestPredictions(type?: string): Promise<Prediction[]> {
    let query = db.select().from(predictions).orderBy(desc(predictions.createdAt));

    if (type) {
      query = query.where(eq(predictions.type, type)) as any;
    }

    return query.limit(20);
  }

  /* ================= ALERTS ================= */

  async createAlert(data: InsertAlert): Promise<Alert> {
    const [result] = await db.insert(alerts).values(data).returning();
    return result;
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.isActive, 1))
      .orderBy(desc(alerts.timestamp));
  }

  async resolveAlert(id: number): Promise<void> {
    await db.update(alerts).set({ isActive: 0 }).where(eq(alerts.id, id));
  }

  /* ================= FLOOD ENGINE ================= */

  async getLatestFloodData(): Promise<FloodData[]> {

    const data = await db
      .select()
      .from(floodData)
      .orderBy(desc(floodData.createdAt));

    const latest = new Map<string, FloodData>();

    for (const d of data) {
      latest.set(d.locationName, d);
    }

    return Array.from(latest.values());
  }

  async getHistoricalFloodData(): Promise<FloodData[]> {
    return db.select().from(floodData).orderBy(desc(floodData.createdAt));
  }

  async insertFloodData(data: InsertFloodData[]): Promise<FloodData[]> {
    if (!data.length) return [];
    return db.insert(floodData).values(data).returning();
  }

  /* ================= CITY HEALTH ================= */

  async getLatestCityHealth(): Promise<CityHealthScore[]> {

    const data = await db
      .select()
      .from(cityHealthScore)
      .orderBy(desc(cityHealthScore.createdAt));

    const latest = new Map<string, CityHealthScore>();

    for (const d of data) {
      latest.set(d.locationName, d);
    }

    return Array.from(latest.values());
  }

  async getHistoricalCityHealth(): Promise<CityHealthScore[]> {
    return db.select().from(cityHealthScore).orderBy(desc(cityHealthScore.createdAt));
  }

  async insertCityHealthData(data: InsertCityHealthScore[]): Promise<CityHealthScore[]> {
    if (!data.length) return [];
    return db.insert(cityHealthScore).values(data).returning();
  }

  /* ================= CRIME ================= */

  async getCrimeIncidents(): Promise<CrimeIncident[]> {
    return db.select().from(crimeIncidents);
  }

  async createCrimeIncident(data: InsertCrime): Promise<CrimeIncident> {
    const [result] = await db.insert(crimeIncidents).values(data).returning();
    return result;
  }

  /* ================= HOSPITAL ================= */

  async getHospitals(): Promise<Hospital[]> {
    return db.select().from(hospitals);
  }

  async updateHospital(id: number, updates: Partial<InsertHospital>): Promise<Hospital> {
    const [updated] = await db
      .update(hospitals)
      .set(updates)
      .where(eq(hospitals.id, id))
      .returning();

    return updated;
  }

  async createHospital(data: InsertHospital): Promise<Hospital> {
    const [result] = await db.insert(hospitals).values(data).returning();
    return result;
  }

  /* ================= ZONE RISK ================= */

  async getZoneRisks(): Promise<ZoneRisk[]> {
    return db.select().from(zoneRisks);
  }

  async createZoneRisk(data: InsertZoneRisk): Promise<ZoneRisk> {
    const [result] = await db.insert(zoneRisks).values(data).returning();
    return result;
  }
}

/* =================================================
   SINGLE EXPORT
================================================= */

export const storage = new DatabaseStorage();