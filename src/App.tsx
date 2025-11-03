import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ProfilePage } from "./pages/Profile";
import { ReportsPage } from "./pages/Reports";
import { WorkedLeavesPage } from "./pages/WorkedLeaves";
import { AbsencesPage } from "./pages/Absences";
import { AdminPage } from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route path="/dashboard/reports" element={<ReportsPage />} />
          <Route path="/dashboard/ft" element={<WorkedLeavesPage />} />
          <Route path="/dashboard/absence" element={<AbsencesPage />} />
          <Route path="/dashboard/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
