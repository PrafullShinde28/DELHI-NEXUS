import { useState,useEffect } from "react";
import { Activity, Stethoscope, HeartPulse } from "lucide-react";
import { Marker, Popup } from "react-map-gl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import PageHeader from "@/components/layout/PageHeader";
import MapContainer from "@/components/map/MapContainer";
import { useHospitalData, useUpdateHospital } from "@/hooks/use-hospital";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { type Hospital } from "@shared/schema";


export default function HospitalDashboard() {
  type HospitalEvent = {
  id: number;
  name: string;
  lat: number;
  zone: string;
  lng: number;
  totalBeds: number;
  occupiedBeds: number;
  icuTotal: number;
  icuOccupied: number;
  oxygenStatus: "ok" | "low" | "critical";
};
  
const [hospitals, setHospitals] = useState<HospitalEvent[]>([]);
const isLoading = hospitals.length === 0;
useEffect(() => {
  const socket = new WebSocket("ws://localhost:5000/realtime");

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "hospital") {
      setHospitals((prev) => {
        const existing = prev.find((h) => h.id === data.payload.id);

        if (existing) {
          return prev.map((h) =>
            h.id === data.payload.id ? data.payload : h
          );
        }

        return [...prev, data.payload];
      });
    }
  };

  return () => socket.close();
}, []);

  const updateHospital = useUpdateHospital();

  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Form State for editing
  const [editData, setEditData] = useState({
    occupiedBeds: 0,
    icuOccupied: 0,
    oxygenStatus: "ok",
  });

  const openEditSheet = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setEditData({
      occupiedBeds: hospital.occupiedBeds,
      icuOccupied: hospital.icuOccupied,
      oxygenStatus: hospital.oxygenStatus,
    });
    setIsSheetOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital) return;

    updateHospital.mutate(
      {
        id: selectedHospital.id,
        occupiedBeds: editData.occupiedBeds,
        icuOccupied: editData.icuOccupied,
        oxygenStatus: editData.oxygenStatus,
      },
      {
        onSuccess: () => {
          setIsSheetOpen(false);
          setSelectedHospital(null);
        },
      },
    );
  };

  const getStatusColor = (occupied: number, total: number) => {
    const ratio = occupied / total;
    if (ratio >= 0.9) return "text-destructive bg-destructive";
    if (ratio >= 0.75) return "text-warning bg-warning";
    return "text-success bg-success";
  };

  const chartData =
    hospitals?.map((h) => ({
      name: h.name.split(" ")[0], // short name
      available: h.totalBeds - h.occupiedBeds,
      occupied: h.occupiedBeds,
      utilization: Math.round((h.occupiedBeds / h.totalBeds) * 100),
    })) || [];

  return (
    <div className="flex flex-col h-full bg-background relative">
      <PageHeader
        title="Health Infrastructure Capacity"
        description="Live bed tracking and resource allocation"
        icon={<Activity className="w-6 h-6 text-primary" />}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Dashboard Side Panel - Left side for variation */}
        <div className="flex-1 min-w-[350px] max-w-sm bg-card/40 backdrop-blur-md overflow-y-auto p-6 space-y-6 border-r border-border/30 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <HeartPulse className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Total System Capacity
            </h3>
            <div className="text-4xl font-display font-bold text-foreground mt-2">
              {isLoading
                ? "..."
                : hospitals?.reduce(
                    (acc, h) => acc + (h.totalBeds - h.occupiedBeds),
                    0,
                  )}
            </div>
            <div className="text-sm text-success mt-1">
              Available General Beds
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border-l-2 border-l-primary">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Bed Utilization
            </h3>
            <div className="h-64">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 0, right: 0, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                    />
                    <Bar
                      dataKey="occupied"
                      stackId="a"
                      fill="hsl(var(--muted-foreground))"
                      name="Occupied"
                    />
                    <Bar
                      dataKey="available"
                      stackId="a"
                      fill="hsl(var(--primary))"
                      name="Available"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-2">
              Critical Alerts
            </h3>
            {hospitals
              ?.filter(
                (h) =>
                  h.oxygenStatus !== "ok" || h.icuOccupied / h.icuTotal > 0.9,
              )
              .map((h) => (
                <div
                  key={`alert-${h.id}`}
                  className="glass-panel p-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-sm">{h.name}</div>
                    <div className="text-xs text-destructive flex items-center gap-1">
                      {h.oxygenStatus === "critical" && (
                        <span>Oxygen Critical</span>
                      )}
                      {h.icuOccupied / h.icuTotal > 0.9 && (
                        <span>ICU Full</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs bg-black/50"
                    onClick={() => openEditSheet(h)}
                  >
                    Manage
                  </Button>
                </div>
              ))}
            {hospitals?.filter(
              (h) =>
                h.oxygenStatus !== "ok" || h.icuOccupied / h.icuTotal > 0.9,
            ).length === 0 && (
              <div className="text-sm text-muted-foreground px-2">
                No critical resource alerts.
              </div>
            )}
          </div>
        </div>

        {/* Map View */}
        <div className="flex-[2] relative">
          <MapContainer>
            {hospitals?.map((hospital) => {
              const statusColor = getStatusColor(
                hospital.occupiedBeds,
                hospital.totalBeds,
              );

              return (
                <Marker
                  key={hospital.id}
                  latitude={hospital.lat}
                  longitude={hospital.lng}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    openEditSheet(hospital);
                  }}
                >
                  <div className="relative cursor-pointer group flex flex-col items-center">
                    <div className="map-tooltip group-hover:block hidden absolute bottom-full mb-2 whitespace-nowrap">
                      <div className="font-bold text-white">
                        {hospital.name}
                      </div>
                      <div className="text-xs text-white/70">
                        ICU: {hospital.icuTotal - hospital.icuOccupied} /{" "}
                        {hospital.icuTotal} available
                      </div>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full border-2 border-background shadow-lg flex items-center justify-center ${statusColor}`}
                    >
                      <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <div className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white shadow">
                      {Math.round(
                        (hospital.occupiedBeds / hospital.totalBeds) * 100,
                      )}
                      %
                    </div>
                  </div>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="glass-panel border-l border-white/10 sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl text-gradient">
              Manage Capacity
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {selectedHospital?.name}
            </p>
          </SheetHeader>

          {selectedHospital && (
            <form onSubmit={handleUpdate} className="space-y-6 mt-8">
              <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total General Beds
                  </span>
                  <span className="font-mono font-bold">
                    {selectedHospital.totalBeds}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Occupied Beds</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedHospital.totalBeds}
                    value={editData.occupiedBeds}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        occupiedBeds: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-black/50 border-border"
                  />
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${getStatusColor(editData.occupiedBeds, selectedHospital.totalBeds)}`}
                      style={{
                        width: `${(editData.occupiedBeds / selectedHospital.totalBeds) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total ICU Beds</span>
                  <span className="font-mono font-bold">
                    {selectedHospital.icuTotal}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Occupied ICU</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedHospital.icuTotal}
                    value={editData.icuOccupied}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        icuOccupied: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-black/50 border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Oxygen Supply Status</Label>
                <Select
                  value={editData.oxygenStatus}
                  onValueChange={(v) =>
                    setEditData({ ...editData, oxygenStatus: v })
                  }
                >
                  <SelectTrigger className="bg-black/50 border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="ok">Optimal (OK)</SelectItem>
                    <SelectItem value="low">Low Warning</SelectItem>
                    <SelectItem value="critical">Critical Shortage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 mt-4"
                disabled={updateHospital.isPending}
              >
                {updateHospital.isPending ? "Syncing..." : "Update Network"}
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
