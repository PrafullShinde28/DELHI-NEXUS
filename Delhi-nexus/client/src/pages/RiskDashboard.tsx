import { useMemo ,useState,useEffect} from "react";
import { Hexagon, Zap, Shield, AlertCircle } from "lucide-react";
import { Source, Layer } from "react-map-gl";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import PageHeader from "@/components/layout/PageHeader";
import MapContainer, { NCR_ZONES } from "@/components/map/MapContainer";
import { useRiskData } from "@/hooks/use-risk";

export default function RiskDashboard() {
  type RiskEvent = {
  id: number;
  zone: string;
  trafficScore: number;
  aqiScore: number;
  crimeScore: number;
  hospitalScore: number;
  compositeScore: number;
};
 
 
const [risks, setRisks] = useState<RiskEvent[]>([]);
const isLoading = risks.length === 0;

  const getRiskColor = (score: number) => {
    if (score > 80) return "#f43f5e"; // destructive
    if (score > 60) return "#f59e0b"; // warning
    if (score > 40) return "#eab308"; // yellow
    return "#10b981"; // success
  };

  // Convert zones data into GeoJSON FeatureCollection for Mapbox circles
 const geoJsonData = useMemo(() => {
  if (!risks) return null;

  return {
    type: "FeatureCollection" as const,
    features: risks
      .map((risk) => {
        const zoneInfo = NCR_ZONES.find((z) => z.name === risk.zone);

        if (!zoneInfo || isNaN(zoneInfo.lat) || isNaN(zoneInfo.lng)) {
          return null;
        }

        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [zoneInfo.lng, zoneInfo.lat],
          },
          properties: {
            title: risk.zone,
            score: risk.compositeScore,
            color: getRiskColor(risk.compositeScore),
            radius: Math.max(20, risk.compositeScore / 1.5),
          },
        };
      })
      .filter(Boolean) as any,
  };
}, [risks]);

  const radarData = useMemo(() => {
    if (!risks) return [];
    // Average scores across all zones for macro view
    const avgs = risks.reduce(
      (acc, curr) => ({
        traffic: acc.traffic + curr.trafficScore,
        aqi: acc.aqi + curr.aqiScore,
        crime: acc.crime + curr.crimeScore,
        hospital: acc.hospital + curr.hospitalScore,
      }),
      { traffic: 0, aqi: 0, crime: 0, hospital: 0 },
    );

    const len = risks.length || 1;
    return [
      { subject: "Traffic", A: Math.round(avgs.traffic / len), fullMark: 100 },
      { subject: "Air Quality", A: Math.round(avgs.aqi / len), fullMark: 100 },
      { subject: "Crime", A: Math.round(avgs.crime / len), fullMark: 100 },
      {
        subject: "Health Load",
        A: Math.round(avgs.hospital / len),
        fullMark: 100,
      },
    ];
  }, [risks]);

  return (
    <div className="flex flex-col h-full bg-background relative">
      <PageHeader
        title="Multi-Risk Matrix"
        description="Composite threat profiling & environmental intelligence"
        icon={<Hexagon className="w-6 h-6 text-warning" />}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Map View */}
        <div className="flex-[3] relative border-r border-border/30">
          <MapContainer>
            {geoJsonData && (
              <Source id="risk-zones" type="geojson" data={geoJsonData}>
                <Layer
                  id="risk-circles"
                  type="circle"
                  paint={{
                    "circle-radius": ["get", "radius"],
                    "circle-color": ["get", "color"],
                    "circle-opacity": 0.4,
                    "circle-stroke-width": 2,
                    "circle-stroke-color": ["get", "color"],
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
                    "text-halo-color": "rgba(0,0,0,0.8)",
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}
          </MapContainer>

          <div className="absolute top-4 right-4 glass-panel p-4 rounded-xl w-64 border-t-2 border-t-warning">
            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" /> City-wide Threat Level
            </h4>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-display font-bold text-foreground">
                {isLoading
                  ? "..."
                  : Math.round(
                      risks?.reduce((a, b) => a + b.compositeScore, 0)! /
                        (risks?.length || 1) || 0,
                    )}
              </span>
              <span className="text-sm text-muted-foreground pb-1">/ 100</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-3">
              <div className="h-full bg-gradient-to-r from-success via-warning to-destructive w-[65%] shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            </div>
          </div>
        </div>

        {/* Dashboard Side Panel */}
        <div className="flex-[2] min-w-[400px] bg-card/40 backdrop-blur-md overflow-y-auto p-6 space-y-6">
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Sector Radar
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  data={radarData}
                >
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="NCR Average"
                    dataKey="A"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.4}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" /> Top
              Vulnerable Zones
            </h3>
            {isLoading ? (
              <div className="text-sm p-4">Analyzing sectors...</div>
            ) : (
              risks
                ?.sort((a, b) => b.compositeScore - a.compositeScore)
                .slice(0, 5)
                .map((risk, i) => (
                  <div
                    key={risk.id}
                    className="glass-panel p-4 rounded-xl flex items-center gap-4 group hover:bg-white/5 transition-colors"
                  >
                    <div className="text-2xl font-bold font-mono text-white/20 w-6">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground mb-1">
                        {risk.zone}
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-black/40 px-2 py-0.5 rounded border border-white/5 text-muted-foreground">
                          AQI: {Math.round(risk.aqiScore)}
                        </span>
                        <span className="bg-black/40 px-2 py-0.5 rounded border border-white/5 text-muted-foreground">
                          Crime: {Math.round(risk.crimeScore)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-xl font-display font-bold"
                        style={{ color: getRiskColor(risk.compositeScore) }}
                      >
                        {Math.round(risk.compositeScore)}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Index
                      </div>
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
