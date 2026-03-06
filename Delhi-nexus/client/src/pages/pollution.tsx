import { Layout } from "@/components/layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Wind } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { usePollutionHistory } from "@/hooks/use-dashboard";
import { useLivePollution } from "@/hooks/use-live-pollution";
import { Cell } from "recharts";

export default function PollutionPage() {

const { data: pollutionHistory, isLoading } = usePollutionHistory();

const [livePollution, setLivePollution] = useState<any[]>([]);
const [stableData, setStableData] = useState<any[]>([]);

function getAQIColor(pm25: number) {
  if (pm25 <= 12) return "#22c55e";       // Good (Green)
  if (pm25 <= 35) return "#eab308";       // Moderate (Yellow)
  if (pm25 <= 55) return "#f97316";       // Unhealthy for sensitive (Orange)
  if (pm25 <= 150) return "#ef4444";      // Unhealthy (Red)
  if (pm25 <= 250) return "#a855f7";      // Very Unhealthy (Purple)
  return "#7f1d1d";                       // Hazardous (Dark Red)
}

function pm25Status(v: number) {
  if (v <= 12) return { label: "Good", color: "text-green-400" };
  if (v <= 35) return { label: "Moderate", color: "text-yellow-400" };
  if (v <= 55) return { label: "Unhealthy (Sensitive)", color: "text-orange-400" };
  if (v <= 150) return { label: "Unhealthy", color: "text-red-400" };
  if (v <= 250) return { label: "Very Unhealthy", color: "text-purple-400" };
  return { label: "Hazardous", color: "text-red-700" };
}

function pm10Status(v: number) {
  if (v <= 50) return { label: "Good", color: "text-green-400" };
  if (v <= 150) return { label: "Moderate", color: "text-yellow-400" };
  if (v <= 250) return { label: "Unhealthy", color: "text-red-400" };
  return { label: "Hazardous", color: "text-red-700" };
}

function no2Status(v: number) {
  if (v <= 53) return { label: "Good", color: "text-green-400" };
  if (v <= 100) return { label: "Moderate", color: "text-yellow-400" };
  if (v <= 360) return { label: "Unhealthy", color: "text-red-400" };
  return { label: "Hazardous", color: "text-red-700" };
}

// receive websocket updates
useLivePollution((incoming: any) => {

  if (!incoming) return;

  // normalize to array
  const data = Array.isArray(incoming) ? incoming : [incoming];

  const valid = data.filter(
    (p: any) =>
      Number(p?.pm25) > 0 ||
      Number(p?.pm10) > 0 ||
      Number(p?.no2) > 0
  );

  if (valid.length > 0) {
    setLivePollution(valid);
  }

});

// maintain last valid dataset
useEffect(() => {


const source =
  livePollution.length > 0
    ? livePollution
    : pollutionHistory || [];

if (source.length > 0) {
  setStableData(source);
}


}, [livePollution, pollutionHistory]);

if (isLoading && stableData.length === 0) {
return <Skeleton className="h-96 w-full rounded-2xl" />;
}

const chartData = stableData.slice(0, 20).map((item: any) => {

  const pm25 = Number(item.pm25) || 0;

  return {
    location: (item.locationId || "Unknown").substring(0, 10),
    pm25,
    pm10: Number(item.pm10) || 0,
    no2: Number(item.no2) || 0,
    color: getAQIColor(pm25)
  };

});

const avgPM25 =
  chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.pm25, 0) / chartData.length)
    : 0;

const avgPM10 =
  chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.pm10, 0) / chartData.length)
    : 0;

const avgNO2 =
  chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.no2, 0) / chartData.length)
    : 0;


return (
<> <div className="flex items-center justify-between mb-8"> <div> <h1 className="text-3xl font-bold font-display">Air Quality Index</h1> <p className="text-muted-foreground">
Monitor pollutant levels across the city </p> </div>

```
    <div className="bg-primary/10 p-3 rounded-full">
      <Wind className="w-8 h-8 text-primary" />
    </div>
  </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

  {/* PM2.5 */}
  <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-red-500">
    <h3 className="text-sm font-medium text-muted-foreground">
      PM 2.5 Average
    </h3>

    <div className="text-3xl font-bold mt-2">
      {avgPM25} µg/m³
    </div>

    <span
      className={`text-xs font-medium mt-1 inline-block ${pm25Status(avgPM25).color}`}
    >
      {pm25Status(avgPM25).label}
    </span>
  </div>


  {/* PM10 */}
  <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-yellow-500">
    <h3 className="text-sm font-medium text-muted-foreground">
      PM 10 Average
    </h3>

    <div className="text-3xl font-bold mt-2">
      {avgPM10} µg/m³
    </div>

    <span
      className={`text-xs font-medium mt-1 inline-block ${pm10Status(avgPM10).color}`}
    >
      {pm10Status(avgPM10).label}
    </span>
  </div>


  {/* NO2 */}
  <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-green-500">
    <h3 className="text-sm font-medium text-muted-foreground">
      NO2 Average
    </h3>

    <div className="text-3xl font-bold mt-2">
      {avgNO2} ppb
    </div>

    <span
      className={`text-xs font-medium mt-1 inline-block ${no2Status(avgNO2).color}`}
    >
      {no2Status(avgNO2).label}
    </span>
  </div>

</div>

  <div className="glass-panel p-6 rounded-2xl mb-8">
    <h3 className="font-semibold mb-6">
      Pollutant Composition by Location
    </h3>

    <div className="h-[450px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.1)"
            vertical={false}
          />

          <XAxis
            dataKey="location"
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
            }}
          />

          <Legend />

        <Bar
        dataKey="pm25"
        name="PM 2.5"
        radius={[4,4,0,0]}
        fill="#8884d8"
      >
        {chartData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Bar>
          <Bar dataKey="pm10" fill="#fbbf24" name="PM 10" radius={[4,4,0,0]} />
          <Bar dataKey="no2" fill="#60a5fa" name="NO2" radius={[4,4,0,0]} />

        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
</>


);
}
