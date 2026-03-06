import { useDashboardOverview } from "@/hooks/use-dashboard";
import { StatCard } from "@/components/stat-card";
import { CityMap } from "@/components/city-map";
import { Wind, Car, CloudRain, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";

const socket = io("http://localhost:5000");

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardOverview();

  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[500px] w-full rounded-2xl mb-8" />
      </>
    );
  }

  if (error || !data) {
    return (
     <>
        <div className="flex h-full items-center justify-center text-red-400">
          Failed to load dashboard data. Please try again.
        </div>
      </>
    );
  }

  // Calculate averages for stats
  const avgAqi = Math.round(data.pollution.reduce((acc, curr) => acc + curr.aqi, 0) / (data.pollution.length || 1));
  const avgCongestion = (data.traffic.reduce((acc, curr) => acc + curr.congestionIndex, 0) / (data.traffic.length || 1)).toFixed(1);
  const activeAlerts = data.alerts.filter(a => a.isActive === 1).length;

  // Prepare chart data (using mock history combined with current data for visual)
  const chartData = data.pollution.map((item, i) => ({
    time: format(new Date(Date.now() - (10 - i) * 3600000), 'HH:mm'),
    aqi: item.aqi,
    traffic: data.traffic[i % data.traffic.length]?.congestionIndex * 20 // Scale for visual
  }));

  return (
    <>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Avg. Air Quality (AQI)" 
          value={avgAqi} 
          subtitle="Moderate pollution levels"
          icon={Wind}
          trend="down"
          trendValue="12%"
          delay={0}
        />
        <StatCard 
          title="Traffic Congestion" 
          value={avgCongestion} 
          subtitle="Index (0-10)"
          icon={Car}
          trend="up"
          trendValue="0.4"
          delay={0.1}
        />
        <StatCard 
          title="Weather" 
          value={`${data.weather?.temperature ?? 0}°C`} 
          subtitle={`Humidity: ${data.weather?.humidity ?? 0}%`}
          icon={CloudRain}
          delay={0.2}
        />
        <StatCard 
          title="Active Alerts" 
          value={activeAlerts} 
          subtitle="System anomalies detected"
          icon={AlertTriangle}
          className={activeAlerts > 0 ? "border-red-500/30 bg-red-500/5" : ""}
          delay={0.3}
        />
      </div>

      {/* Main Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Live Monitoring Map</h2>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">Real-time</span>
            </div>
          </div>
          <CityMap 
            trafficData={data.traffic} 
            pollutionData={data.pollution} 
            // alerts={data.alerts.filter(a => a.isActive === 1)}
          />
        </div>

        {/* Side Panel: Recent Alerts & Quick Stats */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              Recent Alerts
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {data.alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded capitalize 
                      ${alert.severity === 'high' ? 'bg-red-500/20 text-red-400' : 
                        alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-green-500/20 text-green-400'}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">{format(new Date(alert.timestamp), 'HH:mm')}</span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{alert.locationId.replace('_', ' ')}</p>
                </div>
              ))}
              {data.alerts.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No active alerts
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="font-semibold mb-6">Traffic vs Pollution Correlation (24h)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="aqi" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorAqi)" name="AQI" />
              <Area type="monotone" dataKey="traffic" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" name="Traffic Load" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
