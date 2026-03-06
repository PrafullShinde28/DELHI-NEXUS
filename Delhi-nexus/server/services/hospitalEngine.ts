import axios from "axios";
import { Server as SocketIOServer } from "socket.io";

/* ===================================================== */
/* CONFIG */
/* ===================================================== */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const DELHI_REALTIME_API = "https://corona.delhi.gov.in/api/hospital-beds";

/* ===================================================== */
/* TYPES */
/* ===================================================== */

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

type DelhiRealtimeHospital = {
  hospital_name: string;
  total_beds?: string | number;
  total_beds_available?: string | number;
  total_icu_beds_available?: string | number;
};

/* ===================================================== */
/* CACHE */
/* ===================================================== */

let hospitalsCache: Hospital[] = [];

/* ===================================================== */
/* FETCH OSM HOSPITALS */
/* ===================================================== */

export async function initHospitals() {
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
    const res = await axios.post(OVERPASS_URL, query, {
      headers: { "Content-Type": "text/plain" },
      timeout: 20000,
    });

    hospitalsCache = res.data.elements
      .map((h: any) => ({
        hospitalName: h.tags?.name || "Unknown Hospital",
        latitude: h.lat || h.center?.lat,
        longitude: h.lon || h.center?.lon,
        osmId: h.id,
      }))
      .filter((h: Hospital) => h.latitude && h.longitude)
      .slice(0, 120);

    console.log("Hospitals loaded:", hospitalsCache.length);
  } catch {
    console.warn("OSM failed → fallback hospitals used");

    hospitalsCache = [
      {
        hospitalName: "AIIMS Delhi",
        latitude: 28.5672,
        longitude: 77.21,
        osmId: 1,
      },
      {
        hospitalName: "Safdarjung Hospital",
        latitude: 28.5703,
        longitude: 77.2058,
        osmId: 2,
      },
      {
        hospitalName: "RML Hospital",
        latitude: 28.6288,
        longitude: 77.2086,
        osmId: 3,
      },
    ];
  }
}

/* ===================================================== */
/* MERGE REALTIME + SIMULATION */
/* ===================================================== */

async function fetchRealtimeHospitalData(): Promise<HospitalEvent[]> {
  try {
    const res = await axios.get(DELHI_REALTIME_API, { timeout: 15000 });

    const apiHospitals: DelhiRealtimeHospital[] = res.data?.data || [];

    const apiMap = new Map<string, DelhiRealtimeHospital>(
      apiHospitals.map((h) => [h.hospital_name?.toLowerCase(), h]),
    );

    return hospitalsCache.map((osmHospital) => {
      const match = apiMap.get(osmHospital.hospitalName.toLowerCase());

      let availableBeds = 0;
      let icuBeds = 0;
      let emergencyLoad = 0;

      if (match) {
        const totalBeds = Number(match.total_beds || 0);
        availableBeds = Number(match.total_beds_available || 0);
        icuBeds = Number(match.total_icu_beds_available || 0);

        emergencyLoad =
          totalBeds > 0 ? Math.round((1 - availableBeds / totalBeds) * 100) : 0;
      } else {
        const load = Math.round(50 + Math.random() * 40);
        emergencyLoad = load;

        availableBeds = Math.round(150 * (1 - load / 100));
        icuBeds = Math.round(20 * (1 - load / 100));
      }

      return {
        ...osmHospital,
        availableBeds,
        icuBeds,
        emergencyLoad,
        riskLevel: emergencyLoad > 75 ? "critical" : "normal",
        timestamp: Date.now(),
      };
    });
  } catch {
    return hospitalsCache.map((h) => {
      const load = Math.round(50 + Math.random() * 40);

      return {
        ...h,
        availableBeds: Math.round(150 * (1 - load / 100)),
        icuBeds: Math.round(20 * (1 - load / 100)),
        emergencyLoad: load,
        riskLevel: load > 75 ? "critical" : "normal",
        timestamp: Date.now(),
      };
    });
  }
}

/* ===================================================== */
/* START REALTIME LOOP */
/* ===================================================== */

export function startHospitalMonitoring(io: SocketIOServer) {
  console.log("Hospital monitoring started");

  setInterval(async () => {
    const events = await fetchRealtimeHospitalData();

    console.log("Broadcast hospital_update:", events.length);

    io.emit("hospital_update", events);
  }, 30000);
}
