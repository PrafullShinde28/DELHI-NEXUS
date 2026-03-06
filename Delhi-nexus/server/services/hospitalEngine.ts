import axios from "axios";
import WebSocket from "ws";
import { wss } from "../ws-crime";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

type Hospital = {
  hospitalName: string;
  latitude: number;
  longitude: number;
  osmId: number;
};

type HospitalEvent = Hospital & {
  availableBeds: number;
  icuBeds: number;
  emergencyLoad: number;
  riskLevel: "normal" | "critical";
  timestamp: number;
};

let hospitalsCache: Hospital[] = [];

/* ---------------- FETCH REAL HOSPITALS ---------------- */

export async function fetchDelhiHospitals(): Promise<Hospital[]> {

  const query = `
  [out:json][timeout:25];
  area["name"="Delhi"]->.searchArea;
  (
    node["amenity"="hospital"](area.searchArea);
    way["amenity"="hospital"](area.searchArea);
  );
  out center;
  `;

  try {

    const response = await axios.post(OVERPASS_URL, query, {
      headers: { "Content-Type": "text/plain" },
      timeout: 20000
    });

    const hospitals: Hospital[] = response.data.elements
      .map((h: any) => ({
        hospitalName: h.tags?.name || "Unknown Hospital",
        latitude: h.lat || h.center?.lat,
        longitude: h.lon || h.center?.lon,
        osmId: h.id
      }))
      .filter((h: Hospital) => h.latitude && h.longitude);

    /* remove duplicates */

    const unique = Array.from(
      new Map(hospitals.map(h => [h.osmId, h])).values()
    );

    console.log(`Fetched ${unique.length} hospitals from OSM`);

    return unique.slice(0, 120);

  } catch (err: any) {

    console.error("Hospital API failed:", err.message);
    return [];

  }

}

/* ---------------- INITIALIZE CACHE ---------------- */

export async function initHospitals() {

  hospitalsCache = await fetchDelhiHospitals();

  if (hospitalsCache.length === 0) {

    console.warn("Using fallback hospitals");

    hospitalsCache = [
      {
        hospitalName: "AIIMS Delhi",
        latitude: 28.5672,
        longitude: 77.2100,
        osmId: 1
      },
      {
        hospitalName: "Safdarjung Hospital",
        latitude: 28.5703,
        longitude: 77.2058,
        osmId: 2
      },
      {
        hospitalName: "Ram Manohar Lohia Hospital",
        latitude: 28.6288,
        longitude: 77.2086,
        osmId: 3
      }
    ];

  }

  console.log(`Loaded hospitals: ${hospitalsCache.length}`);

}

/* ---------------- GET CACHE ---------------- */

export function getHospitals(): Hospital[] {
  return hospitalsCache;
}

/* ---------------- GENERATE METRICS ---------------- */

function generateHospitalMetrics(hospital: Hospital): HospitalEvent {

  const emergencyLoad = Math.floor(Math.random() * 100);

  return {
    ...hospital,
    availableBeds: Math.floor(Math.random() * 120),
    icuBeds: Math.floor(Math.random() * 20),
    emergencyLoad,
    riskLevel: emergencyLoad > 75 ? "critical" : "normal",
    timestamp: Date.now()
  };

}

/* ---------------- START MONITORING ---------------- */

export function startHospitalMonitoring() {

  console.log("Hospital monitoring started");

  setInterval(() => {

    const hospitals = getHospitals();

    if (!hospitals.length) return;

    const hospitalEvents = hospitals.map(generateHospitalMetrics);

    console.log("Broadcasting hospital update:", hospitalEvents.length);

    wss.clients.forEach((client: WebSocket) => {

      if (client.readyState === WebSocket.OPEN) {

        try {

          client.send(JSON.stringify({
            type: "hospital_update",
            data: hospitalEvents
          }));

        } catch (err) {

          console.error("WebSocket send error:", err);

        }

      }

    });

  }, 30000);

}