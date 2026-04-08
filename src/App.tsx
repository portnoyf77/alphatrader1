import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MockAuthProvider } from "@/contexts/MockAuthContext";
import { AIAssistant } from "@/components/AIAssistant";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DemoGate } from "@/components/DemoGate";
import { usePageView } from "@/hooks/usePageView";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Invest from "./pages/Invest";
import Simulation from "./pages/Simulation";
import StrategyDetail from "./pages/StrategyDetail";
import PortfolioOwnerDetail from "./pages/PortfolioOwnerDetail";
import Explore from "./pages/Explore";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";

import NotFound from "./pages/NotFound";
import FAQ from "./pages/FAQ";
import AdminAnalytics from "./pages/AdminAnalytics";
import { AlpacaConnectionTest } from "@/components/AlpacaConnectionTest";
import PaperTrading from "./pages/PaperTrading";
import Portfolio from "./pages/Portfolio";
import Research from "./pages/Research";
import PortfolioBuilder from "./pages/PortfolioBuilder";

const queryClient = new QueryClient();

function PageViewTracker() {
  usePageView();
  return null;
}

/** Demo gate + main app routes (everything except `/test-alpaca`). */
function GatedApp() {
  const [accessGranted, setAccessGranted] = useState(
    () => localStorage.getItem("demoAccessGranted") === "true",
  );

  if (!accessGranted) {
    return (
      <DemoGate
        onAccessGranted={() => {
          localStorage.setItem("demoAccessGranted", "true");
          setAccessGranted(true);
        }}
      />
    );
  }

  return (
    <>
      <PageViewTracker />
      <AIAssistant />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/faq" element={<FAQ />} />

        {/* Profile setup (protected but no profile-redirect loop) */}
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute skipProfileCheck>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/invest"
          element={
            <ProtectedRoute>
              <Invest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulation/:id"
          element={
            <ProtectedRoute>
              <Simulation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio/:id"
          element={
            <ProtectedRoute allowExpiredTrial>
              <StrategyDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/strategy/:id"
          element={<Navigate to={window.location.pathname.replace("/strategy/", "/portfolio/")} replace />}
        />
        <Route
          path="/dashboard/portfolio/:id"
          element={
            <ProtectedRoute>
              <PortfolioOwnerDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio-tracker"
          element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/research"
          element={
            <ProtectedRoute>
              <Research />
            </ProtectedRoute>
          }
        />
        <Route
          path="/build"
          element={
            <ProtectedRoute>
              <PortfolioBuilder />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Bypasses DemoGate and all gated routes */}
              <Route path="/test-alpaca" element={<AlpacaConnectionTest />} />
              <Route path="/paper-trading" element={<PaperTrading />} />
              <Route path="*" element={<GatedApp />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </MockAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
