import { useState } from "react";
import { Activity, Stethoscope } from "lucide-react";
import { Marker } from "react-map-gl";
import { LabelList } from "recharts";
import { Cell } from "recharts";
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

import {
  useResilienceStore,
  type HospitalEvent,
} from "@/store/resilienceStore";

/* ===================================================== */
/* COMPONENT */
/* ===================================================== */

export default function HospitalDashboard() {
  /* 🔹 GLOBAL STORE */
  const hospitals = useResilienceStore((s) => s.hospitals);

  const [selectedHospital, setSelectedHospital] =
    useState<HospitalEvent | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [editData, setEditData] = useState({
    occupiedBeds: 0,
    icuOccupied: 0,
    oxygenStatus: "ok" as HospitalEvent["oxygenStatus"],
  });

  const isLoading = hospitals.length === 0;

  /* ===================================================== */
  /* UI HELPERS                                            */
  /* ===================================================== */

  const openEditSheet = (hospital: HospitalEvent) => {
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

    /* 🔹 LOCAL UI UPDATE ONLY (NO SERVER YET) */
    useResilienceStore.setState({
      hospitals: hospitals.map((h) =>
        h.id === selectedHospital.id ? { ...h, ...editData } : h,
      ),
    });

    setIsSheetOpen(false);
  };

  const getStatusColor = (occupied: number, total: number) => {
    const ratio = occupied / total;

    if (ratio >= 0.9) return "text-destructive bg-destructive";
    if (ratio >= 0.75) return "text-warning bg-warning";

    return "text-success bg-success";
  };

  const chartData = [...hospitals]
    .map((h) => ({
      name: h.name.split(" ")[0],
      utilization: Math.round((h.occupiedBeds / h.totalBeds) * 100),
    }))
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 8);

  /* ===================================================== */
  /* UI                                                    */
  /* ===================================================== */

  return (
    <div className="flex flex-col h-full bg-background relative">
      <PageHeader
        title="Health Infrastructure Capacity"
        description="Live bed tracking and resource allocation"
        icon={<Activity className="w-6 h-6 text-primary" />}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <div className="flex-1 min-w-[350px] max-w-sm bg-card/40 backdrop-blur-md overflow-y-auto p-6 space-y-6 border-r border-border/30">
          {/* KPI */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Total Available Beds
            </h3>

            <div className="text-4xl font-bold mt-2">
              {isLoading
                ? "..."
                : hospitals.reduce(
                    (acc, h) => acc + (h.totalBeds - h.occupiedBeds),
                    0,
                  )}
            </div>
          </div>

          {/* CHART */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-4">
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
                    margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.08)"
                    />

                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.7)"
                      fontSize={11}
                      angle={-15}
                      textAnchor="end"
                    />

                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={11}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />

                    <RechartsTooltip
                      formatter={(v: number) => [`${v}%`, "Utilization"]}
                      contentStyle={{
                        backgroundColor: "rgba(15,23,42,0.95)",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />

                    <Bar
                      dataKey="utilization"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={34}
                    >
                      {/* 🔹 COLOR LOGIC */}
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.utilization >= 90
                              ? "#ef4444" // critical
                              : entry.utilization >= 75
                                ? "#f59e0b" // warning
                                : "#22c55e" // safe
                          }
                        />
                      ))}

                      {/* 🔹 LABEL */}
                      <LabelList
                        dataKey="utilization"
                        position="top"
                        content={(props: any) => {
                          const { x, y, value } = props;

                          return (
                            <g>
                              {/* 🔹 GLASS BACKGROUND */}
                              <rect
                                x={x - 16}
                                y={y - 18}
                                width={32}
                                height={18}
                                rx={5}
                                fill="rgba(15,23,42,0.75)"
                                style={{
                                  backdropFilter: "blur(6px)",
                                }}
                              />

                              {/* 🔹 TEXT */}
                              <text
                                x={x}
                                y={y - 5}
                                textAnchor="middle"
                                fontSize="11"
                                fontWeight="700"
                                fill="#ffffff"
                              >
                                {`${value}%`}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* MAP */}
        <div className="flex-[2] relative">
          <MapContainer>
            {hospitals.map((hospital) => {
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
                  <div className="relative group flex flex-col items-center cursor-pointer">
                    {/* 🔹 HOVER TOOLTIP (COMMAND CENTER STYLE) */}
                    <div className="hidden group-hover:block absolute bottom-full mb-2 whitespace-nowrap z-50">
                      <div className="bg-black/90 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg shadow-xl text-xs">
                        <div className="font-semibold text-white">
                          {hospital.name}
                        </div>

                        <div className="text-white/70">
                          Beds: {hospital.totalBeds - hospital.occupiedBeds}/
                          {hospital.totalBeds}
                        </div>

                        <div className="text-white/70">
                          ICU: {hospital.icuTotal - hospital.icuOccupied}/
                          {hospital.icuTotal}
                        </div>
                      </div>
                    </div>

                    {/* 🔹 MAIN MARKER */}
                    <div
                      className={`w-9 h-9 rounded-full border-2 border-background shadow-lg flex items-center justify-center ${getStatusColor(
                        hospital.occupiedBeds,
                        hospital.totalBeds,
                      )}`}
                    >
                      <Stethoscope className="w-4 h-4 text-white" />
                    </div>

                    {/* 🔹 ALWAYS VISIBLE SHORT NAME */}
                    <div className="mt-1 px-2 py-[2px] rounded bg-black/80 text-[10px] font-semibold text-white shadow whitespace-nowrap">
                      {hospital.name.split(" ")[0]}
                    </div>
                  </div>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* EDIT SHEET */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Manage Capacity</SheetTitle>
          </SheetHeader>

          {selectedHospital && (
            <form onSubmit={handleUpdate} className="space-y-4 mt-6">
              <Label>Occupied Beds</Label>
              <Input
                type="number"
                value={editData.occupiedBeds}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    occupiedBeds: Number(e.target.value),
                  })
                }
              />

              <Label>ICU Occupied</Label>
              <Input
                type="number"
                value={editData.icuOccupied}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    icuOccupied: Number(e.target.value),
                  })
                }
              />

              <Label>Oxygen Status</Label>
              <Select
                value={editData.oxygenStatus}
                onValueChange={(v: HospitalEvent["oxygenStatus"]) =>
                  setEditData({ ...editData, oxygenStatus: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" className="w-full">
                Update
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
