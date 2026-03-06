import axios from "axios"

export async function fetchDelhiWeather() {

  const res = await axios.get(
    "https://api.open-meteo.com/v1/forecast",
    {
      params: {
        latitude: 28.6139,
        longitude: 77.2090,
        current: "rain,precipitation"
      }
    }
  )

  return {
    rain: res.data.current?.rain || 0,
    precipitation: res.data.current?.precipitation || 0
  }
}