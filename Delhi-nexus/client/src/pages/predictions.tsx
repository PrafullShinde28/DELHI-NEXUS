import { usePredictions } from "@/hooks/use-dashboard";
import { Layout } from "@/components/layout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { BrainCircuit } from "lucide-react";

export default function PredictionsPage() {
  const { data: predictions, isLoading } = usePredictions();

  const chartData = predictions?.map(item => ({
    time: format(new Date(item.forecastTime), 'HH:mm'),
    value: item.predictedValue,
    confidence: (item.confidenceScore || 0) * 100
  })) || [];

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Forecasts
          </h1>
          <p className="text-muted-foreground">Machine learning predictions for urban planning</p>
        </div>
        <div className="bg-purple-500/10 p-3 rounded-full">
          <BrainCircuit className="w-8 h-8 text-purple-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prediction Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="font-semibold mb-2">Traffic Congestion Forecast (Next 24h)</h3>
          <p className="text-xs text-muted-foreground mb-6">Based on historical data and current weather conditions</p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#a855f7" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPred)" 
                  name="Predicted Index" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence & Insights */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="font-semibold mb-4">Model Confidence</h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold text-green-400">94.2%</span>
              <span className="text-sm text-muted-foreground mb-1">Accuracy Score</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full rounded-full" style={{ width: '94.2%' }}></div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              The prediction model uses a Hybrid LSTM-GRU network trained on 5 years of Delhi traffic data.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="font-semibold mb-4">Key Insights</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></span>
                <span>Expected 15% increase in congestion at Connaught Place around 6:00 PM due to weather conditions.</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></span>
                <span>PM2.5 levels predicted to drop by 20% tomorrow morning due to expected wind speed increase.</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></span>
                <span>Anomalous traffic pattern detected near India Gate; likely due to public event.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
