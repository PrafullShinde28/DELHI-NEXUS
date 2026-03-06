import { crimeDataset } from "../data/delhiCrimeData"
import { broadcast } from "../ws-crime"

function randomItem(arr:any) {
return arr[Math.floor(Math.random() * arr.length)]
}

function generateCrimeEvent() {

const base = randomItem(crimeDataset)

const probability = Math.random()

let riskLevel = "low"

if (probability > 0.8) riskLevel = "critical"
else if (probability > 0.6) riskLevel = "high"
else if (probability > 0.4) riskLevel = "moderate"

return {
    type: "crime",
    payload: {
      id: Date.now(),
      lat: base.latitude,
      lng: base.longitude,
      zone: base.locationName,
      crimeType: base.crimeType,
      severity: Math.ceil(Math.random() * 5),
      incidentCount: 1 + Math.floor(Math.random() * 3),
      riskScore: Math.random() * 100,
      timestamp: new Date().toISOString()
    }
  }
}

export function startCrimeEngine() {

setInterval(() => {


const event = generateCrimeEvent()

broadcast(event)


}, 3000)

}
