import {
  pgTable,
  text,
  serial,
  integer,
  doublePrecision,
  numeric,
  timestamp,
  jsonb,
  real,
} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* =================================================
   TRAFFIC DATA
================================================= */

export const trafficData = pgTable("traffic_data", {
  id: serial("id").primaryKey(),
  locationId: text("location_id").notNull(),
  vehicleDensity: integer("vehicle_density").notNull(),
  congestionIndex: doublePrecision("congestion_index").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertTrafficSchema = createInsertSchema(trafficData).omit({
  id: true,
});

export type InsertTraffic = z.infer<typeof insertTrafficSchema>;
export type TrafficData = typeof trafficData.$inferSelect;

/* =================================================
   POLLUTION DATA
================================================= */

export const pollutionData = pgTable("pollution_data", {
  id: serial("id").primaryKey(),
  locationId: text("location_id").notNull(),
  aqi: integer("aqi").notNull(),
  pm25: doublePrecision("pm2_5").notNull(),
  pm10: doublePrecision("pm10").notNull(),
  no2: doublePrecision("no2").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertPollutionSchema = createInsertSchema(pollutionData).omit({
  id: true,
});

export type InsertPollution = z.infer<typeof insertPollutionSchema>;
export type PollutionData = typeof pollutionData.$inferSelect;

/* =================================================
   WEATHER DATA
================================================= */

export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  locationId: text("location_id").notNull(),
  temperature: doublePrecision("temperature").notNull(),
  humidity: integer("humidity").notNull(),
  windSpeed: doublePrecision("wind_speed").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertWeatherSchema = createInsertSchema(weatherData).omit({
  id: true,
});

export type InsertWeather = z.infer<typeof insertWeatherSchema>;
export type WeatherData = typeof weatherData.$inferSelect;

/* =================================================
   FLOOD DATA (Resilience Engine)
================================================= */

export const floodData = pgTable("flood_data", {
  id: serial("id").primaryKey(),

  locationName: text("location_name").notNull(),

  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),

  rainfallIntensity: real("rainfall_intensity").notNull(),
  waterLevel: real("water_level").notNull(),
  drainageCapacity: real("drainage_capacity").notNull(),
  soilSaturation: real("soil_saturation").notNull(),

  floodProbability: real("flood_probability").notNull(),

  riskLevel: text("risk_level").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFloodDataSchema = createInsertSchema(floodData).omit({
  id: true,
  createdAt: true,
});

export type FloodData = typeof floodData.$inferSelect;
export type InsertFloodData = z.infer<typeof insertFloodDataSchema>;

/* =================================================
   CITY HEALTH ENGINE
================================================= */

export const cityHealthScore = pgTable("city_health_score", {
  id: serial("id").primaryKey(),

  locationName: text("location_name").notNull(),

  trafficScore: real("traffic_score").notNull(),
  aqiScore: real("aqi_score").notNull(),
  crimeScore: real("crime_score").notNull(),
  floodScore: real("flood_score").notNull(),
  hospitalScore: real("hospital_score").notNull(),

  compositeScore: real("composite_score").notNull(),

  status: text("status").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCityHealthScoreSchema = createInsertSchema(
  cityHealthScore,
).omit({
  id: true,
  createdAt: true,
});

export type CityHealthScore = typeof cityHealthScore.$inferSelect;
export type InsertCityHealthScore = z.infer<typeof insertCityHealthScoreSchema>;

/* =================================================
   CRIME INCIDENTS
================================================= */

export const crimeIncidents = pgTable("crime_incidents", {
  id: serial("id").primaryKey(),
  zone: text("zone").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  crimeType: text("crime_type").notNull(),
  severity: integer("severity").notNull(),
  incidentCount: integer("incident_count").notNull(),
  riskScore: real("risk_score").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertCrimeSchema = createInsertSchema(crimeIncidents).omit({
  id: true,
  timestamp: true,
});

export type CrimeIncident = typeof crimeIncidents.$inferSelect;
export type InsertCrime = z.infer<typeof insertCrimeSchema>;

/* =================================================
   HOSPITAL DATA
================================================= */

export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  zone: text("zone").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  totalBeds: integer("total_beds").notNull(),
  occupiedBeds: integer("occupied_beds").notNull(),
  icuTotal: integer("icu_total").notNull(),
  icuOccupied: integer("icu_occupied").notNull(),
  oxygenStatus: text("oxygen_status").notNull(),
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
});

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;

/* =================================================
   ZONE RISK
================================================= */

export const zoneRisks = pgTable("zone_risks", {
  id: serial("id").primaryKey(),
  zone: text("zone").notNull().unique(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  compositeScore: real("composite_score").notNull(),
  trafficScore: real("traffic_score").notNull(),
  aqiScore: real("aqi_score").notNull(),
  crimeScore: real("crime_score").notNull(),
  hospitalScore: real("hospital_score").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertZoneRiskSchema = createInsertSchema(zoneRisks).omit({
  id: true,
  timestamp: true,
});

export type ZoneRisk = typeof zoneRisks.$inferSelect;
export type InsertZoneRisk = z.infer<typeof insertZoneRiskSchema>;

/* =================================================
   PREDICTIONS
================================================= */

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  locationId: text("location_id").notNull(),
  predictedValue: doublePrecision("predicted_value").notNull(),
  confidenceScore: doublePrecision("confidence_score"),
  forecastTime: timestamp("forecast_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  details: jsonb("details"),
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
});

export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;

/* =================================================
   ALERTS
================================================= */

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  locationId: text("location_id").notNull(),
  isActive: integer("is_active").default(1).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
//flood event

export const floodEvents = pgTable("flood_events", {
  id: serial("id").primaryKey(),

  locationName: text("location_name").notNull(),

  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),

  rainfallIntensity: real("rainfall_intensity").notNull(),
  floodProbability: real("flood_probability").notNull(),

  waterLevel: real("water_level").notNull(),
  drainageCapacity: real("drainage_capacity").notNull(),

  riskLevel: text("risk_level").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
