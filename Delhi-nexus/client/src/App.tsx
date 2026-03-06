import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar as Sidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";

/* ===== Core Platform ===== */
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import TrafficPage from "@/pages/traffic";
import PollutionPage from "@/pages/pollution";
import PredictionsPage from "@/pages/predictions";
import AlertsPage from "@/pages/alerts";

/* ===== Resilience Engine ===== */
import FloodDashboard from "@/pages/flood-dashboard";
import HealthDashboard from "@/pages/health-dashboard";

/* ===== Geo Intelligence ===== */
import CrimeDashboard from "@/pages/CrimeDashboard";
import HospitalDashboard from "@/pages/HospitalDashboard";
import RiskDashboard from "@/pages/RiskDashboard";

/* ===== WebSocket ===== */
import { useResilienceWebSocket } from "@/hooks/use-websocket";
import { Layout } from "./components/layout";

/* =================================================
   GLOBAL WEBSOCKET HOOK
================================================= */

function GlobalHooks() {
  useResilienceWebSocket();
  return null;
}

/* =================================================
   ROUTER
================================================= */

function Router() {
  return (
    <Switch>

      {/* Landing */}
      <Route path="/" component={LandingPage} />

      {/* Smart City Dashboard */}
      <Route path="/dashboard" component={Dashboard} />

      {/* Environment */}
      <Route path="/traffic" component={TrafficPage} />
      <Route path="/pollution" component={PollutionPage} />

      {/* AI */}
      <Route path="/predictions" component={PredictionsPage} />

      {/* Alerts */}
      <Route path="/alerts" component={AlertsPage} />

      {/* Resilience Engine */}
      <Route path="/flood" component={FloodDashboard} />
      <Route path="/health" component={HealthDashboard} />

      {/* Geo Intelligence */}
      <Route path="/crime" component={CrimeDashboard} />
      <Route path="/hospital" component={HospitalDashboard} />
      <Route path="/risk" component={RiskDashboard} />

      {/* 404 */}
      <Route component={NotFound} />

    </Switch>
  );
}

/* =================================================
   APP
================================================= */

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>

        <SidebarProvider>

<Layout>
  <Router />
</Layout>
</SidebarProvider>

        <Toaster />
        <GlobalHooks />

      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;