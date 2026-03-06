import { useMemo, useEffect, useState } from "react";
import { Hexagon, Zap, Shield, AlertCircle } from "lucide-react";
import { Source, Layer } from "react-map-gl";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
} from "recharts";

import PageHeader from "@/components/layout/PageHeader";
import MapContainer, { NCR_ZONES } from "@/components/map/MapContainer";
import { useRiskData } from "@/hooks/use-risk";

/* ================= TYPES ================= */

type RiskEvent = {
  zone: string;
  trafficScore: number;
  aqiScore: number;
  crimeScore: number;
  hospitalScore: number;
  compositeScore: number | string;
};

export default function RiskDashboard() {
  const { data, isLoading } = useRiskData();
  const risks: RiskEvent[] = data || [];

  /* ================= HELPERS ================= */

  const getRiskColor = (score: number) => {
    if (score > 80) return "#f43f5e";
    if (score > 60) return "#f59e0b";
    if (score > 40) return "#eab308";
    return "#10b981";
  };

  /* ================= KPI ANIMATION ================= */

  const [animatedScore, setAnimatedScore] = useState(0);

  const avgThreat = Math.round(
    risks.reduce((a, b) => a + Number(b.compositeScore || 0), 0) /
      (risks.length || 1),
  );

  useEffect(() => {
    let frame: number;

    const animate = () => {
      setAnimatedScore((prev) => {
        if (prev >= avgThreat) return avgThreat;
        return prev + (avgThreat - prev) * 0.08;
      });

      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frame);
  }, [avgThreat]);

  /* ================= GEOJSON ================= */

  const geoJsonData = useMemo(() => {
    if (!risks.length) return null;

    return {
      type: "FeatureCollection" as const,
      features: risks
        .map((risk) => {
          const zoneInfo = NCR_ZONES.find((z) => z.name === risk.zone);

          if (!zoneInfo) return null;

          return {
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [zoneInfo.lng, zoneInfo.lat],
            },
            properties: {
              title: risk.zone,
              score: Math.round(Number(risk.compositeScore)),
              color: getRiskColor(Number(risk.compositeScore)),
              radius: Math.max(22, Number(risk.compositeScore) / 1.5),
            },
          };
        })
        .filter(Boolean) as any,
    };
  }, [risks]);

  /* ================= RADAR ================= */

  const radarData = useMemo(() => {
    if (!risks.length) return [];

    const len = risks.length;

    /* ===============================
     1️⃣ BASE AVERAGE
  =============================== */

    let traffic = 0;
    let aqi = 0;
    let crime = 0;
    let hospital = 0;

    risks.forEach((r) => {
      traffic += Number(r.trafficScore || 0);
      aqi += Number(r.aqiScore || 0);
      crime += Number(r.crimeScore || 0);
      hospital += Number(r.hospitalScore || 0);
    });

    traffic /= len;
    aqi /= len;
    crime /= len;
    hospital /= len;

    /* ===============================
     2️⃣ EXTREME ZONE BOOST
     (real command-center logic)
  =============================== */

    const maxTraffic = Math.max(...risks.map((r) => Number(r.trafficScore)));
    const maxAqi = Math.max(...risks.map((r) => Number(r.aqiScore)));
    const maxCrime = Math.max(...risks.map((r) => Number(r.crimeScore)));
    const maxHospital = Math.max(...risks.map((r) => Number(r.hospitalScore)));

    traffic += maxTraffic * 0.15;
    aqi += maxAqi * 0.15;
    crime += maxCrime * 0.15;
    hospital += maxHospital * 0.15;

    /* ===============================
     3️⃣ SYSTEM IMBALANCE SENSITIVITY
  =============================== */

    const spread =
      Math.max(traffic, aqi, crime, hospital) -
      Math.min(traffic, aqi, crime, hospital);

    const imbalanceBoost = spread * 0.12;

    traffic += imbalanceBoost;
    aqi += imbalanceBoost;
    crime += imbalanceBoost;
    hospital += imbalanceBoost;

    /* ===============================
     FINAL NORMALIZATION
  =============================== */

    const clamp = (n: number) => Math.min(100, Math.round(n));

    return [
      { subject: "Traffic", A: clamp(traffic) },
      { subject: "Air Quality", A: clamp(aqi) },
      { subject: "Crime", A: clamp(crime) },
      { subject: "Health Load", A: clamp(hospital) },
    ];
  }, [risks]);

  /* ================= UI ================= */

  return (
    <div className="flex flex-col h-full bg-background relative">
      <PageHeader
        title="Multi-Risk Matrix"
        description="Composite threat profiling & environmental intelligence"
        icon={<Hexagon className="w-6 h-6 text-warning" />}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* ================= MAP ================= */}
        <div className="flex-[3] relative border-r border-border/30">
          <MapContainer>
            {geoJsonData && (
              <Source id="risk-zones" type="geojson" data={geoJsonData}>
                <Layer
                  id="risk-circles"
                  type="circle"
                  paint={{
                    "circle-radius": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      8,
                      ["*", ["get", "radius"], 0.6],
                      12,
                      ["get", "radius"],
                    ],
                    "circle-color": ["get", "color"],
                    "circle-opacity": 0.35,
                    "circle-stroke-width": 2,
                    "circle-stroke-color": ["get", "color"],
                    "circle-blur": 0.2,
                  }}
                />

                <Layer
                  id="risk-labels"
                  type="symbol"
                  layout={{
                    "text-field": [
                      "concat",
                      ["get", "title"],
                      "\n",
                      ["get", "score"],
                    ],
                    "text-size": 12,
                    "text-anchor": "center",
                  }}
                  paint={{
                    "text-color": "#ffffff",
                    "text-halo-color": "rgba(0,0,0,0.85)",
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}
          </MapContainer>

          {/* KPI CARD */}
          <div className="absolute top-4 right-4 glass-panel p-5 rounded-xl w-64 border border-white/10 backdrop-blur-lg">
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              City-wide Threat Level
            </h4>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-display font-bold">
                {Math.round(animatedScore)}
              </span>
              <span className="text-sm text-muted-foreground pb-1">/100</span>
            </div>

            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{
                  width: `${animatedScore}%`,
                  background:
                    animatedScore > 80
                      ? "#f43f5e"
                      : animatedScore > 60
                        ? "#f59e0b"
                        : animatedScore > 40
                          ? "#eab308"
                          : "#10b981",
                }}
              />
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="flex-[2] min-w-[420px] bg-card/40 backdrop-blur-md overflow-y-auto p-6 space-y-6">
          {/* RADAR */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Sector Radar
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />

                  <Radar
                    dataKey="A"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.35}
                  />

                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TOP ZONES */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Top Vulnerable Zones
            </h3>

            {isLoading ? (
              <div className="text-sm p-4">Analyzing sectors...</div>
            ) : (
              [...risks]
                .sort(
                  (a, b) => Number(b.compositeScore) - Number(a.compositeScore),
                )
                .slice(0, 5)
                .map((risk, i) => (
                  <div
                    key={i}
                    className="glass-panel p-4 rounded-xl flex items-center gap-4 
                    hover:bg-white/5 transition-all duration-300 ease-out"
                  >
                    <div className="text-2xl font-bold text-white/20 w-6">
                      {i + 1}
                    </div>

                    <div className="flex-1 font-semibold">{risk.zone}</div>

                    <div
                      className="text-xl font-display font-bold"
                      style={{
                        color: getRiskColor(Number(risk.compositeScore)),
                      }}
                    >
                      {Math.round(Number(risk.compositeScore))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
