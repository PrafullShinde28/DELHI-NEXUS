CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"location_id" text NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "city_health_score" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_name" text NOT NULL,
	"traffic_score" real NOT NULL,
	"aqi_score" real NOT NULL,
	"crime_score" real NOT NULL,
	"flood_score" real NOT NULL,
	"hospital_score" real NOT NULL,
	"composite_score" real NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crime_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone" text NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"crime_type" text NOT NULL,
	"severity" integer NOT NULL,
	"incident_count" integer NOT NULL,
	"risk_score" real NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "flood_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_name" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"rainfall_intensity" real NOT NULL,
	"water_level" real NOT NULL,
	"drainage_capacity" real NOT NULL,
	"soil_saturation" real NOT NULL,
	"flood_probability" real NOT NULL,
	"risk_level" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "flood_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_name" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"rainfall_intensity" real NOT NULL,
	"flood_probability" real NOT NULL,
	"water_level" real NOT NULL,
	"drainage_capacity" real NOT NULL,
	"risk_level" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hospitals" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"zone" text NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"total_beds" integer NOT NULL,
	"occupied_beds" integer NOT NULL,
	"icu_total" integer NOT NULL,
	"icu_occupied" integer NOT NULL,
	"oxygen_status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pollution_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"aqi" integer NOT NULL,
	"pm2_5" double precision NOT NULL,
	"pm10" double precision NOT NULL,
	"no2" double precision NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"location_id" text NOT NULL,
	"predicted_value" double precision NOT NULL,
	"confidence_score" double precision,
	"forecast_time" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "traffic_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"vehicle_density" integer NOT NULL,
	"congestion_index" double precision NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weather_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"temperature" double precision NOT NULL,
	"humidity" integer NOT NULL,
	"wind_speed" double precision NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zone_risks" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone" text NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"composite_score" real NOT NULL,
	"traffic_score" real NOT NULL,
	"aqi_score" real NOT NULL,
	"crime_score" real NOT NULL,
	"hospital_score" real NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	CONSTRAINT "zone_risks_zone_unique" UNIQUE("zone")
);
