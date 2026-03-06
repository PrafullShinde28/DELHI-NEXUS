import axios from "axios"
import { broadcast } from "../ws-crime"

import { db } from "../db"
import { floodEvents} from "shared/schema.ts";

// Delhi monitoring zones
const locations = [
  { name: "Connaught Place", lat: 28.6315, lon: 77.2167 },
  { name: "Rohini", lat: 28.7495, lon: 77.0565 },
  { name: "Dwarka", lat: 28.5921, lon: 77.0460 },
  { name: "Saket", lat: 28.5245, lon: 77.2066 },
  { name: "Karol Bagh", lat: 28.6519, lon: 77.1909 },
  { name: "Lajpat Nagar", lat: 28.5677, lon: 77.2431 },
  { name: "Noida", lat: 28.5355, lon: 77.3910 },
  { name: "Ghaziabad", lat: 28.6692, lon: 77.4538 },
  { name: "Gurugram", lat: 28.4595, lon: 77.0266 },
  { name: "Chandni Chowk", lat: 28.6562, lon: 77.2303 }
]

// Fetch rainfall from Open-Meteo
async function fetchRain(lat: number, lon: number) {

  const res = await axios.get(
    "https://api.open-meteo.com/v1/forecast",
    {
      params: {
        latitude: lat,
        longitude: lon,
        current: "rain"
      }
    }
  )

  return res.data.current?.rain || 0
}

// Flood monitoring service
export async function startFloodMonitoring() {

  console.log("Flood monitoring started")

  setInterval(async () => {

    for (const location of locations) {

      const rain = await fetchRain(location.lat, location.lon)

      const event = {
        locationName: location.name,
        latitude: location.lat,
        longitude: location.lon,
        floodProbability: rain * 3,
        rainfallIntensity: rain,
        waterLevel: 40 + rain,
        drainageCapacity: 100 - rain,
        riskLevel: rain > 30 ? "critical"
                  : rain > 20 ? "high"
                  : rain > 10 ? "moderate"
                  : "low"
      }

      // 1️⃣ Save to database
      await db.insert(floodEvents).values(event)

      // 2️⃣ Broadcast to dashboard
      broadcast({
        type: "flood",
        payload: event
      })

    }

  }, 60000) // update every 60 seconds

}