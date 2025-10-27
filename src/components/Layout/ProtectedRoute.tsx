// File: src/components/Layout/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from './DashboardLayout';

// --- UPDATED to accept adminOnly prop ---
export const ProtectedRoute = ({ adminOnly = false }: { adminOnly?: boolean }) => {
    const { admin } = useAuth();
    const token = localStorage.getItem('authToken');

    // If there's no token and no admin in context, redirect to login
    if (!token && !admin) {
        return <Navigate to="/login" replace />;
    }

    // If token exists, but context is still loading, admin might be null.
    // We show null to prevent the layout from flashing before redirect.
    if (token && !admin) {
        // You could return a full-page loading spinner here
        return null; 
    }

    // If auth is loaded
    if (admin) {
        // If this route is 'adminOnly' and the user is NOT an 'admin'
        if (adminOnly && admin.role !== 'admin') {
            // Redirect non-admins to a page they can access
            return <Navigate to="/lr-generator" replace />;
        }
    }

    // If authenticated and authorized, render the requested component within the layout
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    );
};