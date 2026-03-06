import { useAlerts } from "@/hooks/use-dashboard";
import { format } from "date-fns";
import { Bell, AlertOctagon, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState ,useEffect} from "react";
import { useLiveAlerts } from "@/hooks/use-live-alerts";


const severityStyles = {
  critical: {
    border: "border-l-red-600",
    bg: "bg-red-500/5",
    icon: "bg-red-500/20 text-red-500",
  },
  high: {
    border: "border-l-orange-500",
    bg: "bg-orange-500/5",
    icon: "bg-orange-500/20 text-orange-500",
  },
  medium: {
    border: "border-l-yellow-500",
    bg: "bg-yellow-500/5",
    icon: "bg-yellow-500/20 text-yellow-500",
  },
  low: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/5",
    icon: "bg-blue-500/20 text-blue-500",
  },
};



export default function AlertsPage() {
 const { data: alertsFromAPI, isLoading } = useAlerts();

  const [alerts, setAlerts] = useState<any[]>(alertsFromAPI || []);

  useLiveAlerts(setAlerts);

  
useEffect(() => {
  if (alertsFromAPI) {
    setAlerts(alertsFromAPI);
  }
}, [alertsFromAPI]);

  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Loading alerts...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold font-display">
            System Alerts
          </h1>

          <p className="text-muted-foreground">
            Real-time anomalies and critical warnings
          </p>
        </div>

        <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
          <Bell className="w-7 h-7 text-primary" />
        </div>

      </div>

      {/* Alerts List */}

      <div className="grid gap-4">

        {alerts?.map((alert, index) => {
        const style =
          severityStyles[alert.severity as keyof typeof severityStyles] ??
          severityStyles.low;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                glass-panel p-6 rounded-xl border-l-4 flex items-start gap-4
                ${style.border} ${style.bg}
              `}
            >

              {/* Icon */}

              <div className={`mt-1 p-2 rounded-full ${style.icon}`}>
                <AlertOctagon className="w-5 h-5" />
              </div>

              {/* Alert Content */}

              <div className="flex-1">

                <div className="flex justify-between items-start">

                  <h3 className="font-semibold text-lg">
                    {alert.type.replace("_", " ").toUpperCase()}
                  </h3>

                  <span className="text-xs font-mono text-muted-foreground">
                    {format(new Date(alert.timestamp), "MMM dd, HH:mm")}
                  </span>

                </div>

                <p className="text-muted-foreground mt-1">
                  {alert.message}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">

                  <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 uppercase tracking-wider font-semibold">
                    {alert.locationId}
                  </span>

                  <span
                    className={`text-xs px-2 py-1 rounded border uppercase tracking-wider font-semibold
                    ${
                      alert.isActive
                        ? "border-red-500/30 text-red-400 bg-red-500/10"
                        : "border-green-500/30 text-green-400 bg-green-500/10"
                    }`}
                  >
                    {alert.isActive ? "Active" : "Resolved"}
                  </span>

                </div>

              </div>

              {/* Action */}

              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group">

                <CheckCircle2 className="w-5 h-5 text-muted-foreground group-hover:text-green-400" />

              </button>

            </motion.div>
          );
        })}

        {/* Empty State */}

        {alerts?.length === 0 && (

          <div className="text-center py-24 bg-card/40 rounded-2xl border border-dashed border-border/40">

            <CheckCircle2 className="w-12 h-12 text-green-500/40 mx-auto mb-4" />

            <h3 className="text-xl font-semibold">
              All Systems Clear
            </h3>

            <p className="text-muted-foreground">
              No active alerts at this time.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}

