// File: App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/Layout/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CampaignReports from "./pages/CampaignReports";
import EmailSettings from "./pages/EmailSettings";
import EmailTemplates from "./pages/EmailTemplates";
import Subscribers from "./pages/Subscribers";
import Campaigns from "./pages/Campaigns";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import LrGeneratorPage from "./pages/LrGeneratorPage";
import OrderPage from "./pages/OrderPage";
import ProductManagementPage from "./pages/ProductManagementPage";
import SalespersonManagementPage from "./pages/SalespersonManagementPage";
import OrderFormGeneratorPage from "./pages/OrderFormGeneratorPage";
import { UserManagementPage } from "./pages/UserManagementPage"; 
// 🔥 NEW IMPORT: Order Status Check Page
import OrderStatusCheckPage from "./pages/OrderStatusCheckPage";
// 🔥 NEW IMPORT: Order Report Page
import OrderReportPage from "./pages/OrderReportPage";


const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* --- Routes for ADMINS ONLY (Uses ProtectedRoute with adminOnly prop) --- */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/campaign-reports" element={<CampaignReports />} />
              <Route path="/email-settings" element={<EmailSettings />} />
              <Route path="/email-templates" element={<EmailTemplates />} />
              <Route path="/subscribers" element={<Subscribers />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/products" element={<ProductManagementPage />} />
              <Route path="/salespersons" element={<SalespersonManagementPage />} />
              <Route path="/users" element={<UserManagementPage />} /> 

              {/* 🔥 NEW ROUTE: Monthly Order Reports (Admin Only) */}
              <Route path="/reports/orders" element={<OrderReportPage />} /> 
            </Route>

            {/* --- Routes for ALL LOGGED-IN USERS (Uses ProtectedRoute without adminOnly) --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/lr-generator" element={<LrGeneratorPage />} />
              <Route path="/orders" element={<OrderPage />} />
              <Route path="/invoice-generator" element={<OrderFormGeneratorPage />} />
              <Route path="/order-status-check" element={<OrderStatusCheckPage />} /> 
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
