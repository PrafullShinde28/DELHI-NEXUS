import { Link, useLocation } from "wouter";
import {
  ShieldAlert,
  Activity,
  Hexagon,
  Map,
  BarChart3,
  Wind,
  Brain,
  Bell,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* =================================================
   NAV STRUCTURE (Grouped Properly)
================================================= */

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        color: "text-primary",
      },
      {
        href: "/traffic",
        label: "Traffic",
        icon: BarChart3,
        color: "text-primary",
      },
      {
        href: "/pollution",
        label: "Pollution",
        icon: Wind,
        color: "text-accent",
      },
      {
        href: "/predictions",
        label: "Predictions",
        icon: Brain,
        color: "text-warning",
      },
      {
        href: "/alerts",
        label: "Alerts",
        icon: Bell,
        color: "text-destructive",
      },
    ],
  },
  {
    title: "Geo Intelligence",
    items: [
      {
        href: "/crime",
        label: "Crime Intel",
        icon: ShieldAlert,
        color: "text-destructive",
      },
      {
        href: "/hospital",
        label: "Health Capacity",
        icon: Activity,
        color: "text-primary",
      },
      {
        href: "/risk",
        label: "Multi-Risk Matrix",
        icon: Hexagon,
        color: "text-warning",
      },
    ],
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-72 h-screen flex flex-col border-r border-border/50 bg-card/50 backdrop-blur-2xl z-50">
      {/* Header */}
      <div className="p-6 flex items-center gap-3 border-b border-border/30">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)]">
          <Map className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight text-gradient">
            NCR Sentinel
          </h1>
          <p className="text-xs text-muted-foreground">Geo-Intelligence Hub</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-4 overflow-y-auto space-y-8">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.title}
            </div>

            <div className="space-y-2">
              {section.items.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href} className="block">
                    <div
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer group",
                        isActive
                          ? "bg-primary/10 border border-primary/20 shadow-[inset_0_0_20px_rgba(14,165,233,0.05)]"
                          : "hover:bg-white/5 border border-transparent",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "w-5 h-5 transition-transform group-hover:scale-110",
                            isActive ? item.color : "text-muted-foreground",
                          )}
                        />
                        <span
                          className={cn(
                            "font-medium",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {item.label}
                        </span>
                      </div>

                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border/30 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">System Config</span>
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Disconnect</span>
        </button>
      </div>
    </aside>
  );
}
