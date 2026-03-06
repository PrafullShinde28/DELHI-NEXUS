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
  ResponsiveContainer
} from "recharts";

import { format } from "date-fns";
import { Car } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const socket = io("http://localhost:5000");

export default function TrafficPage() {

  const { data: trafficHistory, isLoading } = useTrafficHistory();
  const [liveTraffic, setLiveTraffic] = useState<any[]>([]);

  /* ---------------- INITIAL LOAD ---------------- */

  useEffect(() => {
    if (trafficHistory) {
      setLiveTraffic(trafficHistory);
    }
  }, [trafficHistory]);

  /* ---------------- REAL-TIME SOCKET ---------------- */

  useEffect(() => {

    const handler = (msg: any) => {

      if (msg.type === "traffic") {

        setLiveTraffic((prev) => [
          ...msg.data,
          ...prev
        ].slice(0, 50));

      }

    };

    socket.on("data_update", handler);

    return () => {
      socket.off("data_update", handler);
    };

  }, []);

  /* ---------------- LOADING ---------------- */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  /* ---------------- CHART DATA ---------------- */

  const chartData =
    liveTraffic?.slice(0, 50).map((item) => ({
      time: format(new Date(item.timestamp), "hh:mm a"),
      congestion: item.congestionIndex,
      density: item.vehicleDensity
    })) || [];

  /* ---------------- LIVE METRICS ---------------- */

  const peakRecord = liveTraffic.length
    ? liveTraffic.reduce((max, curr) =>
        curr.congestionIndex > max.congestionIndex ? curr : max
      )
    : null;

  const peakTime = peakRecord
    ? format(new Date(peakRecord.timestamp), "hh:mm a")
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

  return (
    <>
      {/* Header */}

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-3xl font-bold font-display">
            Traffic Analytics
          </h1>

          <p className="text-muted-foreground">
            Deep dive into vehicle density and congestion patterns
          </p>
        </div>

        <div className="bg-primary/10 p-3 rounded-full">
          <Car className="w-8 h-8 text-primary" />
        </div>

      </div>

      {/* Stats */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        <div className="glass-panel p-6 rounded-2xl">

          <h3 className="text-lg font-medium mb-1">
            Peak Congestion Time
          </h3>

          <div className="text-4xl font-bold font-display text-red-400">
            {peakTime}
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            Average index {avgCongestion}/10
          </p>

        </div>

        <div className="glass-panel p-6 rounded-2xl">

          <h3 className="text-lg font-medium mb-1">
            Total Vehicle Flow
          </h3>

          <div className="text-4xl font-bold font-display text-blue-400">
            {totalFlow}
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            Vehicles recorded in last hour
          </p>

        </div>

      </div>

      {/* Congestion Chart */}

      <div className="glass-panel p-6 rounded-2xl mb-8">

        <h3 className="font-semibold mb-6">
          Congestion Trends
        </h3>

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
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b"
                }}
              />

              <Line
                type="monotone"
                dataKey="congestion"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* Location Breakdown */}

      <div className="glass-panel rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-white/5">
          <h3 className="font-semibold">
            Location Breakdown
          </h3>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm text-left">

            <thead className="text-muted-foreground bg-white/5">

              <tr>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Congestion Index</th>
                <th className="px-6 py-4 font-medium">Vehicle Density</th>
                <th className="px-6 py-4 font-medium">Last Updated</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>

            </thead>

            <tbody className="divide-y divide-white/5">

              {liveTraffic.slice(0, 5).map((row) => (

                <tr key={row.id} className="hover:bg-white/5">

                  <td className="px-6 py-4 font-medium capitalize">
                    {row.locationId}
                  </td>

                  <td className="px-6 py-4">
                    {row.congestionIndex.toFixed(1)}
                  </td>

                  <td className="px-6 py-4">
                    {row.vehicleDensity}
                  </td>

                  <td className="px-6 py-4 font-mono text-muted-foreground">
                    {format(new Date(row.timestamp), "hh:mm:ss a")}
                  </td>

                  <td className="px-6 py-4">

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.congestionIndex > 7
                          ? "bg-red-500/20 text-red-400"
                          : row.congestionIndex > 4
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {row.congestionIndex > 7
                        ? "High"
                        : row.congestionIndex > 4
                        ? "Moderate"
                        : "Normal"}
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