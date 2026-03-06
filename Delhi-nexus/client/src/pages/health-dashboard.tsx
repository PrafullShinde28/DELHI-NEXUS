import maplibregl from "maplibre-gl";
import Map, { Source, Layer, Marker, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  useCurrentCityHealth, 
  useCityHealthHistory, 
  useRecalculateHealth 
} from "@/hooks/use-health";
import { 
  Activity, 
  HeartPulse, 
  Wind, 
  Car, 
  ShieldAlert, 
  RefreshCcw,
  MapPin
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useMemo, useState, useEffect } from "react";


const DELHI_CENTER = { longitude: 77.2090, latitude: 28.6139, zoom: 10 };

export default function HealthDashboard() {
    const [liveHealth, setLiveHealth] = useState<any[]>([]);
  const { data: apiHealth, isLoading: loadingCurrent } = useCurrentCityHealth();
   const currentData = liveHealth.length ? liveHealth : apiHealth;
  const { data: historyData, isLoading: loadingHistory } = useCityHealthHistory();
  const { mutate: recalculate, isPending: recalculating } = useRecalculateHealth();
  const [hospitals, setHospitals] = useState<any[]>([]);

  useEffect(() => {

  const socket = new WebSocket("ws://localhost:8080");

  socket.onopen = () => {
    console.log("Connected to realtime server");
  };

  socket.onmessage = (event) => {

    const msg = JSON.parse(event.data);

    if (msg.type === "hospital_update") {

      const hospitalData = msg.data.map((h: any) => ({
        locationName: h.hospitalName,
        compositeScore: 100 - h.emergencyLoad,
        aqiScore: 80,
        trafficScore: 60,
        crimeScore: 70,
        status:
          h.emergencyLoad > 75 ? "critical"
          : h.emergencyLoad > 50 ? "moderate"
          : "healthy"
      }));

      setLiveHealth(hospitalData);

    }

  };

  return () => socket.close();

}, []);

  const avgComposite = useMemo(() => {
    if (!currentData || currentData.length === 0) return 0;
    return currentData.reduce((acc, curr) => acc + curr.compositeScore, 0) / currentData.length;
  }, [currentData]);

  const sortedHistory = useMemo(() => {
    if (!historyData) return [];
    return [...historyData].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [historyData]);

  const statusDistribution = useMemo(() => {
    if (!currentData) return [];
    const counts = { healthy: 0, moderate: 0, critical: 0 };
    currentData.forEach(d => {
      if (d.status === 'healthy') counts.healthy++;
      else if (d.status === 'moderate') counts.moderate++;
      else counts.critical++;
    });
    return [
      { name: 'Healthy', value: counts.healthy, color: '#22c55e' },
      { name: 'Moderate', value: counts.moderate, color: '#eab308' },
      { name: 'Critical', value: counts.critical, color: '#ef4444' },
    ];
  }, [currentData]);

  if (loadingCurrent || loadingHistory) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-secondary rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-secondary" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[500px] lg:col-span-2 rounded-xl bg-secondary" />
          <Skeleton className="h-[500px] rounded-xl bg-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">City Health Score</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Aggregated Metrics • Air, Traffic, Crime, Flood</p>
        </div>
        <Button 
          onClick={() => recalculate()} 
          disabled={recalculating}
          variant="outline"
          className="bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:text-accent transition-all hover:shadow-[0_0_15px_hsl(var(--accent)/0.3)]"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
          Force Recalculation
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Overall Health Score" 
          value={`${avgComposite.toFixed(1)}/100`} 
          icon={<HeartPulse className="w-5 h-5 text-success" />} 
          trend={avgComposite > 70 ? "Optimal State" : "Sub-optimal State"} 
          colorClass={avgComposite > 70 ? "text-success" : avgComposite > 50 ? "text-warning" : "text-destructive"}
        />
        <KpiCard 
          title="Avg AQI Score" 
          value={currentData?.reduce((a,c) => a + c.aqiScore, 0) / (currentData?.length || 1) | 0} 
          icon={<Wind className="w-5 h-5 text-primary" />} 
          trend="Based on 24h average" 
        />
        <KpiCard 
          title="Traffic Congestion" 
          value={`${(currentData?.reduce((a,c) => a + c.trafficScore, 0) / (currentData?.length || 1)).toFixed(1)}%`} 
          icon={<Car className="w-5 h-5 text-warning" />} 
          trend="Minor delays reported" 
        />
        <KpiCard 
          title="Safety / Crime" 
          value={`${(currentData?.reduce((a,c) => a + c.crimeScore, 0) / (currentData?.length || 1)).toFixed(1)}/100`} 
          icon={<ShieldAlert className="w-5 h-5 text-accent" />} 
          trend="Normal levels" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map */}
        <Card className="lg:col-span-2 overflow-hidden glass-panel flex flex-col h-[500px]">
          <div className="p-4 border-b border-border/50 bg-secondary/30 flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Sector Health Index
            </h3>
            <div className="flex gap-2 items-center text-xs font-mono">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> 80-100</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> 60-79</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> &lt;60</span>
            </div>
          </div>
          <div className="flex-1 relative bg-black/50">
              <Map
                initialViewState={DELHI_CENTER}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                mapLib={maplibregl}
                style={{ width: "100%", height: "100%" }}
              >
                {/* Simulated Region Polygons or Markers based on currentData */}
                {currentData?.map((point, idx) => {
                  let color = '#ef4444'; // red for < 60
                  if (point.compositeScore >= 80) color = '#22c55e'; // green
                  else if (point.compositeScore >= 60) color = '#eab308'; // yellow

                  return (
                    <Marker
                      key={`health-marker-${idx}`}
                      longitude={77.2090 + (Math.random() * 0.4 - 0.2)} // Adding slight offset since schema lacks distinct coords for health currently, simulating sectors
                      latitude={28.6139 + (Math.random() * 0.4 - 0.2)}
                      anchor="bottom"
                    >
                      <div 
                        className="flex items-center justify-center font-mono text-[10px] font-bold text-background bg-foreground rounded-md px-1.5 py-0.5 border border-background shadow-lg"
                        style={{ backgroundColor: color, borderColor: 'rgba(255,255,255,0.5)', boxShadow: `0 4px 12px ${color}80` }}
                      >
                        {point.compositeScore.toFixed(0)}
                      </div>
                    </Marker>
                  );
                })}
              </Map>
          </div>
        </Card>

        {/* Side Panel Charts */}
        <div className="flex flex-col gap-6">
          <Card className="glass-panel p-5 flex-1 flex flex-col">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Zone Status Breakdown</h3>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px' }}
                      itemStyle={{ fontFamily: 'Fira Code', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 font-mono text-xs">
                {statusDistribution.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                    <span className="text-muted-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="glass-panel p-5 flex-1">
             <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Component Breakdown</h3>
             <div className="h-[200px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={currentData?.slice(0, 4) || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                   <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                   <YAxis dataKey="locationName" type="category" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                   <RechartsTooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px' }}
                   />
                   <Bar dataKey="trafficScore" stackId="a" name="Traffic" fill="hsl(var(--warning))" barSize={16} />
                   <Bar dataKey="aqiScore" stackId="a" name="AQI" fill="hsl(var(--primary))" barSize={16} />
                   <Bar dataKey="crimeScore" stackId="a" name="Crime" fill="hsl(var(--accent))" radius={[0,4,4,0]} barSize={16} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </Card>
        </div>
      </div>

      {/* Bottom Full Width Chart */}
      <Card className="glass-panel p-6">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-6">Aggregate City Health Trend</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sortedHistory} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="createdAt" 
                tickFormatter={(val) => format(new Date(val), 'HH:mm')}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false} axisLine={false}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <RechartsTooltip 
                labelFormatter={(val) => format(new Date(val), 'MMM dd, HH:mm:ss')}
                contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px', fontFamily: 'Fira Code' }}
              />
              <Line 
                type="monotone" 
                name="Health Score"
                dataKey="compositeScore" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "hsl(var(--success))", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ title, value, icon, trend, colorClass = "text-foreground" }: { title: string, value: string | number, icon: React.ReactNode, trend: string, colorClass?: string }) {
  return (
    <Card className="glass-panel p-5 tech-border hover:bg-secondary/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-secondary/50 rounded-lg border border-border/50">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-muted-foreground text-sm font-medium mb-1">{title}</h4>
        <div className={`text-3xl font-bold font-mono tracking-tight ${colorClass}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-2 font-mono">{trend}</p>
      </div>
    </Card>
  );
}
