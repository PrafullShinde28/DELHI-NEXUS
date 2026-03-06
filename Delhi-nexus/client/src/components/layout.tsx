import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Car,
  Wind,
  BrainCircuit,
  Bell,
  Menu,
  X,
  Search,
  ShieldAlert,
  Activity,
  Hospital,
  Hexagon,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useResilienceWebSocket } from "@/hooks/use-websocket";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/traffic", icon: Car, label: "Traffic" },
  { href: "/pollution", icon: Wind, label: "Air Quality" },
  { href: "/predictions", icon: BrainCircuit, label: "AI Forecasts" },
  { href: "/alerts", icon: Bell, label: "Alerts" },

  { href: "/flood", icon: ShieldAlert, label: "Flood Monitoring" },
  { href: "/health", icon: Activity, label: "City Health" },

  { href: "/crime", icon: ShieldAlert, label: "Crime Intel" },
  { href: "/hospital", icon: Hospital, label: "Hospital Capacity" },
  { href: "/risk", icon: Hexagon, label: "Risk Matrix" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  useResilienceWebSocket();

  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-full flex bg-background text-foreground overflow-hidden">

      {/* SIDEBAR */}

      <aside className="hidden lg:flex w-64 flex-col border-r border-border/40 bg-card/40 backdrop-blur-xl">

        <div className="p-6 border-b border-border/40">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Delhi Smart City
          </h1>

          <p className="text-xs text-muted-foreground mt-1 font-mono">
            OPERATIONS CENTER
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1">

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all relative",
                location === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >

              {location === item.href && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-lg border-l-2 border-primary bg-gradient-to-r from-primary/10 to-transparent"
                />
              )}

              <item.icon className="w-5 h-5 shrink-0" />

              <span>{item.label}</span>

            </Link>
          ))}

        </nav>

        <div className="p-4 border-t border-border/40">

          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-4 rounded-xl border border-indigo-500/20">

            <h4 className="text-sm font-semibold text-indigo-200 mb-1">
              System Status
            </h4>

            <div className="flex items-center gap-2">

              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-70"></span>
                <span className="relative rounded-full h-2 w-2 bg-green-500"></span>
              </span>

              <span className="text-xs text-indigo-300">
                Live Data Stream Active
              </span>

            </div>

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* HEADER */}

        <header className="h-16 border-b border-border/40 bg-background/70 backdrop-blur-md flex items-center gap-6 px-6">

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-secondary/40"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 max-w-md relative hidden md:block">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <input
              placeholder="Search sensors, locations, zones..."
              className="w-full bg-secondary/40 border border-border/40 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />

          </div>

          <div className="flex items-center gap-4 ml-auto">

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/40 border border-border/40">

              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>

              <span className="text-xs font-mono text-muted-foreground">
                LIVE
              </span>

            </div>

            <button className="p-2 rounded-full hover:bg-secondary/40 relative">

              <Bell className="w-5 h-5 text-muted-foreground" />

              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>

            </button>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <div className="flex-1 overflow-y-auto p-6 w-full">
          {children}
        </div>

      </main>

      {/* MOBILE SIDEBAR */}

      <AnimatePresence>

        {isMobileMenuOpen && (

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden bg-black/80"
            onClick={() => setIsMobileMenuOpen(false)}
          >

            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r p-4"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="flex items-center justify-between mb-8">

                <h2 className="text-xl font-bold">
                  Delhi Smart City
                </h2>

                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>

              </div>

              <nav className="space-y-2">

                {NAV_ITEMS.map((item) => (

                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary/40"
                  >

                    <item.icon className="w-5 h-5" />

                    <span>{item.label}</span>

                  </Link>

                ))}

              </nav>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  );
}

