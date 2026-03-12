import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MockAuthProvider } from "@/contexts/MockAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Docs from "./pages/Docs";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Invest from "./pages/Invest";
import Simulation from "./pages/Simulation";
import StrategyDetail from "./pages/StrategyDetail";
import PortfolioOwnerDetail from "./pages/PortfolioOwnerDetail";
import Explore from "./pages/Explore";
import Dashboard from "./pages/Dashboard";
import Alpha from "./pages/Alpha";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/docs" element={<Docs />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/alpha" element={
              <ProtectedRoute><Alpha /></ProtectedRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/onboarding" element={
              <ProtectedRoute><Onboarding /></ProtectedRoute>
            } />
            <Route path="/invest" element={
              <ProtectedRoute><Invest /></ProtectedRoute>
            } />
            <Route path="/simulation/:id" element={
              <ProtectedRoute><Simulation /></ProtectedRoute>
            } />
            <Route path="/strategy/:id" element={
              <ProtectedRoute><StrategyDetail /></ProtectedRoute>
            } />
            <Route path="/portfolio/:id" element={
              <ProtectedRoute><StrategyDetail /></ProtectedRoute>
            } />
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

export default App;
