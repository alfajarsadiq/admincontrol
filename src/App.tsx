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
// --- 1. IMPORT THE RENAMED COMPONENT ---
// (Assuming you renamed the file as requested)
import OrderFormGeneratorPage from "./pages/OrderFormGeneratorPage";


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

            {/* --- Routes for ADMINS ONLY --- */}
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
            </Route>

            {/* --- Routes for ALL LOGGED-IN USERS (including admin) --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/lr-generator" element={<LrGeneratorPage />} />
              <Route path="/orders" element={<OrderPage />} />
              {/* --- 2. USE THE RENAMED COMPONENT --- */}
              {/* The path is still /invoice-generator for simplicity */}
              <Route path="/invoice-generator" element={<OrderFormGeneratorPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;