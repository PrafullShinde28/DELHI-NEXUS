import { Activity, ShieldAlert, Map as MapIcon, DatabaseZap } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();

  const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: MapIcon },
  { title: "Traffic", url: "/traffic", icon: Activity },
  { title: "Air Quality", url: "/pollution", icon: Activity },
  { title: "Predictions", url: "/predictions", icon: DatabaseZap },
  { title: "Alerts", url: "/alerts", icon: ShieldAlert },

  { title: "Flood Monitoring", url: "/flood", icon: ShieldAlert },
  { title: "City Health", url: "/health", icon: Activity },

  { title: "Crime Intel", url: "/crime", icon: ShieldAlert },
  { title: "Hospital Capacity", url: "/hospital", icon: Activity },
  { title: "Risk Matrix", url: "/risk", icon: DatabaseZap },
];

  return (
    <Sidebar className="border-r-border/50">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/50">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <MapIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase text-foreground">NCR RESILIENCE</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-mono text-xs uppercase tracking-wider mb-2">Dashboards</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`
                        transition-all duration-200 
                        ${isActive ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'hover:bg-secondary/50 text-muted-foreground'}
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3 py-2 w-full cursor-pointer">
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-primary text-glow' : ''}`} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-muted-foreground font-mono text-xs uppercase tracking-wider mb-2">System Status</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 py-3 bg-secondary/30 rounded-xl border border-border/50 m-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">Sensors</span>
                <span className="text-xs text-success flex items-center gap-1.5 font-mono"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> ONLINE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">Stream</span>
                <span className="text-xs text-success flex items-center gap-1.5 font-mono"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> ACTIVE</span>
              </div>
              <div className="h-px w-full bg-border/50 my-1"></div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <DatabaseZap className="w-3 h-3" />
                <span>DELHI NEXUS • NCR SENTINEL</span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
