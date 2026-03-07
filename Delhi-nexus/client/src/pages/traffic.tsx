import { useTrafficHistory } from "@/hooks/use-dashboard";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { format } from "date-fns";
import { Car } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ================= SOCKET ================= */

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

/* ================= COMPONENT ================= */

export default function TrafficPage() {
  const { data: trafficHistory, isLoading } = useTrafficHistory();
  const [liveTraffic, setLiveTraffic] = useState<any[]>([]);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    if (trafficHistory?.length) {
      setLiveTraffic(trafficHistory.slice(0, 40));
    }
  }, [trafficHistory]);

  /* ================= REALTIME SOCKET ================= */

  useEffect(() => {
    const handler = (msg: any) => {
      if (!msg || msg.type !== "traffic" || !Array.isArray(msg.data)) return;

      const latest = msg.data[0];
      if (!latest?.timestamp) return;

      setLiveTraffic((prev) => {
        const updated = [latest, ...prev];

        /* remove duplicates */
        const unique = updated.filter(
          (v, i, arr) =>
            arr.findIndex(
              (x) =>
                new Date(x.timestamp).getTime() ===
                new Date(v.timestamp).getTime(),
            ) === i,
        );

        return unique.slice(0, 40);
      });
    };

    socket.on("data_update", handler);

    return () => {
      socket.off("data_update", handler);
    };
  }, []);

  /* ================= LOADING ================= */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  /* ================= CHART DATA ================= */

  const chartData = [...liveTraffic]
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
    .map((item) => ({
      time: format(new Date(item.timestamp), "HH:mm:ss"),
      congestion: Number(item.congestionIndex || 0),
      density: Number(item.vehicleDensity || 0),
    }));

  /* ================= LIVE METRICS ================= */

  const peakRecord = liveTraffic.length
    ? liveTraffic.reduce((max, curr) =>
        curr.congestionIndex > max.congestionIndex ? curr : max,
      )
    : null;

  const peakTime = peakRecord
    ? format(new Date(peakRecord.timestamp), "HH:mm:ss")
    : "--";

  const avgCongestion = liveTraffic.length
    ? (
        liveTraffic.reduce((sum, t) => sum + t.congestionIndex, 0) /
        liveTraffic.length
      ).toFixed(1)
    : "0";

  const totalFlow = liveTraffic.length
    ? liveTraffic.reduce((sum, t) => sum + t.vehicleDensity, 0)
    : 0;

  /* ================= UI ================= */

  return (
    <>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Traffic Analytics</h1>
          <p className="text-muted-foreground">
            Real-time congestion monitoring across key city zones
          </p>
        </div>

        <div className="bg-primary/10 p-3 rounded-full">
          <Car className="w-8 h-8 text-primary" />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium mb-1">Peak Congestion Time</h3>

          <div className="text-4xl font-bold font-display text-red-400">
            {peakTime}
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            Average index {avgCongestion}/10
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium mb-1">Total Vehicle Flow</h3>

          <div className="text-4xl font-bold font-display text-blue-400">
            {totalFlow}
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            Vehicles recorded in last hour
          </p>
        </div>
      </div>

      {/* CHART */}
      <div className="glass-panel p-6 rounded-2xl mb-8">
        <h3 className="font-semibold mb-6">Congestion Trends (Realtime)</h3>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
                domain={[0, 10]} // ✅ fixed scaling
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                }}
              />

              <Line
                type="monotone"
                dataKey="congestion"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
