import axios from "axios";
import { storage } from "../storage";

/* =====================================================
   LOCATIONS
===================================================== */

const DELHI_LOCATIONS = [
  { name: "Connaught Place", lat: 28.6304, lng: 77.2177 },
  { name: "Indira Gandhi Airport", lat: 28.5562, lng: 77.1 },
  { name: "India Gate", lat: 28.6129, lng: 77.2295 },
  { name: "Hauz Khas", lat: 28.5494, lng: 77.2001 },
  { name: "Chandni Chowk", lat: 28.6505, lng: 77.2303 },
];

/* =====================================================
   REAL TRAFFIC FETCHER (FINAL)
===================================================== */

export async function fetchRealTraffic() {
  try {
    const results = await Promise.all(
      DELHI_LOCATIONS.map(async (loc) => {
        try {
          const url =
            "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json";

          const res = await axios.get(url, {
            params: {
              point: `${loc.lat},${loc.lng}`,
              key: process.env.TOMTOM_API_KEY,
            },
            timeout: 5000,
          });

          const flow = res?.data?.flowSegmentData;

          if (!flow) return null;

          /* =====================================================
             ✅ FINAL REALISTIC CONGESTION CALCULATION
          ===================================================== */

          let congestion = 0;

          if (flow.currentSpeed < flow.freeFlowSpeed) {
            congestion =
              ((flow.freeFlowSpeed - flow.currentSpeed) / flow.freeFlowSpeed) *
              10;
          }

          /* 🔹 slight boost so trend visible but still real */
          congestion = Math.max(congestion * 1.5, 0);

          congestion = Number(congestion.toFixed(2));

          /* ===================================================== */

          const traffic = await storage.createTrafficData({
            locationId: loc.name,
            vehicleDensity: Math.round(flow.currentSpeed),
            congestionIndex: congestion,
            timestamp: new Date(),
          });

          console.log(`🚦 REAL TRAFFIC STORED: ${loc.name}`, traffic);

          return traffic;
        } catch (err: any) {
          console.error(`❌ Traffic API error (${loc.name})`, err.message);
          return null;
        }
      }),
    );

    return results.filter(Boolean);
  } catch (err) {
    console.error("❌ Traffic engine failed:", err);
    return [];
  }
}
