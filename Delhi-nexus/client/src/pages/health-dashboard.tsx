import maplibregl from "maplibre-gl";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

import {
  useCurrentCityHealth,
  useCityHealthHistory,
  useRecalculateHealth,
} from "@/hooks/use-health";

import {
  HeartPulse,
  Wind,
  Car,
  ShieldAlert,
  RefreshCcw,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useMemo } from "react";

/* STORE */
import { useResilienceStore } from "@/store/resilienceStore";

/* ZONES */
import { NCR_ZONES } from "@/components/map/MapContainer";

const DELHI_CENTER = { longitude: 77.209, latitude: 28.6139, zoom: 10 };

export default function HealthDashboard() {
  /* ================= STORE ================= */

  const hospitals = useResilienceStore((s) => s.hospitals);
  const crimes = useResilienceStore((s) => s.crimes);
  const floods = useResilienceStore((s) => s.floods);

  const { data: apiHealth, isLoading: loadingCurrent } = useCurrentCityHealth();
  const { data: historyData, isLoading: loadingHistory } =
    useCityHealthHistory();

  const { mutate: recalculate, isPending: recalculating } =
    useRecalculateHealth();

  /* ================= AQI ================= */

  const { data: pollutionData } = useQuery({
    queryKey: [api.pollution.current.path],
    queryFn: async () => {
      const res = await fetch(api.pollution.current.path);
      if (!res.ok) throw new Error("Pollution fetch failed");
      return res.json();
    },
  });

  const aqiScore = useMemo(() => {
    if (!pollutionData?.length) return 50;

    const latestByZone = Object.values(
      pollutionData.reduce((acc: any, curr: any) => {
        if (
          !acc[curr.locationId] ||
          new Date(curr.timestamp) > new Date(acc[curr.locationId].timestamp)
        ) {
          acc[curr.locationId] = curr;
        }
        return acc;
      }, {}),
    );

    const avg =
      latestByZone.reduce((sum: number, item: any) => sum + item.aqi, 0) /
      latestByZone.length;

    return Math.round(avg);
  }, [pollutionData]);

  /* ✅ Normalize AQI */

  const normalizedAQI = useMemo(() => {
    if (aqiScore <= 50) return 100;
    if (aqiScore <= 100) return 85;
    if (aqiScore <= 200) return 65;
    if (aqiScore <= 300) return 45;
    if (aqiScore <= 400) return 25;
    return 10;
  }, [aqiScore]);

  /* ================= TRAFFIC ================= */

  const { data: trafficData } = useQuery({
    queryKey: [api.traffic.current.path],
    queryFn: async () => {
      const res = await fetch(api.traffic.current.path);
      if (!res.ok) throw new Error("Traffic fetch failed");
      return res.json();
    },
  });

  const trafficScore = useMemo(() => {
    if (!trafficData?.length) return 40;

    const latestByZone = Object.values(
      trafficData.reduce((acc: any, curr: any) => {
        if (
          !acc[curr.locationId] ||
          new Date(curr.timestamp) > new Date(acc[curr.locationId].timestamp)
        ) {
          acc[curr.locationId] = curr;
        }
        return acc;
      }, {}),
    );

    const avgDensity =
      latestByZone.reduce(
        (sum: number, item: any) => sum + item.vehicleDensity,
        0,
      ) / latestByZone.length;

    return Math.round(Math.min(100, avgDensity * 1.5));
  }, [trafficData]);

  /* ================= CRIME ================= */

  const crimeScore = useMemo(() => {
    if (!crimes.length) return 70;

    const recent = crimes.filter(
      (c: any) => Date.now() - new Date(c.timestamp).getTime() < 60 * 60 * 1000,
    );

    const severityScore = recent.reduce((sum: number, c: any) => {
      if (c.severity === "high") return sum + 20;
      if (c.severity === "medium") return sum + 10;
      return sum + 5;
    }, 0);

    return Math.max(20, 100 - severityScore);
  }, [crimes]);

  /* ================= COMPOSITE ================= */

  const currentData = useMemo(() => {
    if (!hospitals.length) return apiHealth || [];

    return hospitals.map((h: any) => {
      const hospitalScore = h.compositeScore || 0;

      const floodScore =
        floods.length > 0
          ? Math.max(...floods.map((f: any) => Number(f.floodProbability || 0)))
          : 20;

      const composite =
        normalizedAQI * 0.3 +
        trafficScore * 0.2 +
        crimeScore * 0.2 +
        floodScore * 0.15 +
        hospitalScore * 0.15;

      let status = "healthy";
      if (composite < 60) status = "critical";
      else if (composite < 75) status = "moderate";

      return {
        ...h,
        compositeScore: Math.round(composite),
        crimeScore,
        trafficScore,
        aqiScore,
        status,
      };
    });
  }, [
    hospitals,
    floods,
    apiHealth,
    normalizedAQI,
    trafficScore,
    crimeScore,
    aqiScore,
  ]);

  /* ================= KPI ================= */

  const avgComposite = useMemo(() => {
    if (!currentData?.length) return 0;
    return (
      currentData.reduce(
        (acc: any, curr: any) => acc + curr.compositeScore,
        0,
      ) / currentData.length
    );
  }, [currentData]);

  /* ================= LOADING ================= */

  if (loadingCurrent || loadingHistory) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-secondary rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">City Health Score</h1>
          <p className="text-muted-foreground text-sm font-mono">
            Aggregated Metrics • Real-time System View
          </p>
        </div>

        <Button onClick={() => recalculate()} disabled={recalculating}>
          <RefreshCcw
            className={`w-4 h-4 mr-2 ${recalculating ? "animate-spin" : ""}`}
          />
          Recalculate
        </Button>
      </div>

      {/* KPI */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Overall Health Score"
          value={`${avgComposite.toFixed(1)}/100`}
          icon={<HeartPulse />}
          trend="Composite Score"
        />
        <KpiCard
          title="Avg AQI Score"
          value={aqiScore}
          icon={<Wind />}
          trend="Environmental Load"
        />
        <KpiCard
          title="Traffic Load"
          value={`${trafficScore}%`}
          icon={<Car />}
          trend="Mobility Pressure"
        />
        <KpiCard
          title="Safety Index"
          value={crimeScore}
          icon={<ShieldAlert />}
          trend="Law Enforcement Load"
        />
      </div>

      {/* MAP */}

      <Card className="h-[500px]">
        <div className="p-4 border-b flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Sector Health Index
        </div>

        <Map
          initialViewState={DELHI_CENTER}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          mapLib={maplibregl}
          style={{ width: "100%", height: "100%" }}
        >
          {currentData?.map((point: any, idx: number) => {
            const zone = NCR_ZONES.find((z) =>
              z.name.toLowerCase().includes(point.name?.toLowerCase() || ""),
            );

            if (!zone) return null;

            let color = "#ef4444";
            if (point.compositeScore >= 80) color = "#22c55e";
            else if (point.compositeScore >= 60) color = "#eab308";

            return (
              <Marker key={idx} longitude={zone.lng} latitude={zone.lat}>
                <div className="relative flex items-center justify-center">
                  {/* Pulse */}
                  <span className="absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-50 animate-ping"></span>

                  {/* Marker */}
                  <div
                    className="px-2 py-1 text-xs font-bold rounded-md text-white relative"
                    style={{ background: color }}
                  >
                    {Math.round(point.compositeScore)}
                  </div>
                </div>
              </Marker>
            );
          })}
        </Map>
      </Card>
    </div>
  );
}

/* KPI CARD */

function KpiCard({ title, value, icon, trend }: any) {
  return (
    <Card className="p-5">
      <div className="flex justify-between mb-4">{icon}</div>
      <h4 className="text-muted-foreground text-sm">{title}</h4>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-2">{trend}</p>
    </Card>
  );
}
