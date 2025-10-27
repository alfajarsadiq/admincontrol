// File: src/context/AuthContext.tsx

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the structure of your user/admin object
interface Admin {
    id: string;
    name: string;
    companyName: string;
    email: string;
    logo: string;
    role: string; // --- ADD THIS LINE ---
}

// Define the context type
interface AuthContextType {
    admin: Admin | null;
    setAdmin: (admin: Admin | null) => void;
    logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [admin, setAdmin] = useState<Admin | null>(() => {
        // Initialize state from local storage to keep user logged in across refreshes
        const storedAdmin = localStorage.getItem('adminProfile');
        return storedAdmin ? JSON.parse(storedAdmin) : null;
    });

    // Logout function
    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminProfile');
        setAdmin(null);
        window.location.href = '/login'; // Redirect to login page
    };
    
    // Effect to update local storage when admin state changes
    useEffect(() => {
        if (admin) {
            localStorage.setItem('adminProfile', JSON.stringify(admin));
        } else {
            localStorage.removeItem('adminProfile');
        }
    }, [admin]);

    return (
        <AuthContext.Provider value={{ admin, setAdmin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};