import { usePollutionHistory } from "@/hooks/use-dashboard";
import { Layout } from "@/components/layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from "date-fns";
import { Wind } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PollutionPage() {
  const { data: pollutionHistory, isLoading } = usePollutionHistory();

  if (isLoading) {
    return (
      <>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </>
    );
  }

  const chartData = pollutionHistory?.slice(0, 20).map(item => ({
    location: item.locationId.substring(0, 10),
    pm25: item.pm25,
    pm10: item.pm10,
    no2: item.no2,
    aqi: item.aqi
  })) || [];

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Air Quality Index</h1>
          <p className="text-muted-foreground">Monitor pollutant levels across the city</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-full">
          <Wind className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-red-500">
          <h3 className="text-sm font-medium text-muted-foreground">PM 2.5 Average</h3>
          <div className="text-3xl font-bold mt-2">145 µg/m³</div>
          <span className="text-xs text-red-400 font-medium mt-1 inline-block">Unhealthy</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-yellow-500">
          <h3 className="text-sm font-medium text-muted-foreground">PM 10 Average</h3>
          <div className="text-3xl font-bold mt-2">210 µg/m³</div>
          <span className="text-xs text-yellow-400 font-medium mt-1 inline-block">Moderate</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-green-500">
          <h3 className="text-sm font-medium text-muted-foreground">NO2 Average</h3>
          <div className="text-3xl font-bold mt-2">45 ppb</div>
          <span className="text-xs text-green-400 font-medium mt-1 inline-block">Good</span>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl mb-8">
        <h3 className="font-semibold mb-6">Pollutant Composition by Location</h3>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="location" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
              />
              <Legend />
              <Bar dataKey="pm25" fill="#f87171" name="PM 2.5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pm10" fill="#fbbf24" name="PM 10" radius={[4, 4, 0, 0]} />
              <Bar dataKey="no2" fill="#60a5fa" name="NO2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
   </>
  );
}
