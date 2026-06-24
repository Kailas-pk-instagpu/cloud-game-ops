import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/shared/ui/organisms/DashboardLayout";
import { RoleGuard } from "@/shared/lib/RoleGuard";
import { useAuthStore } from "@/shared/lib/store";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Verify2FAPage from "./pages/Verify2FAPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import GPUNodesPage from "./pages/GPUNodesPage";
import BranchesPage from "./pages/BranchesPage";
import SeatsPage from "./pages/SeatsPage";
import BookingsPage from "./pages/BookingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import BillingSessionPage from "./pages/BillingSessionPage";
import SettlementsPage from "./pages/SettlementsPage";
import MonitoringPage from "./pages/MonitoringPage";
import DeletionRequestsPage from "./pages/DeletionRequestsPage";
import IssuesPage from "./pages/IssuesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    useAuthStore.getState().init();
  }, []);
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-2fa" element={<Verify2FAPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<DashboardLayout />}>
            {/* POC: only Cafe Owner + Manager routes are reachable. */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/branches" element={<RoleGuard roles={['cafe_owner']}><BranchesPage /></RoleGuard>} />
            <Route path="/seats" element={<RoleGuard roles={['manager']}><SeatsPage /></RoleGuard>} />
            <Route path="/bookings" element={<RoleGuard roles={['cafe_owner', 'manager']}><BookingsPage /></RoleGuard>} />
            <Route path="/notifications" element={<RoleGuard roles={['cafe_owner', 'manager']}><NotificationsPage /></RoleGuard>} />
            <Route path="/settings" element={<RoleGuard roles={['cafe_owner', 'manager']}><SettingsPage /></RoleGuard>} />
            <Route path="/billing/session" element={<RoleGuard roles={['cafe_owner', 'manager']}><BillingSessionPage /></RoleGuard>} />
            <Route path="/billing/settlements" element={<RoleGuard roles={['cafe_owner', 'manager']}><SettlementsPage /></RoleGuard>} />
            {/* Hidden in POC — kept guarded so they exist for the full product. */}
            <Route path="/users" element={<RoleGuard roles={['super_admin']}><UsersPage /></RoleGuard>} />
            <Route path="/gpu-nodes" element={<RoleGuard roles={['super_admin']}><GPUNodesPage /></RoleGuard>} />
            <Route path="/analytics" element={<RoleGuard roles={['super_admin']}><AnalyticsPage /></RoleGuard>} />
            <Route path="/monitoring" element={<RoleGuard roles={['super_admin']}><MonitoringPage /></RoleGuard>} />
            <Route path="/deletion-requests" element={<RoleGuard roles={['super_admin']}><DeletionRequestsPage /></RoleGuard>} />
            <Route path="/issues" element={<RoleGuard roles={['super_admin']}><IssuesPage /></RoleGuard>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
