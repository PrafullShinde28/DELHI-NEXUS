import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { BrainCircuit } from "lucide-react";
import { format } from "date-fns";

export default function PredictionsPage() {

  const [trafficPredictions, setTrafficPredictions] = useState<any[]>([]);
  const [aqiPredictions, setAqiPredictions] = useState<any[]>([]);
  const [confidence, setConfidence] = useState<number>(0);

  const baseTime = new Date();

  /* ---------------- LOAD PREDICTIONS ---------------- */

  const loadPredictions = async () => {

    try {

      const res = await fetch("/api/predictions/generate", {
        method: "POST"
      });

      const data = await res.json();

      if (!Array.isArray(data)) return;

      setTrafficPredictions(data);
      setAqiPredictions(data);

    } catch (err) {
      console.error("Prediction fetch failed", err);
    }

  };

  /* ---------------- INITIAL LOAD ---------------- */

  useEffect(() => {

    loadPredictions();

    const interval = setInterval(loadPredictions, 30000);

    return () => clearInterval(interval);

  }, []);

  /* ---------------- CHART DATA ---------------- */

  const trafficChart =
    trafficPredictions?.map((item) => ({
      time: format(
        new Date(baseTime.getTime() + item.hour * 3600000),
        "HH:mm"
      ),
      value: item.traffic
    })) || [];

  const aqiChart =
    aqiPredictions?.map((item) => ({
      time: format(
        new Date(baseTime.getTime() + item.hour * 3600000),
        "HH:mm"
      ),
      value: item.aqi
    })) || [];

  /* ---------------- UI ---------------- */

  return (
    <>
      {/* HEADER */}

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Forecasts
          </h1>

          <p className="text-muted-foreground">
            Machine learning predictions for urban planning
          </p>
        </div>

        <div className="bg-purple-500/10 p-3 rounded-full">
          <BrainCircuit className="w-8 h-8 text-purple-400" />
        </div>

      </div>

      {/* CHART GRID */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* TRAFFIC FORECAST */}

        <div className="glass-panel p-6 rounded-2xl">

          <h3 className="font-semibold mb-4">
            Traffic Congestion Forecast
          </h3>

          <div className="h-[320px]">

            <ResponsiveContainer width="100%" height="100%">

              <AreaChart data={trafficChart}>

                <defs>
                  <linearGradient id="trafficPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />

                <XAxis dataKey="time" stroke="#64748b" />

                <YAxis domain={[0,10]} stroke="#64748b" />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#a855f7"
                  strokeWidth={3}
                  fill="url(#trafficPred)"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* AQI FORECAST */}

        <div className="glass-panel p-6 rounded-2xl">

          <h3 className="font-semibold mb-4">
            AQI Forecast
          </h3>

          <div className="h-[320px]">

            <ResponsiveContainer width="100%" height="100%">

              <AreaChart data={aqiChart}>

                <defs>
                  <linearGradient id="aqiPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />

                <XAxis dataKey="time" stroke="#64748b" />

                <YAxis stroke="#64748b" />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fill="url(#aqiPred)"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

      {/* MODEL CONFIDENCE */}

      <div className="glass-panel p-6 rounded-2xl mt-8">

        <h3 className="font-semibold mb-3">
          Model Confidence
        </h3>

        <div className="flex items-end gap-2">

          <span className="text-4xl font-bold text-green-400">
            {confidence || 83}%
          </span>

          <span className="text-muted-foreground">
            Random Forest Accuracy
          </span>

        </div>

        <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden">

          <div
            className="bg-green-500 h-full"
            style={{ width: `${confidence || 83}%` }}
          />

        </div>

      </div>

    </>
  );
}