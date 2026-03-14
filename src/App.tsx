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
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Invest from "./pages/Invest";
import Simulation from "./pages/Simulation";
import StrategyDetail from "./pages/StrategyDetail";
import PortfolioOwnerDetail from "./pages/PortfolioOwnerDetail";
import Explore from "./pages/Explore";
import Dashboard from "./pages/Dashboard";
import Alpha from "./pages/Alpha";
import NotFound from "./pages/NotFound";
import FAQ from "./pages/FAQ";

const queryClient = new QueryClient();

const App = () => {
  const isLovablePreview = window.location.hostname.includes('lovable.app') || window.location.hostname.includes('lovableproject.com');

  const [accessGranted, setAccessGranted] = useState(
    () => isLovablePreview || localStorage.getItem('demoAccessGranted') === 'true'
  );

  if (!accessGranted) {
    return (
      <DemoGate onAccessGranted={() => {
        localStorage.setItem('demoAccessGranted', 'true');
        setAccessGranted(true);
      }} />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/alpha" element={
                <ProtectedRoute allowExpiredTrial><Alpha /></ProtectedRoute>
              } />
              
              {/* Protected routes */}
              <Route path="/invest" element={
                <ProtectedRoute><Invest /></ProtectedRoute>
              } />
              <Route path="/simulation/:id" element={
                <ProtectedRoute><Simulation /></ProtectedRoute>
              } />
              <Route path="/portfolio/:id" element={
                <ProtectedRoute allowExpiredTrial><StrategyDetail /></ProtectedRoute>
              } />
              {/* Redirect /strategy/:id to /portfolio/:id for backwards compatibility */}
              <Route path="/strategy/:id" element={<Navigate to={window.location.pathname.replace('/strategy/', '/portfolio/')} replace />} />
              <Route path="/dashboard/portfolio/:id" element={
                <ProtectedRoute><PortfolioOwnerDetail /></ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </MockAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
