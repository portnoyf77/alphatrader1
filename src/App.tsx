import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Invest from "./pages/Invest";
import Simulation from "./pages/Simulation";
import StrategyDetail from "./pages/StrategyDetail";
import PortfolioOwnerDetail from "./pages/PortfolioOwnerDetail";
import Explore from "./pages/Explore";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/invest" element={<Invest />} />
          <Route path="/simulation/:id" element={<Simulation />} />
          <Route path="/strategy/:id" element={<StrategyDetail />} />
          <Route path="/portfolio/:id" element={<StrategyDetail />} />
          <Route path="/dashboard/portfolio/:id" element={<PortfolioOwnerDetail />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
