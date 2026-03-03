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
import { useEnsureScrollable } from "@/hooks/useEnsureScrollable";
import { ThemeProvider } from "@/hooks/useThemeContext";

const queryClient = new QueryClient();

function ScrollFixer() {
  useEnsureScrollable();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollFixer />
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
