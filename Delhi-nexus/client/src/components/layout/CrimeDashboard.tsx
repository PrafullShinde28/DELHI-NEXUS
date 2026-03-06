import { useState, useMemo } from "react";
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  Crosshair,
  Target,
} from "lucide-react";
import { Marker, Popup } from "react-map-gl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import PageHeader from "@/components/layout/PageHeader";
import MapContainer, { NCR_ZONES } from "@/components/map/MapContainer";
import { useCrimeData, useCreateCrime } from "@/hooks/use-crime";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const CRIME_TYPES = [
  "Assault",
  "Theft",
  "Vandalism",
  "Cybercrime",
  "Traffic Violation",
];
const COLORS = ["#0ea5e9", "#8b5cf6", "#f43f5e", "#f59e0b", "#10b981"];

export default function CrimeDashboard() {
  const { data: crimes, isLoading } = useCrimeData();
  const createCrime = useCreateCrime();
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    zone: NCR_ZONES[0].name,
    crimeType: CRIME_TYPES[0],
    severity: "3",
    incidentCount: "1",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const zoneInfo = NCR_ZONES.find((z) => z.name === formData.zone);
    if (!zoneInfo) return;

    createCrime.mutate(
      {
        zone: formData.zone,
        lat: zoneInfo.lat + (Math.random() * 0.02 - 0.01), // Jitter
        lng: zoneInfo.lng + (Math.random() * 0.02 - 0.01),
        crimeType: formData.crimeType,
        severity: parseInt(formData.severity),
        incidentCount: parseInt(formData.incidentCount),
        riskScore: parseInt(formData.severity) * 20 + Math.random() * 20,
      },
      {
        onSuccess: () => setIsDialogOpen(false),
      },
    );
  };

  const chartData = useMemo(() => {
    if (!crimes) return { types: [], zones: [] };

    const typeCount: Record<string, number> = {};
    const zoneRisk: Record<string, number> = {};

    crimes.forEach((c) => {
      typeCount[c.crimeType] = (typeCount[c.crimeType] || 0) + c.incidentCount;
      zoneRisk[c.zone] = Math.max(zoneRisk[c.zone] || 0, c.riskScore);
    });

    return {
      types: Object.entries(typeCount).map(([name, value]) => ({
        name,
        value,
      })),
      zones: Object.entries(zoneRisk)
        .map(([zone, riskScore]) => ({ zone, riskScore }))
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5),
    };
  }, [crimes]);

  const severityColor = (severity: number) => {
    if (severity >= 4)
      return "text-destructive shadow-destructive bg-destructive";
    if (severity === 3) return "text-warning shadow-warning bg-warning";
    return "text-success shadow-success bg-success";
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <PageHeader
        title="Crime Intelligence"
        description="Live incident tracking and risk mapping"
        icon={<ShieldAlert className="w-6 h-6 text-destructive" />}
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-destructive hover:bg-destructive/90 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md glass-panel border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-gradient">
                  Log New Incident
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Incident Zone</Label>
                  <Select
                    value={formData.zone}
                    onValueChange={(v) => setFormData({ ...formData, zone: v })}
                  >
                    <SelectTrigger className="bg-black/50 border-border">
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {NCR_ZONES.map((z) => (
                        <SelectItem key={z.name} value={z.name}>
                          {z.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Crime Type</Label>
                    <Select
                      value={formData.crimeType}
                      onValueChange={(v) =>
                        setFormData({ ...formData, crimeType: v })
                      }
                    >
                      <SelectTrigger className="bg-black/50 border-border">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {CRIME_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity (1-5)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.severity}
                      onChange={(e) =>
                        setFormData({ ...formData, severity: e.target.value })
                      }
                      className="bg-black/50 border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Incident Count (Cluster size)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.incidentCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        incidentCount: e.target.value,
                      })
                    }
                    className="bg-black/50 border-border"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 mt-4"
                  disabled={createCrime.isPending}
                >
                  {createCrime.isPending ? "Transmitting..." : "Submit to Feed"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Map View */}
        <div className="flex-[2] relative border-r border-border/30 shadow-[4px_0_24px_rgba(0,0,0,0.4)] z-10">
          <MapContainer>
            {crimes?.map((crime) => (
              <Marker
                key={crime.id}
                latitude={crime.lat}
                longitude={crime.lng}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedIncident(crime);
                }}
              >
                <div className="relative cursor-pointer group">
                  <div
                    className={`absolute -inset-3 rounded-full opacity-20 group-hover:opacity-40 animate-ping ${severityColor(crime.severity)}`}
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-background shadow-[0_0_10px_rgba(255,255,255,0.2)] ${severityColor(crime.severity)}`}
                  />
                </div>
              </Marker>
            ))}

            {selectedIncident && (
              <Popup
                latitude={selectedIncident.lat}
                longitude={selectedIncident.lng}
                closeButton={false}
                closeOnClick={true}
                onClose={() => setSelectedIncident(null)}
                anchor="bottom"
                offset={15}
              >
                <div className="glass-panel p-4 rounded-xl min-w-[240px] border-l-4 border-l-destructive">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-display font-bold text-lg text-foreground leading-none">
                      {selectedIncident.crimeType}
                    </h4>
                    <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded">
                      SEV: {selectedIncident.severity}/5
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                    <Target className="w-3 h-3" /> {selectedIncident.zone}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-xs text-muted-foreground mb-1">
                        Count
                      </div>
                      <div className="font-mono text-primary font-bold">
                        {selectedIncident.incidentCount}
                      </div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-xs text-muted-foreground mb-1">
                        Risk Index
                      </div>
                      <div className="font-mono text-warning font-bold">
                        {selectedIncident.riskScore.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  {selectedIncident.timestamp && (
                    <div className="text-[10px] text-muted-foreground mt-3 text-right opacity-60">
                      {format(
                        new Date(selectedIncident.timestamp),
                        "HH:mm:ss dd/MM/yyyy",
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            )}
          </MapContainer>
        </div>

        {/* Dashboard Side Panel */}
        <div className="flex-1 min-w-[400px] max-w-lg bg-card/40 backdrop-blur-md overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-xs uppercase font-semibold">
                  Active Incidents
                </span>
              </div>
              <div className="text-4xl font-display font-bold text-foreground">
                {isLoading ? "..." : crimes?.length || 0}
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Crosshair className="w-4 h-4 text-destructive" />
                <span className="text-xs uppercase font-semibold">
                  Critical Zones
                </span>
              </div>
              <div className="text-4xl font-display font-bold text-destructive text-glow-destructive">
                {isLoading
                  ? "..."
                  : chartData.zones.filter((z) => z.riskScore > 75).length}
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Incidents by Type
            </h3>
            <div className="h-48">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.types}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.types.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {chartData.types.map((t, i) => (
                <div
                  key={t.name}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  ></div>
                  {t.name}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              High Risk Zones
            </h3>
            <div className="h-56">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.zones}
                    layout="vertical"
                    margin={{ top: 0, right: 0, bottom: 0, left: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      type="number"
                      stroke="rgba(255,255,255,0.2)"
                      fontSize={11}
                    />
                    <YAxis
                      dataKey="zone"
                      type="category"
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={11}
                      width={80}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="riskScore"
                      fill="hsl(var(--destructive))"
                      radius={[0, 4, 4, 0]}
                    >
                      {chartData.zones.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.riskScore > 75
                              ? "hsl(var(--destructive))"
                              : "hsl(var(--warning))"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
