import axios from "axios";
import { storage } from "../storage";

const DELHI_LOCATIONS = [
  { name: "Connaught Place", lat: 28.6304, lng: 77.2177 },
  { name: "Indira Gandhi Airport", lat: 28.5562, lng: 77.1000 },
  { name: "India Gate", lat: 28.6129, lng: 77.2295 },
  { name: "Hauz Khas", lat: 28.5494, lng: 77.2001 },
  { name: "Chandni Chowk", lat: 28.6505, lng: 77.2303 }
];

export async function fetchRealTraffic() {

  const results = [];

  for (const loc of DELHI_LOCATIONS) {

    try {

      const url =
        `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${loc.lat},${loc.lng}&key=${process.env.TOMTOM_API_KEY}`;

      const res = await axios.get(url);

      const flow = res.data.flowSegmentData;

      const congestion =
        ((flow.freeFlowSpeed - flow.currentSpeed) / flow.freeFlowSpeed) * 10;

      const traffic = await storage.createTrafficData({
        locationId: loc.name,
        vehicleDensity: flow.currentSpeed,
        congestionIndex: Number(congestion.toFixed(2)),
        timestamp: new Date()
      });

      results.push(traffic);

    } catch (err) {

      console.error(`Traffic API error for ${loc.name}`, err);

    }

  }

  return results;
}