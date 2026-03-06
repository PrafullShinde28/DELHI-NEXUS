import { z } from "zod";

import {
  /* Core System */
  insertTrafficSchema,
  trafficData,
  insertPollutionSchema,
  pollutionData,
  insertWeatherSchema,
  weatherData,
  insertPredictionSchema,
  predictions,
  insertAlertSchema,
  alerts,

  /* Resilience Engine */
  floodData,
  cityHealthScore,

  /* Crime / Hospital / Risk */
  crimeIncidents,
  hospitals,
  zoneRisks,
  insertCrimeSchema,
  insertHospitalSchema,
  insertZoneRiskSchema,
} from "./schema";

/* =================================================
   ERROR SCHEMAS
================================================= */

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

/* =================================================
   FULL PLATFORM API CONTRACT
================================================= */

export const api = {

  /* ================= Dashboard ================= */

  dashboard: {
    overview: {
      method: "GET" as const,
      path: "/api/dashboard/overview" as const,
      responses: {
        200: z.object({
          traffic: z.array(z.custom<typeof trafficData.$inferSelect>()),
          pollution: z.array(z.custom<typeof pollutionData.$inferSelect>()),
          weather: z.custom<typeof weatherData.$inferSelect>().nullable(),
          alerts: z.array(z.custom<typeof alerts.$inferSelect>()),
        }),
      },
    },
  },

  /* ================= Traffic ================= */

  traffic: {
    current: {
      method: "GET" as const,
      path: "/api/traffic/current" as const,
      responses: {
        200: z.array(z.custom<typeof trafficData.$inferSelect>()),
      },
    },

    history: {
      method: "GET" as const,
      path: "/api/traffic/history" as const,
      responses: {
        200: z.array(z.custom<typeof trafficData.$inferSelect>()),
      },
    },
  },

  /* ================= Pollution ================= */

  pollution: {
    current: {
      method: "GET" as const,
      path: "/api/pollution/current" as const,
      responses: {
        200: z.array(z.custom<typeof pollutionData.$inferSelect>()),
      },
    },

    history: {
      method: "GET" as const,
      path: "/api/pollution/history" as const,
      responses: {
        200: z.array(z.custom<typeof pollutionData.$inferSelect>()),
      },
    },
  },

  /* ================= Flood Engine ================= */

  flood: {
    current: {
      method: "GET" as const,
      path: "/api/flood/current" as const,
      responses: {
        200: z.array(z.custom<typeof floodData.$inferSelect>()),
      },
    },

    history: {
      method: "GET" as const,
      path: "/api/flood/history" as const,
      responses: {
        200: z.array(z.custom<typeof floodData.$inferSelect>()),
      },
    },

    mock: {
      method: "POST" as const,
      path: "/api/flood/mock" as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },

  /* ================= City Health ================= */

  cityHealth: {
    current: {
      method: "GET" as const,
      path: "/api/city-health/current" as const,
      responses: {
        200: z.array(z.custom<typeof cityHealthScore.$inferSelect>()),
      },
    },

    history: {
      method: "GET" as const,
      path: "/api/city-health/history" as const,
      responses: {
        200: z.array(z.custom<typeof cityHealthScore.$inferSelect>()),
      },
    },

    recalculate: {
      method: "POST" as const,
      path: "/api/city-health/recalculate" as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },

  /* ================= Predictions ================= */

  predictions: {
    list: {
      method: "GET" as const,
      path: "/api/predictions" as const,
      input: z
        .object({
          type: z.enum(["traffic", "pollution"]).optional(),
        })
        .optional(),
      responses: {
        200: z.array(z.custom<typeof predictions.$inferSelect>()),
      },
    },
  },

  /* ================= Alerts ================= */

  alerts: {
    list: {
      method: "GET" as const,
      path: "/api/alerts" as const,
      responses: {
        200: z.array(z.custom<typeof alerts.$inferSelect>()),
      },
    },
  },

  /* ================= Crime ================= */

  crime: {
    list: {
      method: "GET" as const,
      path: "/api/crime" as const,
      responses: {
        200: z.array(z.custom<typeof crimeIncidents.$inferSelect>()),
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/crime" as const,
      input: insertCrimeSchema,
      responses: {
        201: z.custom<typeof crimeIncidents.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },

  /* ================= Hospital ================= */

  hospital: {
    list: {
      method: "GET" as const,
      path: "/api/hospital" as const,
      responses: {
        200: z.array(z.custom<typeof hospitals.$inferSelect>()),
      },
    },

    update: {
      method: "PUT" as const,
      path: "/api/hospital/:id" as const,
      input: insertHospitalSchema.partial(),
      responses: {
        200: z.custom<typeof hospitals.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  /* ================= Zone Risk ================= */

  risk: {
    list: {
      method: "GET" as const,
      path: "/api/risk" as const,
      responses: {
        200: z.array(z.custom<typeof zoneRisks.$inferSelect>()),
      },
    },
  },
};

/* =================================================
   URL BUILDER
================================================= */

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {

  let url = path;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }

  return url;
}

/* =================================================
   WEBSOCKET EVENTS
================================================= */

export const ws = {
  events: {
    DATA_UPDATE: "data_update",
    ALERT_NEW: "alert_new",
    FLOOD_ALERT: "flood_alert",
    CITY_HEALTH_ALERT: "city_health_alert",
    CRIME_UPDATE: "crime_update",
    HOSPITAL_UPDATE: "hospital_update",
    PREDICTION_UPDATE: "prediction_update",
  },
};