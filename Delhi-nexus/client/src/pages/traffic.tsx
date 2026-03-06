import { useTrafficHistory } from "@/hooks/use-dashboard";
import { Layout } from "@/components/layout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { Car } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrafficPage() {
  const { data: trafficHistory, isLoading } = useTrafficHistory();

  if (isLoading) {
    return (
      <>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
     </>
    );
  }

  // Group data by location for multiple lines
  // Note: This assumes data comes flattened, logic might need adjustment based on exact API response shape
  const chartData = trafficHistory?.slice(0, 50).map(item => ({
    time: format(new Date(item.timestamp), 'HH:mm'),
    congestion: item.congestionIndex,
    density: item.vehicleDensity
  })) || [];

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Traffic Analytics</h1>
          <p className="text-muted-foreground">Deep dive into vehicle density and congestion patterns</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-full">
          <Car className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium mb-1">Peak Congestion Times</h3>
          <div className="text-4xl font-bold font-display text-red-400">08:30 AM</div>
          <p className="text-sm text-muted-foreground mt-2">Average index hits 8.5/10</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium mb-1">Total Vehicle Flow</h3>
          <div className="text-4xl font-bold font-display text-blue-400">12,450</div>
          <p className="text-sm text-muted-foreground mt-2">Vehicles recorded in last hour</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl mb-8">
        <h3 className="font-semibold mb-6">Congestion Trends</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
              />
              <Line type="monotone" dataKey="congestion" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-semibold">Location Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground bg-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Location ID</th>
                <th className="px-6 py-4 font-medium">Congestion Index</th>
                <th className="px-6 py-4 font-medium">Vehicle Density</th>
                <th className="px-6 py-4 font-medium">Last Updated</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trafficHistory?.slice(0, 5).map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium capitalize">{row.locationId}</td>
                  <td className="px-6 py-4">{row.congestionIndex.toFixed(1)}</td>
                  <td className="px-6 py-4">{row.vehicleDensity}</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{format(new Date(row.timestamp), 'HH:mm:ss')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.congestionIndex > 7 ? 'bg-red-500/20 text-red-400' : 
                      row.congestionIndex > 4 ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {row.congestionIndex > 7 ? 'High' : row.congestionIndex > 4 ? 'Moderate' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
