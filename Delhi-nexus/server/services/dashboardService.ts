import axios from "axios";

const OPENAQ_URL = "https://api.openaq.org/v2/latest?city=Delhi&limit=20";
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current_weather=true&hourly=relativehumidity_2m,precipitation";

export async function getDashboardData() {
  try {
    // AQI DATA
    const pollutionRes = await axios.get(OPENAQ_URL);

    const pollution = pollutionRes.data.results.map((item: any) => ({
      locationId: item.location.replace(/\s+/g, "_").toLowerCase(),
      aqi: item.measurements?.[0]?.value || 0,
      lat: item.coordinates?.latitude,
      lon: item.coordinates?.longitude
    }));

    // WEATHER DATA
    const weatherRes = await axios.get(WEATHER_URL);

    const weather = {
      temperature: weatherRes.data.current_weather.temperature,
      humidity:
        weatherRes.data.hourly.relativehumidity_2m?.[0] ?? 40
    };

    // MOCK TRAFFIC (since free APIs limited)
    const traffic = pollution.slice(0, 10).map((p: any) => ({
      locationId: p.locationId,
      congestionIndex: Number((Math.random() * 10).toFixed(1))
    }));

    // ALERT LOGIC
    const alerts: any[] = [];

    pollution.forEach((p: any, i: number) => {
      if (p.aqi > 200) {
        alerts.push({
          id: i,
          severity: "high",
          message: "Severe air pollution detected",
          locationId: p.locationId,
          timestamp: new Date().toISOString(),
          isActive: 1
        });
      }
    });

    if (weather.temperature > 38) {
      alerts.push({
        id: 999,
        severity: "medium",
        message: "Heatwave conditions",
        locationId: "delhi_center",
        timestamp: new Date().toISOString(),
        isActive: 1
      });
    }

    return {
      pollution,
      traffic,
      weather,
      alerts
    };
  } catch (error) {
    console.error("Dashboard fetch error", error);
    throw error;
  }
}