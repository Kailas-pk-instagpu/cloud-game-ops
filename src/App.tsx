import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/shared/ui/organisms/DashboardLayout";
import { PermissionGuard } from "@/shared/lib/PermissionGuard";
import LoginPage from "./pages/LoginPage";
import Verify2FAPage from "./pages/Verify2FAPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import ApprovalsPage from "./pages/ApprovalsPage";
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
import IssuesPage from "./pages/IssuesPage";
import BranchBillingPage from "./pages/BranchBillingPage";
import PermissionsPage from "./pages/PermissionsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-2fa" element={<Verify2FAPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<PermissionGuard permission="users.view"><UsersPage /></PermissionGuard>} />
            <Route path="/approvals" element={<PermissionGuard permission="approvals.view"><ApprovalsPage /></PermissionGuard>} />
            <Route path="/gpu-nodes" element={<PermissionGuard permission="gpu_nodes.view"><GPUNodesPage /></PermissionGuard>} />
            <Route path="/branches" element={<PermissionGuard permission="branches.view"><BranchesPage /></PermissionGuard>} />
            <Route path="/seats" element={<PermissionGuard permission="seats.operate.view"><SeatsPage /></PermissionGuard>} />
            <Route path="/bookings" element={<PermissionGuard hidden><BookingsPage /></PermissionGuard>} />
            <Route path="/analytics" element={<PermissionGuard permission="analytics.view"><AnalyticsPage /></PermissionGuard>} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/billing" element={<PermissionGuard permission="billing.view"><BranchBillingPage /></PermissionGuard>} />
            <Route path="/billing/usage" element={<PermissionGuard permission="billing.view"><BranchBillingPage /></PermissionGuard>} />
            <Route path="/billing/history" element={<PermissionGuard permission="billing.view"><BranchBillingPage /></PermissionGuard>} />
            <Route path="/billing/session" element={<PermissionGuard permission="sessions.view"><BillingSessionPage /></PermissionGuard>} />
            <Route path="/billing/settlements" element={<PermissionGuard permission="settlements.view"><SettlementsPage /></PermissionGuard>} />
            <Route path="/monitoring" element={<PermissionGuard permission="monitoring.view"><MonitoringPage /></PermissionGuard>} />
            <Route path="/permissions" element={<PermissionGuard permission="permissions.manage"><PermissionsPage /></PermissionGuard>} />
            <Route path="/issues" element={<PermissionGuard permission="issues.view"><IssuesPage /></PermissionGuard>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
