import { getDashboardData } from "./dashboardService";
import { generateAlert } from "./alertEngine";

export async function checkAlerts(io: any) {

  const dashboardData = await getDashboardData();

  /* ================= AQI ALERT ================= */

  for (const p of dashboardData.pollution) {

    if (p.aqi > 250) {

      await generateAlert(io, {
        type: "pollution",
        severity: "high",
        message: `Hazardous AQI detected (${p.aqi})`,
        locationId: p.locationId,
        isActive: 1
      });

    }

  }

  /* ================= TRAFFIC ALERT ================= */

  for (const t of dashboardData.traffic) {

    if (t.congestionIndex > 8) {

      await generateAlert(io, {
        type: "traffic",
        severity: "high",
        message: `Severe traffic congestion (${t.congestionIndex})`,
        locationId: t.locationId,
        isActive: 1
      });

    }

  }

  /* ================= FLOOD ALERT ================= */

  const rainfall = dashboardData.weather?.precipitation ?? 0;

  if (rainfall > 20) {

    await generateAlert(io, {
      type: "flood",
      severity: "high",
      message: `Heavy rainfall detected (${rainfall} mm)`,
      locationId: "delhi_center",
      isActive: 1
    });

  }

}