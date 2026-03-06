import { useMemo, useState,useEffect } from "react";
import maplibregl from "maplibre-gl";
import Map, { Source, Layer, Marker, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  useCurrentFloodData, 
  useFloodHistory, 
  useTriggerMockFlood 
} from "@/hooks/use-flood";
import { 
  CloudRain, 
  Waves, 
  AlertTriangle, 
  Droplets,
  Activity,
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
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const DELHI_CENTER = { longitude: 77.2090, latitude: 28.6139, zoom: 10 };

export default function FloodDashboard() {
  const [liveFloodData, setLiveFloodData] = useState<any[]>([]);
  useEffect(() => {
  const socket = new WebSocket("ws://localhost:8080");

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === "flood") {
      const payload = message.payload;

      setLiveFloodData((prev) => {
        const updated = [...prev];

        const index = updated.findIndex(
          (p) => p.locationName === payload.locationName
        );

        if (index !== -1) updated[index] = payload;
        else updated.push(payload);

        return updated;
      });
    }
  };

  return () => socket.close();
}, []);

const { data: apiData, isLoading: loadingCurrent } = useCurrentFloodData();
const currentData = liveFloodData.length > 0 ? liveFloodData : apiData;
  const { data: historyData, isLoading: loadingHistory } = useFloodHistory();
  const { mutate: triggerMock, isPending: mocking } = useTriggerMockFlood();
  
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);

  const geoJsonData = useMemo(() => {
    if (!currentData) return null;
    return {
      type: "FeatureCollection" as const,
      features: currentData.map(point => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [point.longitude, point.latitude]
        },
        properties: {
          ...point
        }
      }))
    };
  }, [currentData]);

  const avgRisk = useMemo(() => {
    if (!currentData || currentData.length === 0) return 0;
    return currentData.reduce((acc, curr) => acc + curr.floodProbability, 0) / currentData.length;
  }, [currentData]);

  const sortedHistory = useMemo(() => {
    if (!historyData) return [];
    return [...historyData].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [historyData]);

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
          <h1 className="text-3xl font-bold text-foreground">Flood Monitoring</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Delhi NCR Region • Real-time Telemetry</p>
        </div>
        <Button 
          onClick={() => triggerMock()} 
          disabled={mocking}
          variant="outline"
          className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:text-primary transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          {mocking ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
          Simulate Storm Event
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Avg Flood Probability" value={`${avgRisk.toFixed(1)}%`} icon={<AlertTriangle className="w-5 h-5 text-warning" />} trend="+2.4% vs 1hr" isAlert={avgRisk > 60} />
        <KpiCard title="Active Sensors" value={currentData?.length.toString() || "0"} icon={<Activity className="w-5 h-5 text-success" />} trend="All systems nominal" />
        <KpiCard title="Max Rainfall Intensity" value={`${Math.max(...(currentData?.map(d => d.rainfallIntensity) || [0])).toFixed(1)} mm/hr`} icon={<CloudRain className="w-5 h-5 text-accent" />} trend="Increasing" />
        <KpiCard title="Critical Nodes" value={currentData?.filter(d => d.riskLevel === 'critical').length.toString() || "0"} icon={<Waves className="w-5 h-5 text-destructive" />} trend="Requires attention" isAlert={true} />
      </div>

      {/* Map and Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Map */}
        <Card className="lg:col-span-2 overflow-hidden glass-panel flex flex-col h-[500px]">
          <div className="p-4 border-b border-border/50 bg-secondary/30 flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Live Sensor Map
            </h3>
            <div className="flex gap-2 items-center text-xs font-mono">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Low</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Mod</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> High</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Crit</span>
            </div>
          </div>

          <div className="flex-1 relative bg-black/50">
             <Map
                 initialViewState={DELHI_CENTER}
                  mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                  mapLib={maplibregl}
                  style={{ width: "100%", height: "100%" }}
              >
                {geoJsonData && (
                  <Source type="geojson" data={geoJsonData}>
                    {/* Heatmap Layer */}
                    <Layer
                      id="flood-heat"
                      type="heatmap"
                      paint={{
                        'heatmap-weight': ['interpolate', ['linear'], ['get', 'floodProbability'], 0, 0, 100, 1],
                        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
                        'heatmap-color': [
                          'interpolate',
                          ['linear'],
                          ['heatmap-density'],
                          0, 'rgba(0,0,255,0)',
                          0.3, 'blue',
                          0.6, 'yellow',
                          0.8, 'orange',
                          1, 'red'
                        ],
                        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 40],
                        'heatmap-opacity': 0.7
                      }}
                    />
                  </Source>
                )}

                {/* Markers */}
                {currentData?.map((point, idx) => {
                  let color = '#3b82f6'; // blue
                  if (point.floodProbability > 30) color = '#eab308'; // yellow
                  if (point.floodProbability > 60) color = '#f97316'; // orange
                  if (point.floodProbability > 80) color = '#ef4444'; // red

                  return (
                    <Marker
                      key={`marker-${idx}`}
                      longitude={point.longitude}
                      latitude={point.latitude}
                      onClick={e => {
                        e.originalEvent.stopPropagation();
                        setSelectedLocation(point);
                      }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full cursor-pointer border-2 border-background shadow-lg transition-transform hover:scale-125"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                      />
                    </Marker>
                  );
                })}

                {/* Popup */}
                {selectedLocation && (
                  <Popup
                    longitude={selectedLocation.longitude}
                    latitude={selectedLocation.latitude}
                    anchor="bottom"
                    onClose={() => setSelectedLocation(null)}
                    closeButton={false}
                    className="z-50"
                  >
                    <div className="p-4 w-64">
                      <h4 className="font-bold text-lg mb-2 pb-2 border-b border-border/50 text-foreground">{selectedLocation.locationName}</h4>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Risk Level</span>
                          <span className="uppercase font-bold" style={{
                            color: selectedLocation.riskLevel === 'critical' ? '#ef4444' : 
                                   selectedLocation.riskLevel === 'high' ? '#f97316' : 
                                   selectedLocation.riskLevel === 'moderate' ? '#eab308' : '#3b82f6'
                          }}>{selectedLocation.riskLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Probability</span>
                          <span className="text-foreground">{selectedLocation.floodProbability.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rainfall</span>
                          <span className="text-accent">{selectedLocation.rainfallIntensity.toFixed(1)} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Water Lvl</span>
                          <span className="text-primary">{selectedLocation.waterLevel.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Drainage</span>
                          <span className="text-success">{selectedLocation.drainageCapacity.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                )}
              </Map>
          </div>
        </Card>

        {/* Side Panel Charts */}
        <div className="flex flex-col gap-6">
          <Card className="glass-panel p-5 flex-1 flex flex-col">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Risk Distribution</h3>
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" 
                  barSize={15} data={[
                    { name: 'Critical', value: currentData?.filter(d => d.riskLevel === 'critical').length || 0, fill: '#ef4444' },
                    { name: 'High', value: currentData?.filter(d => d.riskLevel === 'high').length || 0, fill: '#f97316' },
                    { name: 'Moderate', value: currentData?.filter(d => d.riskLevel === 'moderate').length || 0, fill: '#eab308' },
                    { name: 'Low', value: currentData?.filter(d => d.riskLevel === 'low').length || 0, fill: '#3b82f6' }
                  ]}
                >
                  <PolarAngleAxis type="number" domain={[0, currentData?.length || 1]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background={{ fill: 'rgba(255,255,255,0.05)' }}
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px' }}
                    itemStyle={{ fontFamily: 'Fira Code', fontWeight: 'bold' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center font-mono text-xs text-muted-foreground mt-2">Current Breakdown across NCR</div>
          </Card>

          <Card className="glass-panel p-5 flex-1">
             <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Rainfall vs Capacity</h3>
             <div className="h-[200px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={currentData?.slice(0, 5) || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                   <XAxis dataKey="locationName" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                   <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                   <RechartsTooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px' }}
                   />
                   <Bar dataKey="rainfallIntensity" name="Rainfall" fill="hsl(var(--accent))" radius={[4,4,0,0]} barSize={12} />
                   <Bar dataKey="drainageCapacity" name="Drainage" fill="hsl(var(--success))" radius={[4,4,0,0]} barSize={12} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </Card>
        </div>
      </div>

      {/* Bottom Full Width Chart */}
      <Card className="glass-panel p-6">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-6">Network Flood Probability Trend (Last 24h)</h3>
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
                dataKey="floodProbability" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ title, value, icon, trend, isAlert = false }: { title: string, value: string, icon: React.ReactNode, trend: string, isAlert?: boolean }) {
  return (
    <Card className={`glass-panel p-5 tech-border ${isAlert ? 'border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-secondary/50 rounded-lg border border-border/50">
          {icon}
        </div>
        {isAlert && <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
        </span>}
      </div>
      <div>
        <h4 className="text-muted-foreground text-sm font-medium mb-1">{title}</h4>
        <div className="text-3xl font-bold text-foreground font-mono tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-2 font-mono">{trend}</p>
      </div>
    </Card>
  );
}
