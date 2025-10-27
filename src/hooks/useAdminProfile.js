// File: src/hooks/useAdminProfile.js

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- IMPORTANT ---
// Make sure this URL matches your backend's IP.
// Your controller uses 192.168.70.163, so this should probably be:
// const API_URL = 'http://192.168.70.163:5000/api/admin';
const API_URL = 'http://localhost:5000/api/admin';

export const useAdminProfile = () => {
    const [profile, setProfile] = useState({ name: 'Admin', companyName: 'Ferrari Mail', logo: '' });
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await axios.get(API_URL);
            
            // --- THIS IS THE FIX ---
            // REMOVED the line: response.data.logo = `http://localhost:5000${response.data.logo}`;
            // The backend is already sending the full URL.
            
            setProfile(response.data);
        } catch (error) {
            console.error("Failed to fetch admin profile:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, refreshProfile: fetchProfile };
};
